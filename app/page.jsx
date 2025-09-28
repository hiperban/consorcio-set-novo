'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';

/* ===== Helpers de normalização e números tolerantes ===== */
function N(v) {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}
function slugKey(v){
  const t = N(v);
  const k = t.replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
  return k || 'OUTROS_BENS';
}
function numLoose(v){
  if (typeof v === 'number') return v;
  const s = String(v ?? '').trim();
  if (!s) return NaN;
  // mantém dígitos, ponto, vírgula e sinal
  let t = s.replace(/[^\d,-.]/g, '');
  // se tem vírgula e ponto, assume . = milhar e , = decimal
  if (t.includes(',') && t.includes('.')) t = t.replace(/\./g,'').replace(',', '.');
  else if (t.includes(',') && !t.includes('.')) t = t.replace(',', '.');
  return parseFloat(t);
}
function intLoose(v){
  if (typeof v === 'number') return Math.trunc(v);
  const m = String(v ?? '').match(/\d+/);
  return m ? parseInt(m[0], 10) : NaN;
}

/* ===== Merge datasets ===== */
function mergeDatasets(list) {
  const admMap = new Map();
  const grupos = [];
  for (const d of list || []) {
    const adms = Array.isArray(d?.administradoras) ? d.administradoras : [];
    const gs   = Array.isArray(d?.grupos) ? d.grupos : [];
    adms.forEach(a => { if (a?.id && !admMap.has(a.id)) admMap.set(String(a.id), a); });
    gs.forEach(g => grupos.push(g));
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

/* Deriva NOME da administradora para chavear por nome (estável entre arquivos) */
function adminKeyFromGroup(g, administradorasMap) {
  const id = String(g?.administradoraId ?? '');
  const byId = administradorasMap.get(id)?.nome;
  const name = byId || g?.nomeAdministradora || '';
  return N(name);
}

export default function Home() {
  const [data, setData] = useState({ administradoras: [], grupos: [] });
  const [filters, setFilters] = useState({});
  const [compare, setCompare] = useState([]);

  const administradorasMap = useMemo(() => {
    const m = new Map();
    (data?.administradoras || []).forEach(a => { if (a?.id) m.set(String(a.id), a); });
    return m;
  }, [data]);

  useEffect(() => {
    async function loadAll() {
      try {
        const man = await fetch('/data/_manifest.json', { cache: 'no-store' }).then(r => r.json());
        const files = Array.isArray(man?.datasets) ? man.datasets : [];
        const datasets = await Promise.all(
          files.map(f => fetch(`/data/${f}`, { cache: 'no-store' }).then(r => r.json()))
        );
        setData(mergeDatasets(datasets));
      } catch (e) {
        console.error('Erro ao carregar datasets:', e);
        setData({ administradoras: [], grupos: [] });
      }
    }
    loadAll();
  }, []);

  /* ===== Aplicação dos filtros ===== */
  const filtered = useMemo(() => {
    const { minCarta, maxCarta, adminKey, productKey, tipoKey, lanceMin, prazo } = filters || {};
    return (data.grupos || []).filter(g => {
      // números tolerantes
      const valorCarta = numLoose(g?.valorCarta);
      const lanceMedio = numLoose(g?.lanceMedio);
      const prazoMeses = intLoose(g?.prazo);

      const okMin   = (minCarta == null) ? true : valorCarta >= Number(minCarta);
      const okMax   = (maxCarta == null) ? true : valorCarta <= Number(maxCarta);

      const gAdmKey = adminKeyFromGroup(g, administradorasMap);
      const okAdm   = !adminKey ? true : gAdmKey === String(adminKey);

      const gProdKey = slugKey(g?.produto);
      const okProd  = !productKey ? true : gProdKey === String(productKey);

      const okTipo  = !tipoKey ? true : N(g?.tipoGrupo) === String(tipoKey);

      const okLance = (lanceMin == null) ? true : lanceMedio >= Number(lanceMin);

      const okPrazo = (prazo == null) ? true : prazoMeses === Number(prazo);

      return okMin && okMax && okAdm && okProd && okTipo && okLance && okPrazo;
    });
  }, [data, filters, administradorasMap]);

  function onCompareToggle(group, checked) {
    setCompare(prev => {
      const set = new Set(prev.map(x => x.id));
      if (checked) { if (!set.has(group.id)) return [...prev, group]; return prev; }
      return prev.filter(x => x.id !== group.id);
    });
    try {
      const ids = (checked ? [...compare, group] : compare.filter(x => x.id !== group.id)).map(x => x.id);
      localStorage.setItem('compareSelection', JSON.stringify(ids));
    } catch {}
  }

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-800">Simulador de Consórcio</h1>
        <p className="text-sm text-gray-600">Filtros dinâmicos, visual moderno e contratação direta.</p>
      </header>

      <Filters data={data} onFilterChange={setFilters} />

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
        {filtered.map(g => (
          <GroupCard key={g.id} group={g} onCompareToggle={onCompareToggle} />
        ))}
      </div>
    </main>
  );
}
