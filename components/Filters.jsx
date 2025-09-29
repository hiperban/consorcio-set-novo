'use client';
import { useMemo, useState } from 'react';

/* Normaliza textos para CHAVES CANÔNICAS 1:1 */
function N(v){
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g,' ')
    .trim()
    .toUpperCase();
}
function slugKey(v){
  const t = N(v);
  const k = t.replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
  return k || 'OUTROS_BENS';
}
function toTitle(s){
  return String(s || '')
    .toLowerCase()
    .replace(/(^|[\s_-])([a-zà-ú])/g, (_,p,c)=> p + c.toUpperCase());
}

export default function Filters({ data, onApply }){
  // Estados do formulário (sempre valores canônicos nas chaves)
  const [minCarta, setMinCarta] = useState('');
  const [maxCarta, setMaxCarta] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [productKey, setProductKey] = useState('');
  const [tipoKey, setTipoKey] = useState('');
  const [lanceMin, setLanceMin] = useState('');
  const [prazo, setPrazo] = useState('');

  // Administradoras vindas dos grupos (garante refletir o que existe de fato)
  const adminOptions = useMemo(() => {
    const m = new Map(); // key -> label
    (data?.grupos || []).forEach(g => {
      const key = g.__adminKey;
      const label = g.__adminName || g.nomeAdministradora || key;
      if (key && !m.has(key)) m.set(key, label);
    });
    return Array.from(m.entries())
      .map(([value,label]) => ({ value, label }))
      .sort((a,b)=> String(a.label).localeCompare(String(b.label),'pt-BR'));
  }, [data]);

  // Produtos dependentes da administradora selecionada
  const productOptions = useMemo(() => {
    const m = new Map(); // key -> label
    (data?.grupos || []).forEach(g => {
      if (adminKey && g.__adminKey !== adminKey) return;
      const key = g.__productKey;
      const label = toTitle(String(g?.produto || key).replace(/_/g,' '));
      if (key && !m.has(key)) m.set(key, label);
    });
    return Array.from(m.entries())
      .map(([value,label]) => ({ value, label }))
      .sort((a,b)=> a.label.localeCompare(b.label,'pt-BR'));
  }, [data, adminKey]);

  function aplicar(){
    onApply({
      minCarta: minCarta ? parseFloat(minCarta) : undefined,
      maxCarta: maxCarta ? parseFloat(maxCarta) : undefined,
      adminKey: adminKey || '',
      productKey: productKey || '',
      tipoKey: tipoKey || '',
      lanceMin: lanceMin ? parseFloat(lanceMin) : undefined,
      prazo: prazo ? parseInt(prazo,10) : undefined,
    });
  }
  function limpar(){
    setMinCarta(''); setMaxCarta('');
    setAdminKey(''); setProductKey('');
    setTipoKey(''); setLanceMin(''); setPrazo('');
    onApply({});
  }

  return (
    <div className="card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Valor Carta Mín (R$)</label>
        <input value={minCarta} onChange={e=>setMinCarta(e.target.value)} inputMode="numeric" className="w-full border rounded-2xl px-3 py-2" />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Valor Carta Máx (R$)</label>
        <input value={maxCarta} onChange={e=>setMaxCarta(e.target.value)} inputMode="numeric" className="w-full border rounded-2xl px-3 py-2" />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Administradora</label>
        <select
          value={adminKey}
          onChange={e=>{ setAdminKey(e.target.value); setProductKey(''); }}
          className="w-full border rounded-2xl px-3 py-2"
        >
          <option value="">Todas</option>
          {adminOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Produto</label>
        <select
          value={productKey}
          onChange={e=>setProductKey(e.target.value)}
          className="w-full border rounded-2xl px-3 py-2"
        >
          <option value="">Todos</option>
          {productOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Tipo de Grupo</label>
        <select value={tipoKey} onChange={e=>setTipoKey(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todos</option>
          <option value={N('PARCELA INTEGRAL')}>Parcela Integral</option>
          <option value={N('PARCELA REDUZIDA')}>Parcela Reduzida</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">% Lance Mínimo</label>
        <input value={lanceMin} onChange={e=>setLanceMin(e.target.value)} inputMode="numeric" placeholder="ex.: 20" className="w-full border rounded-2xl px-3 py-2" />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Prazo (meses)</label>
        <input value={prazo} onChange={e=>setPrazo(e.target.value)} inputMode="numeric" placeholder="ex.: 60" className="w-full border rounded-2xl px-3 py-2" />
      </div>

      <div className="col-span-full flex justify-end gap-2">
        <button onClick={limpar} className="px-4 py-2 rounded-2xl border">Limpar</button>
        <button onClick={aplicar} className="px-4 py-2 rounded-2xl bg-brand-600 text-white">Aplicar</button>
      </div>
    </div>
  );
}
