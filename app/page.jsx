'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';

/* Normalizações e enums robustos */
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

/* Map de produtos: sinônimos -> código + label amigável */
function productToCodeAndLabel(raw){
  const t = N(raw);
  // sinônimos comuns
  if (/(AUTO|CARRO|VEICUL)/.test(t)) return { code:'AUTOMOVEL', label:'Automóvel' };
  if (/(IMOVEL|IM\u00D3VEL|IMOVEIS)/.test(t)) return { code:'IMOVEL', label:'Imóvel' };
  if (/(MOTO|MOTOCICL)/.test(t)) return { code:'MOTO', label:'Moto' };
  if (/(SERVI[ÇC]O)/.test(t)) return { code:'SERVICO', label:'Serviços' };
  if (/(CAMINHAO)/.test(t)) return { code:'CAMINHAO', label:'Caminhão' };
  if (/(PLACA|SOLAR)/.test(t)) return { code:'PLACA_SOLAR', label:'Placa Solar' };
  return { code:'OUTROS', label: raw ? raw : 'Outros Bens' };
}

/* Tipo do grupo: INTEGRAL/REDUZIDA */
function tipoToCode(raw){
  const t = N(raw);
  if (t.includes('INTEGRAL')) return 'INTEGRAL';
  if (t.includes('REDUZIDA')) return 'REDUZIDA';
  return '';
}

/* Nome da administradora por ID quando disponível */
function adminNameForGroup(g, admById) {
  const byId = g?.administradoraId ? admById.get(String(g.administradoraId))?.nome : '';
  return byId || g?.nomeAdministradora || '';
}

/* Loader simples e determinístico */
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
    (d?.administradoras || []).forEach(a => { if (a?.id && !admMap.has(String(a.id))) admMap.set(String(a.id), a); });
    (d?.grupos || []).forEach(g => grupos.push(g));
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

export default function Home() {
  const [raw, setRaw] = useState({ administradoras: [], grupos: [] });

  // Resultado materializado (view) e filtros atuais
  const [view, setView] = useState([]); // ← cards mostrados
  const [flt, setFlt] = useState({
    minCarta: undefined,
    maxCarta: undefined,
    adminKey: '',
    productCode: '',
    tipoCode: '',
    lanceMin: undefined,
    prazo: undefined,
  });

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

  // PREPROCESSA uma vez: gera campos canônicos e mantém array base
  const base = useMemo(() => {
    const grupos = (raw.grupos || []).map(g => {
      const adminName = adminNameForGroup(g, admById);
      const { code:productCode, label:productLabel } = productToCodeAndLabel(g?.produto);
      return {
        ...g,
        __adminId: g?.administradoraId ? String(g.administradoraId) : '',
        __adminName: adminName,
        __adminKey: N(adminName),          // p/ filtro por nome
        __productCode: productCode,        // enum robusto
        __productLabel: productLabel,      // label amigável
        __tipoCode: tipoToCode(g?.tipoGrupo),
        __valorCarta: numLoose(g?.valorCarta),
        __valorParcela: numLoose(g?.valorParcela),
        __lanceMedio: numLoose(g?.lanceMedio),
        __prazo: intLoose(g?.prazo),
      };
    });
    return grupos;
  }, [raw, admById]);

  // assim que base muda, mostra tudo
  useEffect(() => { setView(base); }, [base]);

  // Aplica filtros de forma determinística e salva em view (sem useMemo)
  function applyFilters(ui){
    const next = {
      minCarta: ui.minCarta ?? undefined,
      maxCarta: ui.maxCarta ?? undefined,
      adminKey: ui.adminKey || '',
      productCode: ui.productCode || '',
      tipoCode: ui.tipoCode || '',
      lanceMin: ui.lanceMin ?? undefined,
      prazo: ui.prazo ?? undefined,
    };
    setFlt(next);

    const out = base.filter(g => {
      // Admin: aceita "id:3" OU chave por nome
      if (next.adminKey) {
        if (next.adminKey.startsWith('id:')) {
          const id = next.adminKey.slice(3);
          if (g.__adminId !== id) return false;
        } else {
          if (g.__adminKey !== next.adminKey) return false;
        }
      }
      if (next.productCode && g.__productCode !== next.productCode) return false;
      if (next.tipoCode && g.__tipoCode !== next.tipoCode) return false;

      if (next.minCarta != null && Number.isFinite(next.minCarta) && !(g.__valorCarta >= Number(next.minCarta))) return false;
      if (next.maxCarta != null && Number.isFinite(next.maxCarta) && !(g.__valorCarta <= Number(next.maxCarta))) return false;
      if (next.lanceMin != null && Number.isFinite(next.lanceMin) && !(g.__lanceMedio >= Number(next.lanceMin))) return false;
      if (next.prazo != null && Number.isFinite(next.prazo) && !(g.__prazo === Number(next.prazo))) return false;

      return true;
    });

    setView(out);
  }

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-800">Simulador de Consórcio</h1>
    </header>

      {/* Filtros: quando clicar em aplicar, materializa em view */}
      <Filters data={{ grupos: base }} onApply={applyFilters} />

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
        {(Array.isArray(view) ? view : []).map((g, idx) => (
          <GroupCard
            key={g.id ?? `${g.__adminKey}-${g.__productCode}-${g.numeroGrupo ?? idx}`}
            group={{ ...g, nomeAdministradora: g.__adminName || g.nomeAdministradora, produto: g.__productLabel }}
          />
        ))}
      </div>
    </main>
  );
}
