'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';

/* ------------ Normalização & helpers ------------ */
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

/* ------------ Merge de datasets ------------ */
function mergeDatasets(list) {
  const admMap = new Map(); // id -> {id,nome}
  const grupos = [];
  for (const d of list || []) {
    const adms = Array.isArray(d?.administradoras) ? d.administradoras : [];
    const gs   = Array.isArray(d?.grupos) ? d.grupos : [];
    adms.forEach(a => { if (a?.id && !admMap.has(a.id)) admMap.set(a.id, a); });
    gs.forEach(g => grupos.push(g));
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

/* ------------ Admin key por NOME ------------ */
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

  // carrega mapa opcional de produtos
  const [prodMap, setProdMap] = useState({ map:{}, labels:{} });
  useEffect(() => {
    (async () => {
      try {
        const j = await fetch('/data/_product-map.json', { cache:'no-store' }).then(r => r.ok ? r.json() : {map:{},labels:{}});
        const map = {};
        Object.entries(j.map || {}).forEach(([raw, key]) => { map[N(raw)] = String(key); });
        setProdMap({ map, labels: j.labels || {} });
      } catch { setProdMap({ map:{}, labels:{} }); }
    })();
  }, []);

  const administradorasMap = useMemo(() => {
    const m = new Map();
    (data?.administradoras || []).forEach(a => { if (a?.id) m.set(String(a.id), a); });
    return m;
  }, [data]);

  useEffect(() => {
      async function () {
  try {
    const man = await fetch('/data/_manifest.json', { cache: 'no-store' }).then(r => r.json());
    const files = Array.isArray(man?.datasets) ? man.datasets : [];

    const results = await Promise.allSettled(
      files.map(f =>
        fetch(`/data/${f}`, { cache: 'no-store' })
          .then(r => {
            if (!r.ok) throw new Error(`Falha ao baixar ${f}: ${r.status}`);
            return r.json();
          })
          .then(j => ({ file: f, data: j }))
      )
    );

    const ok = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value.data);

    // Log gentil de problemas, mas sem quebrar a UI
    results
      .filter(r => r.status === 'rejected')
      .forEach(r => console.warn('[Dataset ignorado]', r.reason));

    setData(mergeDatasets(ok));
  } catch (e) {
    console.error('Erro ao carregar datasets:', e);
    setData({ administradoras: [], grupos: [] });
  }
  async function loadAll() {
  try {
    const man = await fetch('/data/_manifest.json', { cache: 'no-store' }).then(r => r.json());
    const files = Array.isArray(man?.datasets) ? man.datasets : [];

    const results = await Promise.allSettled(
      files.map(f =>
        fetch(`/data/${f}`, { cache: 'no-store' })
          .then(r => {
            if (!r.ok) throw new Error(`Falha ao baixar ${f}: ${r.status}`);
            return r.json();
          })
          .then(j => ({ file: f, data: j }))
      )
    );

    const ok = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value.data);

    // Log gentil de problemas, mas sem quebrar a UI
    results
      .filter(r => r.status === 'rejected')
      .forEach(r => console.warn('[Dataset ignorado]', r.reason));

    setData(mergeDatasets(ok));
  } catch (e) {
    console.error('Erro ao carregar datasets:', e);
    setData({ administradoras: [], grupos: [] });
  }
  }, []);

  // canoniza produto dinamicamente com fallback
  const productKey = (label) => {
    const norm = N(label);
    const mapped = prodMap.map[norm];
    return mapped || slugKey(norm);
  };

  /* ---------- aplica filtros ---------- */
  const filtered = useMemo(() => {
    const { minCarta, maxCarta, admKey, produtoKey, tipoGrupo, lanceMin, prazo } = filters || {};
    return (data.grupos || []).filter(g => {
      const okMin   = minCarta == null ? true : Number(g?.valorCarta ?? 0)  >= Number(minCarta);
      const okMax   = maxCarta == null ? true : Number(g?.valorCarta ?? 0)  <= Number(maxCarta);

      const gAdmKey = adminKeyFromGroup(g, administradorasMap);
      const okAdm   = !admKey ? true : gAdmKey === String(admKey);

      const okProd  = !produtoKey ? true : productKey(g?.produto) === String(produtoKey);
      const okTipo  = !tipoGrupo  ? true : N(g?.tipoGrupo)        === String(tipoGrupo);
      const okLance = lanceMin == null ? true : Number(g?.lanceMedio ?? 0) >= Number(lanceMin);
      const okPrazo = prazo == null    ? true : Number(g?.prazo ?? 0)      === Number(prazo);

      return okMin && okMax && okAdm && okProd && okTipo && okLance && okPrazo;
    });
  }, [data, filters, administradorasMap, prodMap]);

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

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(404px,1fr))]">
        {filtered.map(g => (
          <GroupCard key={g.id} group={g} onCompareToggle={onCompareToggle} />
        ))}
      </div>
    </main>
  );
}
