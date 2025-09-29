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

export default function Filters({ data, onFilterChange }) {
  const [minCarta, setMinCarta]       = useState('');
  const [maxCarta, setMaxCarta]       = useState('');
  const [admKey, setAdmKey]           = useState('');
  const [produtoKey, setProdutoKey]   = useState('');
  const [tipoGrupo, setTipoGrupo]     = useState('');
  const [lanceMin, setLanceMin]       = useState('');
  const [prazo, setPrazo]             = useState('');

  // Deriva administradoras do próprio dataset
  const admOptions = useMemo(() => {
    const arr = Array.isArray(data?.administradoras) ? data.administradoras : [];
    return arr
      .map(a => ({ key: N(a?.nome), label: String(a?.nome || '').trim() }))
      .filter(a => a.key && a.label)
      .reduce((acc, a) => {
        if (!acc.some(x => x.key === a.key)) acc.push(a);
        return acc;
      }, [])
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [data]);

  // Deriva produtos de TODOS os grupos (dinâmico)
  const produtoOptions = useMemo(() => {
    const gs = Array.isArray(data?.grupos) ? data.grupos : [];
    const map = new Map(); // key -> label
    for (const g of gs) {
      const raw = String(g?.produto || '').trim();
      if (!raw) continue;
      const key = slugKey(N(raw));
      if (!map.has(key)) map.set(key, toTitle(raw));
    }
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [data]);

  // Deriva tipos de grupo (dinâmico)
  const tipoOptions = useMemo(() => {
    const gs = Array.isArray(data?.grupos) ? data.grupos : [];
    const set = new Set();
    for (const g of gs) {
      const t = N(g?.tipoGrupo || '');
      if (t) set.add(t);
    }
    const arr = Array.from(set.values()).map(k => ({ key: k, label: k }));
    // Se quiser impor ordem conhecida:
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

  // Dispara mudança agregada para o pai
  useEffect(() => {
    onFilterChange?.({
      minCarta: minCarta ? Number(minCarta) : null,
      maxCarta: maxCarta ? Number(maxCarta) : null,
      admKey: admKey || null,
      produtoKey: produtoKey || null,
      tipoGrupo: tipoGrupo || null,
      lanceMin: lanceMin ? Number(lanceMin) : null,
      prazo: prazo ? Number(prazo) : null,
    });
  }, [minCarta, maxCarta, admKey, produtoKey, tipoGrupo, lanceMin, prazo, onFilterChange]);

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
          value={minCarta}
          onChange={e => setMinCarta(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          className="w-full border rounded-2xl px-3 py-2"
          placeholder="ex: 20000"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Carta (máx.)</label>
        <input
          value={maxCarta}
          onChange={e => setMaxCarta(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          className="w-full border rounded-2xl px-3 py-2"
          placeholder="ex: 80000"
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
