// app/compare/page.jsx
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

/* ======= Config: quais métricas “melhor” ======= */
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
        produto: produto,
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
  const [selectedIds, setSelectedIds] = useState([]); // pode vir numérico ou string

  // Carrega datasets + recupera seleção
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

        // <-- recupera seleção e NORMALIZA para string
        try {
          const raw = localStorage.getItem('compareSelection');
          if (raw) {
            const arr = JSON.parse(raw);
            const norm = Array.isArray(arr) ? arr.map(x => String(x)) : [];
            setSelectedIds(norm);
          }
        } catch {}
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

  // Ranking dos “melhores” por linha
  const bestByRow = useMemo(() => {
    const result = new Map(); // row.key -> Set<indexes melhores>
    ROWS.forEach(row => {
      if (!row.better) return; // linhas só exibidas
      const values = cols.map(g => g[row.key]);
      const finite = values
        .map((v, i) => ({ i, v: Number(v) }))
        .filter(({v}) => Number.isFinite(v));
      if (finite.length === 0) { result.set(row.key, new Set()); return; }

      let best;
      if (row.better === 'min') {
        best = Math.min(...finite.map(x => x.v));
      } else {
        best = Math.max(...finite.map(x => x.v));
      }
      const winners = new Set(finite.filter(x => x.v === best).map(x => x.i));
      result.set(row.key, winners);
    });
    return result;
  }, [cols]);

  const showDebug = isDebug();

  return (
    <main className="container py-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-brand-800">Comparar Selecionados</h1>
        <Link href="/" className="text-sm text-orange-600 hover:underline">← Voltar ao simulador</Link>
      </header>

      {showDebug && (
        <div className="text-xs p-2 rounded bg-slate-50 border">
          <strong>DEBUG →</strong>{' '}
          {JSON.stringify({ selectedIds, received: prepared.slice(0,5).map(g=>String(g.id)) })}
        </div>
      )}

      {cols.length === 0 ? (
        <p className="text-gray-600">Você ainda não selecionou grupos compatíveis com o catálogo.</p>
      ) : (
        <div className="w-full overflow-auto">
          <table className="w-full border-separate border-spacing-0 rounded-2xl overflow-hidden">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white border-b px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500">
                  Atributo
                </th>
                {cols.map((g, idx) => (
                  <th key={g.id || idx} className="border-b px-4 py-3 text-left">
                    <div className="text-xs text-gray-500">#{g.numeroGrupo || g.id}</div>
                    <div className="text-sm font-medium">
                      {(g.__pKey ? productLabel(g.__pKey) : g.produto) || '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(g.__aKey ? adminLabel(g.__
