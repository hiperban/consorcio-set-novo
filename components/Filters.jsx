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
  const t = N(v);
  const k = t.replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
  return k || 'OUTROS_BENS';
}

/* ---- Máscara BRL ---- */
function onlyDigits(s){ return String(s || '').replace(/\D/g, ''); }
function maskBRLFromDigits(digits){
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  if (Number.isNaN(cents)) return '';
  const n = cents / 100;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function parseBRLToNumber(masked){
  const digits = onlyDigits(masked);
  if (!digits) return null;
  const n = parseInt(digits, 10) / 100;
  return Number.isFinite(n) ? n : null;
}

export default function Filters({ data, onFilterChange }) {
  // Estados dos filtros
  const [admKey, setAdmKey]           = useState('');
  const [produtoKey, setProdutoKey]   = useState('');
  const [tipoGrupo, setTipoGrupo]     = useState('');
  const [lanceMin, setLanceMin]       = useState('');
  const [prazo, setPrazo]             = useState('');

  // Máscara BRL (Carta min/máx) – guardamos string mascarada e convertemos na hora de enviar
  const [minCartaMasked, setMinCartaMasked] = useState('');
  const [maxCartaMasked, setMaxCartaMasked] = useState('');

  // ---- Carrega o mesmo product-map do page.jsx para manter a mesma canonização de chave ---
  const [prodMap, setProdMap] = useState({ map:{}, labels:{} });
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/data/_product-map.json', { cache: 'no-store' });
        if (!res.ok) { setProdMap({ map:{}, labels:{} }); return; }
        const j = await res.json();
        const map = {};
        Object.entries(j.map || {}).forEach(([raw, key]) => { map[N(raw)] = String(key); });
        setProdMap({ map, labels: j.labels || {} });
      } catch {
        setProdMap({ map:{}, labels:{} });
      }
    })();
  }, []);

  // Mesma productKey do page.jsx
  const productKeyCanon = (label) => {
    const norm = N(label);
    const mapped = prodMap.map[norm];
    return mapped || slugKey(norm);
  };

  // ---- Opções dinâmicas ----
  const admOptions = useMemo(() => {
    const arr = Array.isArray(data?.administradoras) ? data.administradoras : [];
    return arr
      .map(a => ({ key: N(a?.nome), label: String(a?.nome || '').trim() }))
      .filter(a => a.key && a.label)
      .reduce((acc, a) => { if (!acc.some(x => x.key === a.key)) acc.push(a); return acc; }, [])
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [data]);

  const produtoOptions = useMemo(() => {
    const gs = Array.isArray(data?.grupos) ? data.grupos : [];
    const map = new Map(); // key -> label
    for (const g of gs) {
      const raw = String(g?.produto || '').trim();
      if (!raw) continue;
      const key = productKeyCanon(raw);
      if (!map.has(key)) {
        const nice = prodMap.labels[key] || toTitle(raw);
        map.set(key, nice);
      }
    }
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [data, prodMap]);

  const tipoOptions = useMemo(() => {
    const gs = Array.isArray(data?.grupos) ? data.grupos : [];
    const set = new Set();
    for (const g of gs) {
      const t = N(g?.tipoGrupo || '');
      if (t) set.add(t);
    }
    const arr = Array.from(set.values()).map(k => ({ key: k, label: k }));
    const order = ['PARCELA REDUZIDA', 'PARCELA INTEGRAL'];
    arr.sort((a,b) => {
      const ia = order.indexOf(a.key);
      const ib = order.indexOf(b.key);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.label.localeCompare(b.label, 'pt-BR');
    });
    return arr;
  }, [data]);

  // ---- Dispara ao pai com números prontos ----
  useEffect(() => {
    const minCarta = parseBRLToNumber(minCartaMasked);
    const maxCarta = parseBRLToNumber(maxCartaMasked);

    onFilterChange?.({
      minCarta: (minCarta ?? null),
      maxCarta: (maxCarta ?? null),
      admKey: admKey || null,
      produtoKey: produtoKey || null,
      tipoGrupo: tipoGrupo || null,
      lanceMin: lanceMin ? Number(lanceMin) : null,
      prazo: prazo ? Number(prazo) : null,
    });
  }, [minCartaMasked, maxCartaMasked, admKey, produtoKey, tipoGrupo, lanceMin, prazo, onFilterChange]);

  // ---- Handlers de máscara BRL ----
  const onMinCartaChange = (e) => {
    const digits = onlyDigits(e.target.value);
    setMinCartaMasked(maskBRLFromDigits(digits));
  };
  const onMaxCartaChange = (e) => {
    const digits = onlyDigits(e.target.value);
    setMaxCartaMasked(maskBRLFromDigits(digits));
  };

  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Administradora</label>
        <select
          value={admKey}
          onChange={e => setAdmKey(e.target.value)}
          className="w-full border rounded-2xl px-3 py-2 bg-white"
        >
          <option value="">Todas</option>
          {admOptions.map(a => (
            <option key={a.key} value={a.key}>{a.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Produto</label>
        <select
          value={produtoKey}
          onChange={e => setProdutoKey(e.target.value)}
          className="w-full border rounded-2xl px-3 py-2 bg-white"
        >
          <option value="">Todos</option>
          {produtoOptions.map(p => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Tipo de Grupo</label>
        <select
          value={tipoGrupo}
          onChange={e => setTipoGrupo(e.target.value)}
          className="w-full border rounded-2xl px-3 py-2 bg-white"
        >
          <option value="">Todos</option>
          {tipoOptions.map(t => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Carta (mín.)</label>
        <input
          value={minCartaMasked}
          onChange={onMinCartaChange}
          inputMode="numeric"
          className="w-full border rounded-2xl px-3 py-2"
          placeholder="R$ 20.000,00"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Carta (máx.)</label>
        <input
          value={maxCartaMasked}
          onChange={onMaxCartaChange}
          inputMode="numeric"
          className="w-full border rounded-2xl px-3 py-2"
          placeholder="R$ 80.000,00"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Lance mínimo (%)</label>
        <input
          value={lanceMin}
          onChange={e => setLanceMin(e.target.value.replace(/[^0-9.]/g, ''))}
          inputMode="decimal"
          className="w-full border rounded-2xl px-3 py-2"
          placeholder="ex: 20"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Prazo (meses)</label>
        <input
          value={prazo}
          onChange={e => setPrazo(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          className="w-full border rounded-2xl px-3 py-2"
          placeholder="ex: 84"
        />
      </div>
    </div>
  );
}
