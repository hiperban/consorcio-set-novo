'use client';
import { useEffect, useMemo, useState } from 'react';
import { ADMINS, PRODUCTS } from '@/config/catalog';

// ... (mesmas helpers de antes: N, máscara BRL, etc.)

export default function Filters({ data, onFilterChange }) {
  const [admKey, setAdmKey]           = useState('');
  const [produtoKey, setProdutoKey]   = useState('');
  const [tipoGrupo, setTipoGrupo]     = useState('');
  const [lanceMin, setLanceMin]       = useState('');
  const [prazo, setPrazo]             = useState('');
  const [minCartaMasked, setMinCartaMasked] = useState('');
  const [maxCartaMasked, setMaxCartaMasked] = useState('');

  // tipos ainda dinâmicos, ok
  const tipoOptions = useMemo(() => {
    const gs = Array.isArray(data?.grupos) ? data.grupos : [];
    const set = new Set();
    for (const g of gs) {
      const t = (g?.tipoGrupo ?? '').toString().trim().toUpperCase();
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

  useEffect(() => {
    const onlyDigits = s => String(s || '').replace(/\D/g, '');
    const parseBRL = m => {
      const d = onlyDigits(m);
      if (!d) return null;
      const n = parseInt(d, 10) / 100;
      return Number.isFinite(n) ? n : null;
    };

    onFilterChange?.({
      minCarta: parseBRL(minCartaMasked),
      maxCarta: parseBRL(maxCartaMasked),
      admKey: admKey || null,           // <- chave canônica (ex: 'RODOBENS')
      produtoKey: produtoKey || null,   // <- chave canônica (ex: 'CIRURGIA')
      tipoGrupo: tipoGrupo || null,
      lanceMin: lanceMin ? Number(lanceMin) : null,
      prazo: prazo ? Number(prazo) : null,
    });
  }, [minCartaMasked, maxCartaMasked, admKey, produtoKey, tipoGrupo, lanceMin, prazo, onFilterChange]);

  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Administradora</label>
        <select value={admKey} onChange={e=>setAdmKey(e.target.value)} className="w-full border rounded-2xl px-3 py-2 bg-white">
          <option value="">Todas</option>
          {ADMINS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Produto</label>
        <select value={produtoKey} onChange={e=>setProdutoKey(e.target.value)} className="w-full border rounded-2xl px-3 py-2 bg-white">
          <option value="">Todos</option>
          {PRODUCTS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </div>

      {/* ... (Tipo de Grupo, Carta min/máx com máscara, Lance mínimo, Prazo) ... */}
    </div>
  );
}
