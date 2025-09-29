'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';

/* Helpers para campos canônicos e números */
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

/* Carrega todos os datasets listados no manifesto */
async function loadAllDatasets() {
  const rMan = await fetch('/data/_manifest.json', { cache:'no-store' });
  if (!rMan.ok) return { administradoras: [], grupos: [] };
  const man = await rMan.json();
  const files = Array.isArray(man?.datasets) ? man.datasets : [];

  const grupos = [];
  const admMap = new Map(); // id -> {id,nome}

  for (const fRaw of files) {
    const f = String(fRaw || '').trim();
    if (!f) continue;
    const r = await fetch(`/data/${encodeURIComponent(f)}`, { cache:'no-store' });
    if (!r.ok) continue;
    const d = await r.json();
    (d?.administradoras || []).forEach(a => {
      if (a?.id && !admMap.has(String(a.id))) admMap.set(String(a.id), a);
    });
    (d?.grupos || []).forEach(g => grupos.push(g));
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

/* Resolve o nome da administradora de cada grupo */
function adminNameForGroup(g, admById) {
  const byId = g?.administradoraId ? admById.get(String(g.administradoraId))?.nome : '';
  return byId || g?.nomeAdministradora || '';
}

export default function Home() {
  const [raw, setRaw] = useState({ administradoras: [], grupos: [] });

  // Filtros (sempre usando CHAVES)
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

  // Mapa de administradoras por ID
  const admById = useMemo(() => {
    const m = new Map();
    (raw.administradoras || []).forEach(a => { if (a?.id) m.set(String(a.id), a); });
    return m;
  }, [raw]);

  // PREPROCESSA: adiciona campos canônicos __* para comparação rápida
  const data = useMemo(() => {
    const grupos = (raw.grupos || []).map(g => {
      const adminName = adminNameForGroup(g, admById);
      return {
        ...g,
        __adminName: adminName,
        __adminKey: N(adminName),           // ex.: "ÂNCORA" -> "ANCORA"
        __productKey: slugKey(g?.produto),  // ex.: "AUTOMOVEL" -> "AUTOMOVEL"
        __tipoKey: N(g?.tipoGrupo),         // ex.: "PARCELA INTEGRAL" -> "PARCELA INTEGRAL"
        __valorCarta: numLoose(g?.valorCarta),
        __valorParcela: numLoose(g?.valorParcela),
        __lanceMedio: numLoose(g?.lanceMedio),
        __prazo: intLoose(g?.prazo),
      };
    });
    return { administradoras: raw.administradoras, grupos };
  }, [raw, admById]);

  // Recebe filtros aplicados pelo componente de filtros
  function handleApplyFromUI(ui){
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

  // FILTRAGEM AND ESTRITA (chave-com-chave; números com verificação)
  const filtered = useMemo(() => {
    const arr = Array.isArray(data?.grupos) ? data.grupos : [];
    const { minCarta, maxCarta, adminKey, productKey, tipoKey, lanceMin, prazo } = flt;

    return arr.filter(g => {
      if (minCarta != null && Number.isFinite(minCarta) && !(g.__valorCarta >= Number(minCarta))) return false;
      if (maxCarta != null && Number.isFinite(maxCarta) && !(g.__valorCarta <= Number(maxCarta))) return false;
      if (adminKey   && g.__adminKey   !== adminKey)   return false;
      if (productKey && g.__productKey !== productKey) return false;
      if (tipoKey    && g.__tipoKey    !== tipoKey)    return false;
      if (lanceMin   != null && Number.isFinite(lanceMin) && !(g.__lanceMedio >= Number(lanceMin))) return false;
      if (prazo      != null && Number.isFinite(prazo)    && !(g.__prazo === Number(prazo))) return false;
      return true;
    });
  }, [data, flt]);

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-800">Simulador de Consórcio</h1>
      </header>

      <Filters data={data} onApply={handleApplyFromUI} />

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
        {(filtered || []).map((g, idx) => (
          <GroupCard
            key={g.id ?? `${g.__adminKey}-${g.__productKey}-${g.numeroGrupo ?? idx}`}
            group={{ ...g, nomeAdministradora: g.__adminName || g.nomeAdministradora }}
          />
        ))}
      </div>
    </main>
  );
}
