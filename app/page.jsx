'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';
import CompareBar from '@/components/CompareBar';

export default function Home() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState([]);

  useEffect(()=>{
    fetch('/data/groups.json')
      .then(r=>r.json())
      .then(setData)
      .catch(()=>setData({ administradoras:[], grupos:[] }));
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
        <h1 className="text-2xl font-bold text-brand-900">Simulador de Consórcio</h1>
        <p className="text-sm text-gray-600">Filtros dinâmicos, visual moderno e contratação direta.</p>
      </div>
      <Filters data={data} onFilterChange={setFilters}/>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(g => (
          <GroupCard key={g.id} group={g} onCompareToggle={onCompareToggle}/>
        ))}
      </div>
      <CompareBar selected={selected}/>
    </div>
  )
}
