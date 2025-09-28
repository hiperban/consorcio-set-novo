'use client';
import { useEffect, useMemo, useState } from 'react';

/* ========== Normalização e helpers ========== */
function N(v){
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}
function toTitle(s){
  return String(s || '')
    .toLowerCase()
    .replace(/(^|[\s_-])([a-zà-ú])/g, (_,p,c)=> p + c.toUpperCase());
}
function slugKey(v){
  const t = N(v);
  const k = t.replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
  return k || 'OUTROS_BENS';
}

/* ========== Máscara BRL ========== */
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
  // --- estados dos inputs ---
  const [minCartaMasked, setMinCartaMasked] = useState('');
  const [maxCartaMasked, setMaxCartaMasked] = useState('');
  const [adminKey, setAdminKey] = useState('');     // administradora (por NOME canônico)
  const [productKey, setProductKey] = useState(''); // produto (chave canônica)
  const [tipoKey, setTipoKey] = useState('');       // tipo (canônico)
  const [lanceMin, setLanceMin] = useState('');     // número
  const [prazo, setPrazo] = useState('');           // número

  // --- mapa id->nome para ajudar quando o grupo vem só com ID ---
  const idToName = useMemo(() => {
    const m = new Map();
    (data?.administradoras || []).forEach(a => {
      if (a?.id) m.set(String(a.id), String(a.nome || ''));
    });
    return m;
  }, [data]);

  // --- derivar ADMIN options a partir dos grupos+administradoras ---
  const adminOptions = useMemo(() => {
    const map = new Map(); // key -> label
    (data?.grupos || []).forEach(g => {
      const label = g?.nomeAdministradora || idToName.get(String(g?.administradoraId)) || '';
      if (!label) return;
      const key = N(label);
      if (!map.has(key)) map.set(key, label);
    });
    (data?.administradoras || []).forEach(a => {
      const key = N(a?.nome || '');
      const label = a?.nome || '';
      if (key && !map.has(key)) map.set(key, label);
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a,b)=> a.label.localeCompare(b.label, 'pt-BR'));
  }, [data, idToName]);

  // --- derivar PRODUTO options dinamicamente (sem codar sinônimos) ---
  const productOptions = useMemo(() => {
    const map = new Map(); // key -> label
    (data?.grupos || []).forEach(g => {
      const key = slugKey(g?.produto);
      const label = toTitle(String(g?.produto || key).replace(/_/g,' '));
      if (!map.has(key)) map.set(key, label);
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a,b)=> a.label.localeCompare(b.label, 'pt-BR'));
  }, [data]);

  // --- propaga filtros sempre que mudam ---
  useEffect(() => {
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

  // --- limpar tudo ---
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
