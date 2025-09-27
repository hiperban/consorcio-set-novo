'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';

/** Junta vários datasets do /public/data */
function mergeDatasets(list) {
  const admMap = new Map(); // id -> {id,nome}
  const grupos = [];
  for (const d of list) {
    (d?.administradoras || []).forEach(a => { if (!admMap.has(a.id)) admMap.set(a.id, a); });
    (d?.grupos || []).forEach(g => grupos.push(g));
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

export default function Home() {
  const [data, setData] = useState({ administradoras: [], grupos: [] });
  const [filters, setFilters] = useState({});
  const [compare, setCompare] = useState([]);

  useEffect(() => {
    async function loadAll() {
      try {
        const man = await fetch('/data/_manifest.json', { cache: 'no-store' }).then(r => r.json());
        const files = Array.isArray(man.datasets) ? man.datasets : [];
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

  // aplica filtros básicos (mesma lógica que você já tinha)
  const filtered = useMemo(() => {
    const {
      minCarta, maxCarta, adm, lanceMin, produto, tipoGrupo, prazo
    } = filters || {};
    return (data.grupos || []).filter(g => {
      const okMin = minCarta == null ? true : g.valorCarta >= minCarta;
      const okMax = maxCarta == null ? true : g.valorCarta <= maxCarta;
      const okAdm = !adm ? true : (g.nomeAdministradora || '').toUpperCase() === String(adm).toUpperCase();
      const okLance = lanceMin == null ? true : (Number(g.lanceMedio) >= Number(lanceMin));
      const okProd = !produto ? true : String(g.produto).normalize('NFD').replace(/\p{Diacritic}/gu,'').toUpperCase()
                               === String(produto).normalize('NFD').replace(/\p{Diacritic}/gu,'').toUpperCase();
      const okTipo = !tipoGrupo ? true : String(g.tipoGrupo).toUpperCase() === String(tipoGrupo).toUpperCase();
      const okPrazo = prazo == null ? true : Number(g.prazo) === Number(prazo);
      return okMin && okMax && okAdm && okLance && okProd && okTipo && okPrazo;
    });
  }, [data, filters]);

  function onCompareToggle(group, checked) {
    setCompare(prev => {
      const set = new Set(prev.map(x => x.id));
      if (checked) {
        if (!set.has(group.id)) return [...prev, group];
        return prev;
      } else {
        return prev.filter(x => x.id !== group.id);
      }
    });
    // salva no localStorage (usado no compare)
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

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(415px,1fr))]">
        {filtered.map(g => (
          <GroupCard key={g.id} group={g} onCompareToggle={onCompareToggle} />
        ))}
      </div>
    </main>
  );
}
