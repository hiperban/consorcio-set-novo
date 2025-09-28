'use client';
import { useState, useMemo } from 'react';

export default function Filters({ data, onApply }) {
  const [minCarta, setMinCarta] = useState('');
  const [maxCarta, setMaxCarta] = useState('');
  const [admin, setAdmin] = useState('');
  const [produto, setProduto] = useState('');
  const [tipo, setTipo] = useState('');
  const [lanceMin, setLanceMin] = useState('');
  const [prazo, setPrazo] = useState('');

  const admins = useMemo(() => {
    const set = new Set((data?.grupos || []).map(g => g.nomeAdministradora));
    return Array.from(set);
  }, [data]);

  const produtos = useMemo(() => {
    const set = new Set((data?.grupos || []).map(g => g.produto));
    return Array.from(set);
  }, [data]);

  const aplicar = () => {
    onApply({
      minCarta: minCarta ? parseFloat(minCarta) : undefined,
      maxCarta: maxCarta ? parseFloat(maxCarta) : undefined,
      admin,
      produto,
      tipo,
      lanceMin: lanceMin ? parseFloat(lanceMin) : undefined,
      prazo: prazo ? parseInt(prazo, 10) : undefined
    });
  };

  const limpar = () => {
    setMinCarta(''); setMaxCarta('');
    setAdmin(''); setProduto('');
    setTipo(''); setLanceMin(''); setPrazo('');
    onApply({});
  };

  return (
    <div className="card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <input placeholder="Carta mín" value={minCarta} onChange={e=>setMinCarta(e.target.value)} className="border rounded px-2 py-1"/>
      <input placeholder="Carta máx" value={maxCarta} onChange={e=>setMaxCarta(e.target.value)} className="border rounded px-2 py-1"/>
      <select value={admin} onChange={e=>setAdmin(e.target.value)} className="border rounded px-2 py-1">
        <option value="">Todas</option>
        {admins.map(a => <option key={a}>{a}</option>)}
      </select>
      <select value={produto} onChange={e=>setProduto(e.target.value)} className="border rounded px-2 py-1">
        <option value="">Todos</option>
        {produtos.map(p => <option key={p}>{p}</option>)}
      </select>
      <select value={tipo} onChange={e=>setTipo(e.target.value)} className="border rounded px-2 py-1">
        <option value="">Todos</option>
        <option value="PARCELA INTEGRAL">Parcela Integral</option>
        <option value="PARCELA REDUZIDA">Parcela Reduzida</option>
      </select>
      <input placeholder="% Lance Mín" value={lanceMin} onChange={e=>setLanceMin(e.target.value)} className="border rounded px-2 py-1"/>
      <input placeholder="Prazo (meses)" value={prazo} onChange={e=>setPrazo(e.target.value)} className="border rounded px-2 py-1"/>
      
      <div className="col-span-full flex gap-2 justify-end mt-2">
        <button onClick={aplicar} className="bg-brand-600 text-white px-4 py-2 rounded">Aplicar</button>
        <button onClick={limpar} className="bg-gray-200 px-4 py-2 rounded">Limpar</button>
      </div>
    </div>
  );
}
