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

/* Enums robustos para produto */
function productToCodeAndLabel(raw){
  const t = N(raw);
  if (/(AUTO|CARRO|VEICUL)/.test(t)) return { code:'AUTOMOVEL', label:'Automóvel' };
  if (/(IMOVEL|IM\u00D3VEL|IMOVEIS)/.test(t)) return { code:'IMOVEL', label:'Imóvel' };
  if (/(MOTO|MOTOCICL)/.test(t)) return { code:'MOTO', label:'Moto' };
  if (/(SERVI[ÇC]O)/.test(t)) return { code:'SERVICO', label:'Serviços' };
  if (/(CAMINHAO)/.test(t)) return { code:'CAMINHAO', label:'Caminhão' };
  if (/(PLACA|SOLAR)/.test(t)) return { code:'PLACA_SOLAR', label:'Placa Solar' };
  return { code:'OUTROS', label: raw ? raw : 'Outros Bens' };
}
function tipoToCode(raw){
  const t = N(raw);
  if (t.includes('INTEGRAL')) return 'INTEGRAL';
  if (t.includes('REDUZIDA')) return 'REDUZIDA';
  return '';
}
function adminNameForGroup(g, admById) {
  const byId = g?.administradoraId ? admById.get(String(g.administradoraId))?.nome : '';
  return byId || g?.nomeAdministradora || '';
}

/* Carrega todos os datasets listados no _manifest.json */
async function loadAllDatasets() {
  const rMan = await fetch('/data/_manifest.json', { cache:'no-store' });
  if (!rMan.ok) return { administradoras: [], grupos: [] };
  const man = await rMan.json();
  const files = Array.isArray(man?.datasets) ? man.datasets : [];

  const grupos = [];
  const admMap = new Map();
  for (const fRaw of files) {
    const f = String(fRaw || '').trim();
    if (!f) continue;
    const r = await fetch(`/data/${encodeURIComponent(f)}`, { cache:'no-store' });
    if (!r.ok) continue;
    const d = await r.json();
    (d?.administradoras || []).forEach(a => { if (a?.id) admMap.set(String(a.id), a); });
    (d?.grupos || []).forEach(g => grupos.push(g));
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

/* Função única que decide se o grupo passa no filtro */
function matches(g, flt) {
  // Admin
  if (flt.adminKey) {
    if (flt.adminKey.startsWith('id:')) {
      const id = flt.adminKey.slice(3);
      if (g.__adminId !== id) return false;
    } else {
      if (g.__adminKey !== flt.adminKey) return false;
    }
  }
  // Produto e Tipo
  if (flt.productCode && g.__productCode !== flt.productCode) return false;
  if (flt.tipoCode && g.__tipoCode !== flt.tipoCode) return false;

  // Numéricos
  if (Number.isFinite(flt.minCarta) && !(g.__valorCarta >= flt.minCarta)) return false;
  if (Number.isFinite(flt.maxCarta) && !(g.__valorCarta <= flt.maxCarta)) return false;
  if (Number.isFinite(flt.lanceMin) && !(g.__lanceMedio >= flt.lanceMin)) return false;
  if (Number.isFinite(flt.prazo)    && !(g.__prazo === flt.prazo))       return false;

  return true;
}

export default function Home() {
  const [raw, setRaw] = useState({ administradoras: [], grupos: [] });
  const [flt, setFlt] = useState({}); // estado do filtro atual

  // carrega datasets
  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadAllDatasets();
        setRaw(loaded);
      } catch {
        setRaw({ administradoras: [], grupos: [] });
      }
    })();
  }, []);

  // mapa de administradoras por id
  const admById = useMemo(() => {
    const m = new Map();
    (raw.administradoras || []).forEach(a => { if (a?.id) m.set(String(a.id), a); });
    return m;
  }, [raw]);

  // prepara base com campos canônicos
  const base = useMemo(() => {
    return (raw.grupos || []).map(g => {
      const adminName = adminNameForGroup(g, admById);
      const { code:productCode, label:productLabel } = productToCodeAndLabel(g?.produto);
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

  // aplica filtro SEMPRE que flt ou base mudarem
  const visible = useMemo(() => {
    const safe = {
      minCarta: Number.isFinite(flt.minCarta) ? flt.minCarta : undefined,
      maxCarta: Number.isFinite(flt.maxCarta) ? flt.maxCarta : undefined,
      adminKey: flt.adminKey || '',
      productCode: flt.productCode || '',
      tipoCode: flt.tipoCode || '',
      lanceMin: Number.isFinite(flt.lanceMin) ? flt.lanceMin : undefined,
      prazo: Number.isFinite(flt.prazo) ? flt.prazo : undefined,
    };
    return base.filter(g => matches(g, safe));
  }, [base, flt]);

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-800">Simulador de Consórcio</h1>
      </header>

      <Filters data={{ grupos: base }} onApply={setFlt} />

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
        {visible.map((g, idx) => (
          <GroupCard
            key={g.id ?? `${g.__adminKey}-${g.__productCode}-${g.numeroGrupo ?? idx}`}
            group={{ ...g, nomeAdministradora: g.__adminName || g.nomeAdministradora, produto: g.__productLabel }}
          />
        ))}
      </div>
    </main>
  );
}
