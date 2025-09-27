'use client';
import { useEffect, useMemo, useState } from 'react';

function normalize(v){
  if (v === undefined || v === null) return '';
  return String(v).normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
}

export default function Filters({ data, onFilterChange }){
  const [minCarta, setMinCarta] = useState('');
  const [maxCarta, setMaxCarta] = useState('');
  const [adm, setAdm] = useState('');
  const [lanceMin, setLanceMin] = useState('');
  const [produto, setProduto] = useState('');
  const [tipoGrupo, setTipoGrupo] = useState('');
  const [prazo, setPrazo] = useState('');

  const administradoras = useMemo(() => (data?.administradoras || []).map(a => a.nome), [data]);
  const produtos = useMemo(() => {
    const set = new Set((data?.grupos||[]).map(g => normalize(g.produto)));
    return Array.from(set).filter(Boolean);
  }, [data]);

  useEffect(()=>{
    const min = minCarta === '' ? undefined : parseFloat(minCarta);
    const max = maxCarta === '' ? undefined : parseFloat(maxCarta);
    const lance = lanceMin === '' ? undefined : parseFloat(lanceMin);
    const prazoNum = prazo === '' ? undefined : parseInt(prazo, 10);

    onFilterChange({
      minCarta: Number.isNaN(min) ? undefined : min,
      maxCarta: Number.isNaN(max) ? undefined : max,
      adm,
      lanceMin: Number.isNaN(lance) ? undefined : lance,
      produto,
      tipoGrupo,
      prazo: Number.isNaN(prazoNum) ? undefined : prazoNum
    });
  }, [minCarta, maxCarta, adm, lanceMin, produto, tipoGrupo, prazo, onFilterChange]);

  const onAdmChange = (value) => { setAdm(value); setProduto(''); setTipoGrupo(''); };

  return (
    <div className="card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Valor Carta Mín (R$)</label>
        <input value={minCarta} onChange={e=>setMinCarta(e.target.value)} inputMode="numeric" className="w-full border rounded-2xl px-3 py-2"/>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Valor Carta Máx (R$)</label>
        <input value={maxCarta} onChange={e=>setMaxCarta(e.target.value)} inputMode="numeric" className="w-full border rounded-2xl px-3 py-2"/>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Administradora</label>
        <select value={adm} onChange={e=>onAdmChange(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todas</option>
          {administradoras.map((n)=>(<option key={n} value={n}>{n}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">% Lance Mínimo</label>
        <input value={lanceMin} onChange={e=>setLanceMin(e.target.value)} inputMode="numeric" placeholder="ex.: 20" className="w-full border rounded-2xl px-3 py-2"/>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Produto</label>
        <select value={produto} onChange={e=>setProduto(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todos</option>
          {produtos.map(p => (<option key={p} value={p}>{p}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Tipo de Grupo</label>
        <select value={tipoGrupo} onChange={e=>setTipoGrupo(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todos</option>
          <option value="PARCELA REDUZIDA">PARCELA REDUZIDA</option>
          <option value="PARCELA INTEGRAL">PARCELA INTEGRAL</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Prazo (meses)</label>
        <input value={prazo} onChange={e=>setPrazo(e.target.value)} inputMode="numeric" className="w-full border rounded-2xl px-3 py-2"/>
      </div>
    </div>
  );
}
