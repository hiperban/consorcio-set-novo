'use client';
import { useEffect, useMemo, useState } from 'react';

/* ------------ Normalização & helpers ------------ */
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
  // transforma qualquer texto em CHAVE_ESTAVEL
  const t = N(v);
  const k = t.replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
  return k || 'OUTROS_BENS';
}

/* ------------ Máscara BRL ------------ */
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
  // ------- carrega taxonomia opcional de produtos -------
  const [prodMap, setProdMap] = useState({ map:{}, labels:{} });
  useEffect(() => {
    (async () => {
      try {
        const j = await fetch('/data/_product-map.json', { cache:'no-store' }).then(r => r.ok ? r.json() : {map:{},labels:{}});
        // normaliza chaves do mapa
        const map = {};
        Object.entries(j.map || {}).forEach(([raw, key]) => { map[N(raw)] = String(key); });
        setProdMap({ map, labels: j.labels || {} });
      } catch { setProdMap({ map:{}, labels:{} }); }
    })();
  }, []);

  // Inputs mascarados
  const [minCartaMasked, setMinCartaMasked] = useState('');
  const [maxCartaMasked, setMaxCartaMasked] = useState('');

  // Filtros
  const [admKey, setAdmKey] = useState('');    // administradora por NOME canônico
  const [lanceMin, setLanceMin] = useState('');
  const [produtoKey, setProdutoKey] = useState(''); // CHAVE canônica dinâmica
  const [tipoGrupo, setTipoGrupo] = useState('');
  const [prazo, setPrazo] = useState('');

  // --------- Funções de canonização de produto ----------
  const productKey = (label) => {
    const norm = N(label);
    const mapped = prodMap.map[norm];    // se tiver sinônimo no json, usa
    return mapped || slugKey(norm);      // senão vira uma chave automática
  };
  const productLabelForKey = (key, exampleLabel) => {
    return prodMap.labels?.[key] || toTitle((exampleLabel || key).replace(/_/g,' '));
  };

  /* Opções de Administradora por NOME (canônico) */
  const administradoras = useMemo(() => {
    const map = new Map();
    (data?.administradoras || []).forEach(a => {
      const label = a?.nome ?? '';
      const key = N(label);
      if (key && !map.has(key)) map.set(key, label);
    });
    (data?.grupos || []).forEach(g => {
      const label = g?.nomeAdministradora ?? '';
      const key = N(label);
      if (key && !map.has(key)) map.set(key, label);
    });
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((x,y)=> String(x.label).localeCompare(String(y.label), 'pt-BR'));
  }, [data]);

  /* Opções de Produto (100% dinâmicas) */
  const produtos = useMemo(() => {
    const m = new Map(); // key -> label bonito
    (data?.grupos || []).forEach(g => {
      const key = productKey(g?.produto);
      if (!m.has(key)) m.set(key, productLabelForKey(key, g?.produto));
    });
    return Array.from(m.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a,b)=> a.label.localeCompare(b.label, 'pt-BR'));
  }, [data, prodMap]);

  // envia filtros para a página
  useEffect(()=>{
    const min   = parseBRLToNumber(minCartaMasked);
    const max   = parseBRLToNumber(maxCartaMasked);
    const lance = lanceMin === '' ? undefined : parseFloat(lanceMin);
    const prazoNum = prazo === '' ? undefined : parseInt(prazo, 10);

    onFilterChange({
      minCarta: Number.isNaN(min) ? undefined : min,
      maxCarta: Number.isNaN(max) ? undefined : max,
      admKey: admKey || '',
      produtoKey: produtoKey || '',
      tipoGrupo: N(tipoGrupo || ''),
      lanceMin: Number.isNaN(lance) ? undefined : lance,
      prazo: Number.isNaN(prazoNum) ? undefined : prazoNum
    });
  }, [minCartaMasked, maxCartaMasked, admKey, lanceMin, produtoKey, tipoGrupo, prazo, onFilterChange]);

  const onAdmChange = (value) => { setAdmKey(value); setProdutoKey(''); setTipoGrupo(''); };

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
        <select value={admKey} onChange={e=>onAdmChange(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todas</option>
          {administradoras.map(opt => (<option key={opt.key} value={opt.key}>{opt.label}</option>))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">% Lance Mínimo</label>
        <input
          value={lanceMin} onChange={e=>setLanceMin(e.target.value)}
          inputMode="numeric" placeholder="ex.: 20"
          className="w-full border rounded-2xl px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Produto</label>
        <select value={produtoKey} onChange={e=>setProdutoKey(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todos</option>
          {produtos.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Tipo de Grupo</label>
        <select value={tipoGrupo} onChange={e=>setTipoGrupo(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todos</option>
          <option value={N('PARCELA REDUZIDA')}>PARCELA REDUZIDA</option>
          <option value={N('PARCELA INTEGRAL')}>PARCELA INTEGRAL</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Prazo (meses)</label>
        <input
          value={prazo} onChange={e=>setPrazo(e.target.value)}
          inputMode="numeric" className="w-full border rounded-2xl px-3 py-2"
        />
      </div>
    </div>
  );
}
