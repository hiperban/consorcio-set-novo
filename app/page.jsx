'use client';
import { useEffect, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';

export default function Home() {
  const [data, setData] = useState({ grupos: [] });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    (async () => {
      const man = await fetch('/data/_manifest.json').then(r=>r.json());
      const datasets = await Promise.all(man.datasets.map(f => fetch(`/data/${f}`).then(r=>r.json())));
      const grupos = datasets.flatMap(d => d.grupos || []);
      setData({ grupos });
    })();
  }, []);

  const filtered = data.grupos.filter(g => {
    if (filters.minCarta && g.valorCarta < filters.minCarta) return false;
    if (filters.maxCarta && g.valorCarta > filters.maxCarta) return false;
    if (filters.admin && g.nomeAdministradora !== filters.admin) return false;
    if (filters.produto && g.produto !== filters.produto) return false;
    if (filters.tipo && g.tipoGrupo !== filters.tipo) return false;
    if (filters.lanceMin && g.lanceMedio < filters.lanceMin) return false;
    if (filters.prazo && g.prazo !== filters.prazo) return false;
    return true;
  });

  return (
    <main className="container py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-brand-800">Simulador de Consórcio</h1>
      <Filters data={data} onApply={setFilters} />
      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
        {filtered.map(g => <GroupCard key={g.id} group={g} />)}
      </div>
    </main>
  );
}
