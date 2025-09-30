'use client';
import { useEffect, useMemo, useState } from 'react';
import { ADMINS, PRODUCTS } from '@/config/catalog';

/* Helpers */
function N(v){
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}
const onlyDigits = s => String(s || '').replace(/\D/g, '');
function maskBRLFromDigits(digits){
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  if (Number.isNaN(cents)) return '';
  const n = cents / 100;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function parseBRL(masked){
  const d = onlyDigits(masked);
  if (!d) return null;
  const n = parseInt(d, 10) / 100;
  return Number.isFinite(n) ? n : null;
}

export default function Filters({ data, onFilterChange }) {
  const [admKey, setAdmKey]           = useState('');
  const [produtoKey, setProdutoKey]   = useState('');
  const [tipoGrupo, setTipoGrupo]     = useState('');
  const [lanceMin, setLanceMin]       = useState('');
  const [prazo, setPrazo]             = useState('');
  const [minCartaMasked, setMinCartaMasked] = useState('');
  const [maxCartaMasked, setMaxCartaMasked] = useState('');

  // Tipos dinâmicos (se quiser, pode fixar também)
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

  // Notifica o pai sempre que algo muda
  useEffect(() => {
    onFilterChange?.({
      minCarta: parseBRL(minCartaMasked),
      maxCarta: parseBRL(maxCartaMasked),
      admKey: admKey || null,           // <- chaves canônicas
      produtoKey: produtoKey || null,
      tipoGrupo: tipoGrupo || null,
      lanceMin: lanceMin ? Number(lanceMin) : null,
      prazo: prazo ? Number(prazo) : null,
    });
  }, [minCartaMasked, maxCartaMasked, admKey, produtoKey, tipoGrupo, lanceMin, prazo, onFilterChange]);

  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      {/* Administradora */}
      <div>
        <label className="block text-xs text-gray-600 mb-1">Administradora</label>
        <select
          value={admKey}
          onChange={e => setAdmKey(e.target.value)}
          className="w-full border rounded-2xl px-3 py-2 bg-white"
        >
          <option value="">Todas</option>
          {ADMINS.map(a => (
            <option key={a.key} value={a.key}>{a.label}</option>
          ))}
        </select>
      </div>

      {/* Produto */}
      <div>
        <label className="block text-xs text-gray-600 mb-1">Produto</label>
        <select
          value={produtoKey}
          onChange={e => setProdutoKey(e.target.value)}
          className="w-full border rounded-2xl px-3 py-2 bg-white"
        >
          <option value="">Todos</option>
          {PRODUCTS.map(p => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Tipo de Grupo */}
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

      {/* Carta (mín.) */}
      <div>
        <label className="block text-xs text-gray-600 mb-1">Carta (mín.)</label>
        <input
          value={minCartaMasked}
          onChange={e => setMinCartaMasked(maskBRLFromDigits(onlyDigits(e.target.value)))}
          inputMode="numeric"
          className="w-full border rounded-2xl px-3 py-2"
          placeholder="R$ 20.000,00"
        />
      </div>

      {/* Carta (máx.) */}
      <div>
        <label className="block text-xs text-gray-600 mb-1">Carta (máx.)</label>
        <input
          value={maxCartaMasked}
          onChange={e => setMaxCartaMasked(maskBRLFromDigits(onlyDigits(e.target.value)))}
          inputMode="numeric"
          className="w-full border rounded-2xl px-3 py-2"
          placeholder="R$ 80.000,00"
        />
      </div>

      {/* Lance mínimo (%) */}
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

      {/* Prazo (meses) */}
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
