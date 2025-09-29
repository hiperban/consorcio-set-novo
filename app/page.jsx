'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';

/* Helpers */
function N(v){
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g,' ')
    .trim()
    .toUpperCase();
}
function slugKey(v){
  const t = N(v);
  const k = t.replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
  return k || 'OUTROS_BENS';
}
function numLoose(v){
  if (v == null) return NaN;
  if (typeof v === 'number') return v;
  let s = String(v).trim();
  if (!s) return NaN;
  s = s.replace(/[^\d,.-]/g,'');
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g,'').replace(',', '.');
  else if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}
function intLoose(v){
  if (v == null) return NaN;
  if (typeof v === 'number') return Math.trunc(v);
  const m = String(v).match(/\d+/);
  return m ? parseInt(m[0],10) : NaN;
}

/* Carrega e junta datasets */
async function loadAllDatasets() {
  // Tenta baixar o manifesto
  let man;
  try {
    const r = await fetch('/data/_manifest.json', { cache:'no-store' });
    if (!r.ok) {
      console.error('[data] 404/_manifest.json não encontrado', r.status, r.statusText);
      return { administradoras: [], grupos: [] };
    }
    man = await r.json();
  } catch (e) {
    console.error('[data] erro lendo _manifest.json', e);
    return { administradoras: [], grupos: [] };
  }

  const files = Array.isArray(man?.datasets) ? man.datasets : [];
  const grupos = [];
  const admMap = new Map(); // id -> {id,nome}

  // Busca cada dataset, mas se algum 404, loga e continua
  for (const fRaw of files) {
    const f = String(fRaw || '').trim().replace(/^\/+/, '');
    if (!f) continue;
    const url = `/data/${encodeURIComponent(f)}`;
    try {
      const r = await fetch(url, { cache:'no-store' });
      if (!r.ok) {
        console.warn('[data] 404 ao carregar dataset:', url, r.status, r.statusText);
        continue;
      }
      const d = await r.json();
      (d?.administradoras || []).forEach(a => { if (a?.id && !admMap.has(String(a.id))) admMap.set(String(a.id), a); });
      (d?.grupos || []).forEach(g => grupos.push(g));
    } catch (e) {
      console.warn('[data] erro ao ler dataset:', url, e);
    }
  }

  console.debug('[data] carregado:', { datasets: files.length, administradoras: admMap.size, grupos: grupos.length });
  return { administradoras: Array.from(admMap.values()), grupos };
}

export default function Home() {
  const [raw, setRaw] = useState({ administradoras: [], grupos: [] });
  const [flt, setFlt] = useState({
    minCarta: undefined,
    maxCarta: undefined,
    adminKey: '',
    productKey: '',
    tipoKey: '',
    lanceMin: undefined,
    prazo: undefined,
  });

  useEffect(() => {
    (async () => {
      try { setRaw(await loadAllDatasets()); }
      catch { setRaw({ administradoras: [], grupos: [] }); }
    })();
  }, []);

  const admById = useMemo(() => {
    const m = new Map();
    (raw.administradoras || []).forEach(a => { if (a?.id) m.set(String(a.id), a); });
    return m;
  }, [raw]);

  // PREPROCESS: adiciona campos __*
  const data = useMemo(() => {
    const grupos = (raw.grupos || []).map(g => {
      const adminName = adminNameForGroup(g, admById);
      return {
        ...g,
        __adminKey: N(adminName),
        __productKey: slugKey(g?.produto),
        __tipoKey: N(g?.tipoGrupo),
        __valorCarta: numLoose(g?.valorCarta),
        __valorParcela: numLoose(g?.valorParcela),
        __lanceMedio: numLoose(g?.lanceMedio),
        __prazo: intLoose(g?.prazo),
        __adminName: adminName,
      };
    });
    return { administradoras: raw.administradoras, grupos };
  }, [raw, admById]);

  // Recebe filtros já como CHAVES
  function handleApplyFromUI(ui){
    console.debug('[page] apply filters <-', ui);
    setFlt({
      minCarta: ui.minCarta ?? undefined,
      maxCarta: ui.maxCarta ?? undefined,
      adminKey: ui.adminKey || '',
      productKey: ui.productKey || '',
      tipoKey: ui.tipoKey || '',
      lanceMin: ui.lanceMin ?? undefined,
      prazo: ui.prazo ?? undefined,
    });
  }

  const filtered = useMemo(() => {
    const { minCarta, maxCarta, adminKey, productKey, tipoKey, lanceMin, prazo } = flt;
    const out = (data.grupos || []).filter(g => {
      if (minCarta != null && Number.isFinite(minCarta) && !(g.__valorCarta >= Number(minCarta))) return false;
      if (maxCarta != null && Number.isFinite(maxCarta) && !(g.__valorCarta <= Number(maxCarta))) return false;
      if (adminKey   && g.__adminKey   !== adminKey)   return false;
      if (productKey && g.__productKey !== productKey) return false;
      if (tipoKey    && g.__tipoKey    !== tipoKey)    return false;
      if (lanceMin != null && Number.isFinite(lanceMin) && !(g.__lanceMedio >= Number(lanceMin))) return false;
      if (prazo    != null && Number.isFinite(prazo)    && !(g.__prazo === Number(prazo))) return false;
      return true;
    });
    console.debug('[page] filtered', {
      total: data.grupos?.length || 0,
      after: out.length,
      keys: { adminKey, productKey, tipoKey, minCarta, maxCarta, lanceMin, prazo },
      sample: out.slice(0,3).map(g=>({__adminKey:g.__adminKey,__productKey:g.__productKey,numero:g.numeroGrupo}))
    });
    return out;
  }, [data, flt]);

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-800">Simulador de Consórcio</h1>
        <p className="text-xs text-gray-500">
          <strong>Debug:</strong> adminKey=<code>{flt.adminKey||'-'}</code> · productKey=<code>{flt.productKey||'-'}</code> · tipoKey=<code>{flt.tipoKey||'-'}</code>
        </p>
      </header>

      <Filters data={data} onApply={handleApplyFromUI} />

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
        {filtered.map((g, idx) => (
          <GroupCard
            key={g.id ?? `${g.__adminKey}-${g.__productKey}-${g.numeroGrupo ?? idx}`}
            group={{ ...g, nomeAdministradora: g.__adminName || g.nomeAdministradora }}
          />
        ))}
      </div>
    </main>
  );
}
