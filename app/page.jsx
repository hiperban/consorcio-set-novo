'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';

/* ========= Helpers robustos ========= */
function N(v){
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}
function slugKey(v){
  const t = N(v);
  const k = t.replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
  return k || 'OUTROS_BENS';
}
function numLoose(v){
  if (v == null) return NaN;
  if (typeof v === 'number') return v;
  let s = String(v).trim();
  if (!s) return NaN;
  s = s.replace(/[^\d,.-]/g, '');
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g,'').replace(',', '.');
  else if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}
function intLoose(v){
  if (v == null) return NaN;
  if (typeof v === 'number') return Math.trunc(v);
  const m = String(v).match(/\d+/);
  return m ? parseInt(m[0], 10) : NaN;
}

/* ========= Merge ========= */
function mergeDatasets(list) {
  const admMap = new Map(); // id -> {id,nome}
  const grupos = [];
  for (const d of list || []) {
    const adms = Array.isArray(d?.administradoras) ? d.administradoras : [];
    const gs   = Array.isArray(d?.grupos) ? d.grupos : [];
    adms.forEach(a => { if (a?.id && !admMap.has(String(a.id))) admMap.set(String(a.id), a); });
    gs.forEach(g => grupos.push(g));
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

function adminKeyFromGroup(g, administradorasMap) {
  const id = String(g?.administradoraId ?? '');
  const byId = administradorasMap.get(id)?.nome;
  const name = byId || g?.nomeAdministradora || '';
  return N(name);
}

export default function Home() {
  const [raw, setRaw] = useState({ administradoras: [], grupos: [] });
  const [filters, setFilters] = useState({});
  const [compare, setCompare] = useState([]);

  // carrega dados
  useEffect(() => {
    (async () => {
      try {
        const man = await fetch('/data/_manifest.json', { cache: 'no-store' }).then(r => r.json());
        const files = Array.isArray(man?.datasets) ? man.datasets : [];
        const datasets = await Promise.all(
          files.map(f => fetch(`/data/${f}`, { cache: 'no-store' }).then(r => r.json()))
        );
        setRaw(mergeDatasets(datasets));
      } catch (e) {
        console.error('Erro ao carregar datasets:', e);
        setRaw({ administradoras: [], grupos: [] });
      }
    })();
  }, []);

  // mapa id->administradora
  const administradorasMap = useMemo(() => {
    const m = new Map();
    (raw?.administradoras || []).forEach(a => { if (a?.id) m.set(String(a.id), a); });
    return m;
  }, [raw]);

  // PREPROCESS: gera campos canônicos e numéricos
  const data = useMemo(() => {
    const grupos = (raw.grupos || []).map((g) => {
      const adminKey = adminKeyFromGroup(g, administradorasMap);
      const productKey = slugKey(g?.produto);
      const tipoKey = N(g?.tipoGrupo);
      const valorCarta = numLoose(g?.valorCarta);
      const valorParcela = numLoose(g?.valorParcela);
      const lanceMedio = numLoose(g?.lanceMedio);
      const prazo = intLoose(g?.prazo);
      return {
        ...g,
        __adminKey: adminKey,
        __productKey: productKey,
        __tipoKey: tipoKey,
        __valorCarta: valorCarta,
        __valorParcela: valorParcela,
        __lanceMedio: lanceMedio,
        __prazo: prazo,
      };
    });
    return { administradoras: raw.administradoras, grupos };
  }, [raw, administradorasMap]);

  // FILTROS (AND estrito) — use os nomes *productKey* e *tipoKey*
  const filtered = useMemo(() => {
    const {
      minCarta, maxCarta,
      adminKey, productKey,
      tipoKey, lanceMin, prazo
    } = filters || {};

    return (data.grupos || []).filter(g => {
      const okMin   = (minCarta == null) ? true : g.__valorCarta >= Number(minCarta);
      const okMax   = (maxCarta == null) ? true : g.__valorCarta <= Number(maxCarta);
      const okAdm   = !adminKey  ? true : g.__adminKey   === String(adminKey);
      const okProd  = !productKey? true : g.__productKey === String(productKey);
      const okTipo  = !tipoKey   ? true : g.__tipoKey    === String(tipoKey);
      const okLance = (lanceMin == null) ? true : g.__lanceMedio >= Number(lanceMin);
      const okPrazo = (prazo == null)    ? true : g.__prazo      === Number(prazo);
      return okMin && okMax && okAdm && okProd && okTipo && okLance && okPrazo;
    });
  }, [data, filters]);

  function onCompareToggle(group, checked) {
    setCompare(prev => {
      const set = new Set(prev.map(x => x.id));
      if (checked) {
        if (!set.has(group.id)) return [...prev, group];
        return prev;
      }
      return prev.filter(x => x.id !== group.id);
    });
    try {
      const next = (checked ? [...compare, group] : compare.filter(x => x.id !== group.id));
      localStorage.setItem('compareSelection', JSON.stringify(next.map(x => x.id)));
    } catch {}
  }

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-800">Simulador de Consórcio</h1>
        <p className="text-sm text-gray-600">Filtros 100% consistentes e defensivos.</p>
      </header>

      <Filters data={data} onFilterChange={setFilters} />

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
        {(filtered || []).map(g => (
          <GroupCard key={g.id ?? `${g.__adminKey}-${g.__productKey}-${g.numeroGrupo ?? Math.random()}`} group={g} onCompareToggle={onCompareToggle} />
        ))}
      </div>
    </main>
  );
}
