'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  STRICT_MODE,
  canonProduct, productLabel,
  canonAdmin,   adminLabel,
} from '@/config/catalog';

/* ========= Helpers ========= */
function N(v){
  return String(v ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .trim().toUpperCase();
}
function formatBRL(n){
  const v = Number(n) || 0;
  return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}
function pct(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `${v}%`;
}
const isDebug = () => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('debug');
};

/* ======= Config: quais métricas e regra de “melhor” ======= */
const ROWS = [
  { key: 'administradora', label: 'Administradora', fmt: (g)=> (g.__aKey ? adminLabel(g.__aKey) : g.__admName) },
  { key: 'produto',        label: 'Produto',        fmt: (g)=> (g.__pKey ? productLabel(g.__pKey) : g.produto) },
  { key: 'tipoGrupo',      label: 'Tipo',           fmt: (g)=> g?.tipoGrupo || '—' },

  // Comparáveis (destacam o melhor):
  { key: 'valorCarta',   label: 'Valor Carta',    fmt: (g)=> formatBRL(g?.valorCarta),    better: 'max' },
  { key: 'valorParcela', label: 'Parcela',        fmt: (g)=> formatBRL(g?.valorParcela),  better: 'min' },
  { key: 'prazo',        label: 'Prazo (meses)',  fmt: (g)=> `${g?.prazo ?? '—'}`,        better: 'min' },
  { key: 'taxaAdm',      label: 'Taxa Adm',       fmt: (g)=> pct(g?.taxaAdm),             better: 'min' },
  { key: 'lanceMedio',   label: '% Lance Médio',  fmt: (g)=> pct(g?.lanceMedio),          better: 'min' },
  { key: 'embutido',     label: '% Lance Embutido', fmt: (g)=> g?.embutido!=null ? pct(g.embutido) : '—', better: 'min' },
  { key: 'participantes',label: 'Participantes',  fmt: (g)=> g?.participantes ?? '—',     better: 'max' },

  // Extras
  { key: 'assembleiaDia', label: 'Assembleia (dia)', fmt: (g)=> g?.assembleiaDia ?? '—' },
  { key: 'numeroGrupo',   label: 'Grupo',            fmt: (g)=> g?.numeroGrupo ?? g?.id ?? '—' },
];

/* ======= Dados ======= */
function mergeDatasets(list) {
  const admMap = new Map();
  const grupos = [];
  for (const d of list || []) {
    const adms = Array.isArray(d?.administradoras) ? d.administradoras : [];
    const gs   = Array.isArray(d?.grupos) ? d.grupos : [];

    adms.forEach(a => {
      const id = String(a?.id || '').trim();
      const nome = String(a?.nome || '').trim();
      if (id && !admMap.has(id)) admMap.set(id, { id, nome });
    });

    gs.forEach(g => {
      const id = String(g?.id || '').trim();
      const administradoraId = String(g?.administradoraId || '').trim();
      const produto = String(g?.produto || '').trim();
      if (!id || !administradoraId || !produto) return;

      grupos.push({
        ...g,
        id,
        administradoraId,
        produto,
        tipoGrupo: String(g?.tipoGrupo || '').trim(),
        valorCarta: Number(g?.valorCarta ?? 0),
        valorParcela: Number(g?.valorParcela ?? 0),
        taxaAdm: Number(g?.taxaAdm ?? 0),
        lanceMedio: Number(g?.lanceMedio ?? 0),
        prazo: Number(g?.prazo ?? 0),
        embutido: g?.embutido != null ? Number(g.embutido) : null,
        participantes: g?.participantes != null ? Number(g.participantes) : null,
        assembleiaDia: g?.assembleiaDia != null ? Number(g.assembleiaDia) : null,
        numeroGrupo: g?.numeroGrupo,
      });
    });
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}
function adminNameFromGroup(g, administradorasMap){
  const id = String(g?.administradoraId ?? '');
  const byId = administradorasMap.get(id)?.nome;
  return byId || g?.nomeAdministradora || '';
}

export default function ComparePage(){
  const [rawData, setRawData] = useState({ administradoras: [], grupos: [] });
  const [selectedIds, setSelectedIds] = useState([]);
  const [hideEqualRows, setHideEqualRows] = useState(true);

  // Carrega datasets + recupera seleção (normalizada para string)
  useEffect(() => {
    async function loadAll() {
      try {
        const man = await fetch('/data/_manifest.json', { cache: 'no-store' }).then(r => r.json());
        const files = Array.isArray(man?.datasets) ? man.datasets : [];
        const results = await Promise.allSettled(
          files.map(f =>
            fetch(`/data/${f}`, { cache: 'no-store' })
              .then(r => { if (!r.ok) throw new Error(`Falha ao baixar ${f}: ${r.status}`); return r.json(); })
              .then(j => ({ file: f, data: j }))
          )
        );
        const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value.data);
        results.filter(r => r.status === 'rejected').forEach(r => console.warn('[Dataset ignorado]', r.reason));
        setRawData(mergeDatasets(ok));

        const raw = localStorage.getItem('compareSelection');
        if (raw) {
          const arr = JSON.parse(raw);
          setSelectedIds(Array.isArray(arr) ? arr.map(x => String(x)) : []);
        }
      } catch (e) {
        console.error(e);
        setRawData({ administradoras: [], grupos: [] });
      }
    }
    loadAll();
  }, []);

  // Mapa de administradoras
  const administradorasMap = useMemo(() => {
    const m = new Map();
    (rawData?.administradoras || []).forEach(a => { if (a?.id) m.set(String(a.id), a); });
    return m;
  }, [rawData]);

  // Prepara grupos com chaves canônicas e aplica STRICT_MODE
  const prepared = useMemo(() => {
    const arr = (rawData.grupos || []).map(g => {
      const admName = adminNameFromGroup(g, administradorasMap);
      const aKey = canonAdmin(admName) || null;
      const pKey = canonProduct(g?.produto) || null;
      return { ...g, __admName: admName, __aKey: aKey, __pKey: pKey };
    });
    return STRICT_MODE ? arr.filter(g => g.__aKey && g.__pKey) : arr;
  }, [rawData, administradorasMap]);

  // Pega só os selecionados (até 4) — comparação por String(id)
  const cols = useMemo(() => {
    const set = new Set((selectedIds || []).map(x => String(x)));
    return prepared.filter(g => set.has(String(g.id))).slice(0, 4);
  }, [prepared, selectedIds]);

  // Ranking dos “melhores” por linha + detecção de linhas iguais
  const { bestByRow, equalRows } = useMemo(() => {
    const best = new Map(); // row.key -> Set<indexes melhores>
    const eq = new Set();   // row.key com valores idênticos em todas as colunas
    ROWS.forEach(row => {
      const values = cols.map(g => g[row.key]);
      // igualdade: todos iguais (considerando número quando possível)
      const norm = values.map(v => Number.isFinite(Number(v)) ? Number(v) : String(v ?? ''));
      const allEq = norm.every(x => x === norm[0]);
      if (allEq) eq.add(row.key);

      if (!row.better) return; // linhas “só exibe”
      const finite = values
        .map((v, i) => ({ i, v: Number(v) }))
        .filter(({v}) => Number.isFinite(v));
      if (finite.length === 0) { best.set(row.key, new Set()); return; }

      const target = row.better === 'min'
        ? Math.min(...finite.map(x => x.v))
        : Math.max(...finite.map(x => x.v));

      best.set(row.key, new Set(finite.filter(x => x.v === target).map(x => x.i)));
    });
    return { bestByRow: best, equalRows: eq };
  }, [cols]);

  const showDebug = isDebug();

  return (
    <main className="container py-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-brand-800">Comparar Selecionados</h1>
        <Link href="/" className="text-sm text-orange-600 hover:underline">← Voltar ao simulador</Link>
      </header>

      {/* toolbar */}
      <div className="flex items-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={hideEqualRows}
            onChange={e => setHideEqualRows(e.target.checked)}
            className="accent-orange-500"
          />
          Ocultar linhas com valores iguais
        </label>
        {showDebug && (
          <span className="text-xs text-gray-500">
            DEBUG ids: {JSON.stringify(selectedIds)}
          </span>
        )}
      </div>

      {cols.length === 0 ? (
        <p className="text-gray-600">Você ainda não selecionou grupos compatíveis com o catálogo.</p>
      ) : (
        <div className="w-full overflow-auto">
          <table className="w-full border-separate border-spacing-0 rounded-2xl overflow-hidden">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white border-b px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">
                  DADOS
                </th>
                {cols.map((g, idx) => (
                  <th key={g.id || idx} className="border-b px-4 py-3 text-left">
                    <div className="text-xs text-gray-500">#{g.numeroGrupo || g.id}</div>
                    <div className="text-sm font-medium">
                      {(g.__pKey ? productLabel(g.__pKey) : g.produto) || '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(g.__aKey ? adminLabel(g.__aKey) : g.__admName) || '—'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ROWS
                .filter(row => !(hideEqualRows && equalRows.has(row.key)))
                .map((row, rIdx) => (
                <tr key={row.key} className={rIdx % 2 ? 'bg-slate-50/30' : 'bg-white'}>
                  {/* primeira coluna (fixa) */}
                  <td className="sticky left-0 z-10 bg-inherit border-b px-4 py-3 text-sm font-medium text-gray-700">
                    {row.label}
                  </td>

                  {/* colunas dos selecionados */}
                  {cols.map((g, idx) => {
                    const winners = bestByRow.get(row.key) || new Set();
                    const isWinner = winners.has(idx);
                    const val = row.fmt ? row.fmt(g) : (g[row.key] ?? '—');

                    const base =
                      row.better
                        ? (isWinner
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100 font-semibold'
                            : 'text-gray-800')
                        : 'text-gray-800';

                    return (
                      <td key={`${row.key}::${g.id}`} className={`border-b px-4 py-3 text-sm ${base}`}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 text-xs text-gray-500">
            <span className="inline-block rounded px-2 py-0.5 mr-2 bg-emerald-50 text-emerald-800 border border-emerald-100">
              destaque
            </span>
            indica o/a melhor valor em cada linha (regras: menor é melhor / maior é melhor).
          </div>
        </div>
      )}
    </main>
  );
}
