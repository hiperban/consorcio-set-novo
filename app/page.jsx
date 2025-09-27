export const dynamic = 'force-dynamic';

'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';
import CompareBar from '@/components/CompareBar';

export default function Home() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState([]);

    useEffect(() => {
  async function loadAll() {
    try {
      const man = await fetch('/data/_manifest.json', { cache: 'no-store' }).then(r => r.json());
      const files = Array.isArray(man.datasets) ? man.datasets : [];
      const datasets = await Promise.all(
        files.map(f => fetch(`/data/${f}`, { cache: 'no-store' }).then(r => r.json()))
      );

      const admMap = new Map();
      const grupos = [];
      for (const d of datasets) {
        (d.administradoras || []).forEach(a => { if (!admMap.has(a.id)) admMap.set(a.id, a); });
        (d.grupos || []).forEach(g => grupos.push(g));
      }
      setData({ administradoras: Array.from(admMap.values()), grupos });
    } catch (e) {
      console.error('Erro ao carregar datasets:', e);
      setData({ administradoras: [], grupos: [] });
    }
  }
  loadAll();
}, []);

  },[]);

  const filtered = useMemo(()=>{
    const list = data?.grupos || [];
    const norm = (s) => (s==null? '' : String(s)).normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toUpperCase();
    return list.filter(g => {
      if (filters.minCarta !== undefined && g.valorCarta < filters.minCarta) return false;
      if (filters.maxCarta !== undefined && g.valorCarta > filters.maxCarta) return false;
      if (filters.adm && norm(g.nomeAdministradora) !== norm(filters.adm)) return false;
      if (filters.lanceMin !== undefined && g.lanceMedio < filters.lanceMin) return false;
      if (filters.produto && norm(g.produto) !== norm(filters.produto)) return false;
      if (filters.tipoGrupo && norm(g.tipoGrupo) !== norm(filters.tipoGrupo)) return false;
      if (filters.prazo !== undefined && g.prazo !== filters.prazo) return false;
      return true;
    });
  }, [data, filters]);

  const onCompareToggle = useCallback((group, checked)=>{
    setSelected(prev=>{
      if (checked){
        if (prev.find(p=>p.id===group.id)) return prev;
        if (prev.length >= 3) { alert('Você pode comparar até 3 grupos.'); return prev; }
        return [...prev, group];
      } else {
        return prev.filter(p=>p.id!==group.id);
      }
    });
  },[]);

  return (
    <div className="flex flex-col gap-6">
      <div className="card bg-gradient-to-r from-brand-50 to-white border-none">
        <h1 className="text-2xl font-bold text-brand-900"> SIMULADOR DE CONSÓRCIO </h1>
        <p className="text-sm text-gray-600">Simule, Compare e Contrate – tudo em um só lugar ✨ </p>
      </div>
      <Filters data={data} onFilterChange={setFilters}/>
<div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(410px,1fr))]">
        {filtered.map(g => (
          <GroupCard key={g.id} group={g} onCompareToggle={onCompareToggle}/>
        ))}
      </div>
      <CompareBar selected={selected}/>
    </div>
  )
}
