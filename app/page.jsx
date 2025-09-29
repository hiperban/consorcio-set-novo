'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';

/* ---------- Utils ---------- */
const N = (v) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

function numLoose(v) {
  if (v == null) return NaN;
  if (typeof v === 'number') return v;
  let s = String(v).trim();
  if (!s) return NaN;
  s = s.replace(/[^\d,.-]/g, '');                // remove moeda/espaço
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}
const intLoose = (v) => (Number.isFinite(+v) ? Math.trunc(+v) : (String(v).match(/\d+/) ? parseInt(String(v).match(/\d+/)[0],10) : NaN));

/* Produto/Tipo canônicos */
function productToCodeAndLabel(raw) {
  const t = N(raw);
  if (/(AUTO|CARRO|VEICUL)/.test(t)) return { code: 'AUTOMOVEL', label: 'Automóvel' };
  if (/(IMOVEL|IMÓVEL|IMOVEIS)/.test(t)) return { code: 'IMOVEL', label: 'Imóvel' };
  if (/(MOTO|MOTOCICL)/.test(t)) return { code: 'MOTO', label: 'Moto' };
  if (/(SERVI[ÇC]O)/.test(t)) return { code: 'SERVICO', label: 'Serviços' };
  if (/(CAMINHAO)/.test(t)) return { code: 'CAMINHAO', label: 'Caminhão' };
  if (/(PLACA|SOLAR)/.test(t)) return { code: 'PLACA_SOLAR', label: 'Placa Solar' };
  return { code: 'OUTROS', label: raw || 'Outros Bens' };
}
const tipoToCode = (raw) => (N(raw).includes('REDUZ') ? 'REDUZIDA' : (N(raw).includes('INTEGRAL') ? 'INTEGRAL' : ''));

function adminNameForGroup(g, admById) {
  const byId = g?.administradoraId ? admById.get(String(g.administradoraId))?.nome : '';
  return byId || g?.nomeAdministradora || '';
}

/* Leitura dos datasets listados no manifest */
async function loadAllDatasets() {
  const manRes = await fetch('/data/_manifest.json', { cache: 'no-store' });
  if (!manRes.ok) return { administradoras: [], grupos: [] };
  const man = await manRes.json();
  const files = Array.isArray(man?.datasets) ? man.datasets : [];

  const grupos = [];
  const admMap = new Map();
  for (const f of files) {
    const file = String(f || '').trim();
    if (!file) continue;
    const r = await fetch(`/data/${encodeURIComponent(file)}`, { cache: 'no-store' });
    if (!r.ok) continue;
    const d = await r.json();
    (d?.administradoras || []).forEach((a) => a?.id && admMap.set(String(a.id), a));
    (d?.grupos || []).forEach((g) => grupos.push(g));
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

/* Comparação segura com o filtro */
function matches(g, flt) {
  // ADMIN
  if (flt.adminKey) {
    const adminMatchById = flt.adminKey.startsWith('id:') && g.__adminId === flt.adminKey.slice(3);
    const adminMatchByName =
      !flt.adminKey.startsWith('id:') &&
      (g.__adminKey === flt.adminKey || N(g.nomeAdministradora) === flt.adminKey);
    if (!(adminMatchById || adminMatchByName)) return false;
  }
  // PRODUTO
  if (flt.productCode) {
    const codeOk = g.__productCode === flt.productCode;
    const rawOk = N(g.produto) === N(flt.productCode); // se vier “IMÓVEL” direto
    if (!(codeOk || rawOk)) return false;
  }
  // TIPO
  if (flt.tipoCode) {
    const codeOk = g.__tipoCode === flt.tipoCode;
    const rawOk = N(g.tipoGrupo).includes(flt.tipoCode); // aceita “PARCELA REDUZIDA”
    if (!(codeOk || rawOk)) return false;
  }
  // NUMÉRICOS
  if (Number.isFinite(flt.minCarta) && !(g.__valorCarta >= flt.minCarta)) return false;
  if (Number.isFinite(flt.maxCarta) && !(g.__valorCarta <= flt.maxCarta)) return false;
  if (Number.isFinite(flt.lanceMin) && !(g.__lanceMedio >= flt.lanceMin)) return false;
  if (Number.isFinite(flt.prazo) && !(g.__prazo === flt.prazo)) return false;
  return true;
}

/* ---------- Página ---------- */
export default function Home() {
  const [raw, setRaw] = useState({ administradoras: [], grupos: [] });
  const [flt, setFlt] = useState({}); // estado do filtro

  useEffect(() => {
    (async () => {
      try { setRaw(await loadAllDatasets()); }
      catch { setRaw({ administradoras: [], grupos: [] }); }
    })();
  }, []);

  const admById = useMemo(() => {
    const m = new Map();
    (raw.administradoras || []).forEach((a) => a?.id && m.set(String(a.id), a));
    return m;
  }, [raw]);

  // Base normalizada para comparação
  const base = useMemo(() => {
    return (raw.grupos || []).map((g) => {
      const adminName = adminNameForGroup(g, admById);
      const { code: productCode, label: productLabel } = productToCodeAndLabel(g?.produto);
      return {
        ...g,
        __adminId: g?.administradoraId ? String(g.administradoraId) : '',
        __adminName: adminName,
        __adminKey: N(adminName),
        __productCode: productCode,
        __productLabel: productLabel,
        __tipoCode: tipoToCode(g?.tipoGrupo),
        __valorCarta: numLoose(g?.valorCarta),
        __valorParcela: numLoose(g?.valorParcela),
        __lanceMedio: numLoose(g?.lanceMedio),
        __prazo: intLoose(g?.prazo),
      };
    });
  }, [raw, admById]);

  // Filtrados
  const visible = useMemo(() => base.filter((g) => matches(g, flt)), [base, flt]);

  // opcional: ajuda de debug no console
  useEffect(() => {
    try {
      window.__DBG = {
        filtro: flt,
        totalBase: base.length,
        totalVisivel: visible.length,
        amostra: visible.slice(0, 5).map((g) => ({
          adminId: g.__adminId,
          admin: g.__adminName,
          produtoCode: g.__productCode,
          tipoCode: g.__tipoCode,
          produtoRaw: g.produto,
          tipoRaw: g.tipoGrupo,
        })),
      };
    } catch {}
  }, [base, visible, flt]);

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-800">Simulador de Consórcio</h1>
      </header>

      {/* Filters envia { adminKey, productCode, tipoCode, minCarta, maxCarta, lanceMin, prazo } */}
      <Filters data={{ grupos: base }} onApply={setFlt} />

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
        {visible.map((g, idx) => (
          <GroupCard
            key={g.id ?? `${g.__adminKey}-${g.__productCode}-${g.numeroGrupo ?? idx}`}
            group={{
              ...g,
              nomeAdministradora: g.__adminName || g.nomeAdministradora,
              produto: g.__productLabel, // exibe label bonito
            }}
          />
        ))}
      </div>
    </main>
  );
}
