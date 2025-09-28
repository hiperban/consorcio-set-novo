'use client';
import { useMemo, useState } from 'react';

export default function Filters({ data, onApply }){
  // estados simples (sem máscara pra não atrapalhar o Apply)
  const [minCarta, setMinCarta] = useState('');
  const [maxCarta, setMaxCarta] = useState('');
  const [admin, setAdmin] = useState('');
  const [produto, setProduto] = useState('');
  const [tipo, setTipo] = useState('');
  const [lanceMin, setLanceMin] = useState('');
  const [prazo, setPrazo] = useState('');

  // opções (usando o que está nos grupos carregados)
  const adminOptions = useMemo(() => {
    const s = new Set();
    (data?.grupos || []).forEach(g => s.add(g.__adminName || g.nomeAdministradora || ''));
    return Array.from(s).filter(Boolean).sort((a,b)=> a.localeCompare(b,'pt-BR'));
  }, [data]);

  // produto depende da admin selecionada (pra evitar produtos “das outras”)
  const productOptions = useMemo(() => {
    const s = new Set();
    (data?.grupos || []).forEach(g => {
      if (admin && (g.__adminName || g.nomeAdministradora) !== admin) return;
      if (g?.produto) s.add(g.produto);
    });
    return Array.from(s).filter(Boolean).sort((a,b)=> a.localeCompare(b,'pt-BR'));
  }, [data, admin]);

  const aplicar = () => {
    onApply({
      minCarta: minCarta ? parseFloat(minCarta) : undefined,
      maxCarta: maxCarta ? parseFloat(maxCarta) : undefined,
      admin: admin || '',
      produto: produto || '',
      tipo: tipo || '',
      lanceMin: lanceMin ? parseFloat(lanceMin) : undefined,
      prazo: prazo ? parseInt(prazo, 10) : undefined,
    });
  };

  const limpar = () => {
    setMinCarta(''); setMaxCarta('');
    setAdmin(''); setProduto('');
    setTipo(''); setLanceMin(''); setPrazo('');
    onApply({}); // zera na página também
  };

  return (
    <div className="card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Valor Carta Mín</label>
        <input value={minCarta} onChange={e=>setMinCarta(e.target.value)} placeholder="ex.: 5000" className="w-full border rounded-2xl px-3 py-2"/>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Valor Carta Máx</label>
        <input value={maxCarta} onChange={e=>setMaxCarta(e.target.value)} placeholder="ex.: 50000" className="w-full border rounded-2xl px-3 py-2"/>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Administradora</label>
        <select value={admin} onChange={e=>{ setAdmin(e.target.value); setProduto(''); }} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todas</option>
          {adminOptions.map(n => (<option key={n} value={n}>{n}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Produto</label>
        <select value={produto} onChange={e=>setProduto(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todos</option>
          {productOptions.map(p => (<option key={p} value={p}>{p}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Tipo de Grupo</label>
        <select value={tipo} onChange={e=>setTipo(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todos</option>
          <option value="PARCELA INTEGRAL">Parcela Integral</option>
          <option value="PARCELA REDUZIDA">Parcela Reduzida</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">% Lance Mínimo</label>
        <input value={lanceMin} onChange={e=>setLanceMin(e.target.value)} placeholder="ex.: 20" className="w-full border rounded-2xl px-3 py-2"/>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Prazo (meses)</label>
        <input value={prazo} onChange={e=>setPrazo(e.target.value)} placeholder="ex.: 96" className="w-full border rounded-2xl px-3 py-2"/>
      </div>

      <div className="col-span-full flex justify-end gap-2">
        <button onClick={limpar} className="px-4 py-2 rounded-2xl border">Limpar</button>
        <button onClick={aplicar} className="px-4 py-2 rounded-2xl bg-brand-600 text-white">Aplicar</button>
      </div>
    </div>
  );
}
