'use client';
import { useEffect, useMemo, useState } from 'react';

/* ========= Helpers ========= */
function N(v){
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}
function toTitle(s){
  return String(s || '')
    .toLowerCase()
    .replace(/(^|[\s_-])([a-zà-ú])/g, (_,p,c)=> p + c.toUpperCase());
}
function maskBRL(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function parseBRLToNumber(masked) {
  const digits = String(masked || '').replace(/\D/g, '');
  if (!digits) return undefined;
  return parseInt(digits, 10) / 100;
}

export default function Filters({ data, onFilterChange }){
  const [minCartaMasked, setMinCartaMasked] = useState('');
  const [maxCartaMasked, setMaxCartaMasked] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [productKey, setProductKey] = useState('');
  const [tipoKey, setTipoKey] = useState('');
  const [lanceMin, setLanceMin] = useState('');
  const [prazo, setPrazo] = useState('');

  // Admin options a partir dos grupos pré-processados
  const adminOptions = useMemo(() => {
    const map = new Map();
    (data?.grupos || []).forEach(g => {
      const key = g.__adminKey;
      const label = g?.nomeAdministradora || g?.administradoraId || key;
      if (key && !map.has(key)) map.set(key, label);
    });
    (data?.administradoras || []).forEach(a => {
      const key = N(a?.nome || '');
      const label = a?.nome || key;
      if (key && !map.has(key)) map.set(key, label);
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a,b)=> String(a.label).localeCompare(String(b.label), 'pt-BR'));
  }, [data]);

  // Produto DEPENDE da admin selecionada (usa __productKey)
  const productOptions = useMemo(() => {
    const map = new Map();
    (data?.grupos || []).forEach(g => {
      if (adminKey && g.__adminKey !== adminKey) return;
      const key = g.__productKey;
      const label = toTitle(String(g?.produto || key).replace(/_/g,' '));
      if (key && !map.has(key)) map.set(key, label);
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a,b)=> a.label.localeCompare(b.label, 'pt-BR'));
  }, [data, adminKey]);

  // Ao trocar admin, limpa dependentes
  useEffect(() => { setProductKey(''); setTipoKey(''); }, [adminKey]);

  // Propaga filtros — **ATENÇÃO aos nomes productKey/tipoKey**
  useEffect(()=>{
    const min   = parseBRLToNumber(minCartaMasked);
    const max   = parseBRLToNumber(maxCartaMasked);
    const lance = (lanceMin === '' ? undefined : parseFloat(lanceMin));
    const pz    = (prazo === '' ? undefined : parseInt(prazo, 10));
    onFilterChange({
      minCarta: Number.isNaN(min) ? undefined : min,
      maxCarta: Number.isNaN(max) ? undefined : max,
      adminKey: adminKey || '',
      productKey: productKey || '',
      tipoKey: N(tipoKey || ''),
      lanceMin: Number.isNaN(lance) ? undefined : lance,
      prazo: Number.isNaN(pz) ? undefined : pz
    });
  }, [minCartaMasked, maxCartaMasked, adminKey, productKey, tipoKey, lanceMin, prazo, onFilterChange]);

  const clearAll = () => {
    setMinCartaMasked('');
    setMaxCartaMasked('');
    setAdminKey('');
    setProductKey('');
    setTipoKey('');
    setLanceMin('');
    setPrazo('');
  };

  return (
    <div className="card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Valor Carta Mín (R$)</label>
        <input
          type="text" inputMode="numeric" placeholder="R$ 0,00"
          value={minCartaMasked} onChange={(e)=> setMinCartaMasked(maskBRL(e.target.value))}
          className="w-full border rounded-2xl px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Valor Carta Máx (R$)</label>
        <input
          type="text" inputMode="numeric" placeholder="R$ 0,00"
          value={maxCartaMasked} onChange={(e)=> setMaxCartaMasked(maskBRL(e.target.value))}
          className="w-full border rounded-2xl px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Administradora</label>
        <select value={adminKey} onChange={(e)=> setAdminKey(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todas</option>
          {adminOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">% Lance Mínimo</label>
        <input
          value={lanceMin} onChange={(e)=>setLanceMin(e.target.value)}
          inputMode="numeric" placeholder="ex.: 20"
          className="w-full border rounded-2xl px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Produto</label>
        <select value={productKey} onChange={(e)=> setProductKey(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todos</option>
          {productOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Tipo de Grupo</label>
        <select value={tipoKey} onChange={(e)=> setTipoKey(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todos</option>
          <option value={N('PARCELA INTEGRAL')}>PARCELA INTEGRAL</option>
          <option value={N('PARCELA REDUZIDA')}>PARCELA REDUZIDA</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Prazo (meses)</label>
        <input
          value={prazo} onChange={(e)=> setPrazo(e.target.value)}
          inputMode="numeric" className="w-full border rounded-2xl px-3 py-2"
        />
      </div>
      <div className="col-span-2 md:col-span-3 lg:col-span-6 flex justify-end">
        <button onClick={clearAll} className="px-4 py-2 rounded-2xl border hover:bg-gray-50">
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
