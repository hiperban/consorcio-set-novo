'use client';
import { useEffect, useMemo, useState } from 'react';

/* Normalização simples */
function N(v){
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g,' ')
    .trim()
    .toUpperCase();
}

export default function Filters({ data, onApply }) {
  const [minCarta, setMinCarta]   = useState('');
  const [maxCarta, setMaxCarta]   = useState('');
  const [adminKey, setAdminKey]   = useState(''); // "id:3" ou "RODOBENS"
  const [product, setProduct]     = useState(''); // código do produto (AUTOMOVEL/IMOVEL/…)
  const [tipo, setTipo]           = useState(''); // INTEGRAL/REDUZIDA
  const [lanceMin, setLanceMin]   = useState('');
  const [prazo, setPrazo]         = useState('');

  // Opções de administradora (por id e por nome canônico)
  const adminOptions = useMemo(() => {
    const m = new Map();
    (data?.grupos || []).forEach(g => {
      if (g.__adminId) {
        const key = `id:${g.__adminId}`;
        if (!m.has(key)) m.set(key, g.__adminName || g.nomeAdministradora || key);
      }
      const keyName = g.__adminKey;
      if (keyName && !m.has(keyName)) m.set(keyName, g.__adminName || g.nomeAdministradora || keyName);
    });
    return Array.from(m.entries())
      .map(([value,label]) => ({ value, label }))
      .sort((a,b) => String(a.label).localeCompare(String(b.label),'pt-BR'));
  }, [data]);

  // Produtos dependem da administradora escolhida
  const productOptions = useMemo(() => {
    const m = new Map();
    (data?.grupos || []).forEach(g => {
      const matchAdmin =
        !adminKey ||
        (adminKey.startsWith('id:') ? `id:${g.__adminId}` === adminKey : g.__adminKey === adminKey);
      if (!matchAdmin) return;
      if (g.__productCode && !m.has(g.__productCode)) m.set(g.__productCode, g.__productLabel || g.__productCode);
    });
    return Array.from(m.entries())
      .map(([value,label]) => ({ value, label }))
      .sort((a,b)=> a.label.localeCompare(b.label,'pt-BR'));
  }, [data, adminKey]);

  // Aplica sempre que algo muda (com pequeno debounce)
  useEffect(() => {
    const t = setTimeout(() => {
      onApply({
        minCarta: minCarta ? parseFloat(minCarta) : undefined,
        maxCarta: maxCarta ? parseFloat(maxCarta) : undefined,
        adminKey,
        productCode: product,
        tipoCode: tipo,
        lanceMin: lanceMin ? parseFloat(lanceMin) : undefined,
        prazo: prazo ? parseInt(prazo,10) : undefined,
      });
    }, 120);
    return () => clearTimeout(t);
  }, [minCarta, maxCarta, adminKey, product, tipo, lanceMin, prazo, onApply]);

  const aplicar = () => {
    onApply({
      minCarta: minCarta ? parseFloat(minCarta) : undefined,
      maxCarta: maxCarta ? parseFloat(maxCarta) : undefined,
      adminKey,
      productCode: product,
      tipoCode: tipo,
      lanceMin: lanceMin ? parseFloat(lanceMin) : undefined,
      prazo: prazo ? parseInt(prazo,10) : undefined,
    });
  };

  const limpar = () => {
    setMinCarta(''); setMaxCarta('');
    setAdminKey(''); setProduct(''); setTipo('');
    setLanceMin(''); setPrazo('');
    onApply({});
  };

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
        <select value={adminKey} onChange={e=>{ setAdminKey(e.target.value); setProduct(''); }} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todas</option>
          {adminOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Produto</label>
        <select value={product} onChange={e=>setProduct(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todos</option>
          {productOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Tipo de Grupo</label>
        <select value={tipo} onChange={e=>setTipo(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todos</option>
          <option value="INTEGRAL">Parcela Integral</option>
          <option value="REDUZIDA">Parcela Reduzida</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">% Lance Mínimo</label>
        <input value={lanceMin} onChange={e=>setLanceMin(e.target.value)} inputMode="numeric" placeholder="ex.: 20" className="w-full border rounded-2xl px-3 py-2"/>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Prazo (meses)</label>
        <input value={prazo} onChange={e=>setPrazo(e.target.value)} inputMode="numeric" placeholder="ex.: 60" className="w-full border rounded-2xl px-3 py-2"/>
      </div>

      <div className="col-span-full flex justify-end gap-2">
        <button onClick={limpar} className="px-4 py-2 rounded-2xl border">Limpar</button>
        <button onClick={aplicar} className="px-4 py-2 rounded-2xl bg-brand-600 text-white">Aplicar</button>
      </div>
    </div>
  );
}
