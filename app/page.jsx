'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';

/* ------------ Normalização & helpers ------------ */
function N(v) {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}
function toTitle(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/(^|[\s_-])([a-zà-ú])/g, (_, p, c) => p + c.toUpperCase());
}
function slugKey(v) {
  const t = N(v);
  const k = t.replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  return k || 'OUTROS_BENS';
}

/* ------------ Merge + sanitização dos datasets ------------ */
function mergeDatasets(list) {
  const admMap = new Map(); // id -> {id,nome}
  const grupos = [];

  for (const d of list || []) {
    const adms = Array.isArray(d?.administradoras) ? d.administradoras : [];
    const gs = Array.isArray(d?.grupos) ? d.grupos : [];

    adms.forEach(a => {
      const id = String(a?.id || '').trim();
      const nome = String(a?.nome || '').trim();
      if (id && !admMap.has(id)) admMap.set(id, { id, nome });
    });

    gs.forEach(g => {
      const id = String(g?.id || '').trim();
      const administradoraId = String(g?.administradoraId || '').trim();
      const produto = String(g?.produto || '').trim();
      const tipoGrupo = String(g?.tipoGrupo || '').trim();
      if (!id || !administradoraId || !produto) return; // ignora inválidos

      grupos.push({
        ...g,
        id,
        administradoraId,
        produto,
        tipoGrupo,
        valorCarta: Number(g?.valorCarta ?? 0),
        valorParcela: Number(g?.valorParcela ?? 0),
        taxaAdm: Number(g?.taxaAdm ?? 0),
        lanceMedio: Number(g?.lanceMedio ?? 0),
        prazo: Number(g?.prazo ?? 0),
      });
    });
  }

  return { administradoras: Array.from(admMap.values()), grupos };
}

/* ------------ Admin key por NOME (estável) ------------ */
function adminKeyFromGroup(g, administradorasMap) {
  const id = String(g?.administradoraId ?? '');
  const byId = administradorasMap.get(id)?.nome;
  const name = byId || g?.nomeAdministradora || '';
  return N(name);
}

export default function Home() {
  const [data, setData] = useState({ administradoras: [], grupos: [] });
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  // Mapa opcional de produtos (/_product-map.json)
  const [prodMap, setProdMap] = useState({ map: {}, labels: {} });
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/data/_product-map.json', { cache: 'no-store' });
        if (!res.ok) {
          setProdMap({ map: {}, labels: {} });
          return;
        }
        const j = await res.json();
        const map = {};
        Object.entries(j.map || {}).forEach(([raw, key]) => {
          map[N(raw)] = String(key);
        });
        setProdMap({ map, labels: j.labels || {} });
      } catch {
        setProdMap({ map: {}, labels: {} });
      }
    })();
  }, []);

  const administradorasMap = useMemo(() => {
    const m = new Map();
    (data?.administradoras || []).forEach(a => {
      if (a?.id) m.set(String(a.id), a);
    });
    return m;
  }, [data]);

  // Carrega manifest + datasets com tolerância a falhas
  useEffect(() => {
    async function loadAll() {
      try {
        const man = await fetch('/data/_manifest.json', { cache: 'no-store' }).then(r => r.json());
        const files = Array.isArray(man?.datasets) ? man.datasets : [];

        const results = await Promise.allSettled(
          files.map(f =>
            fetch(`/data/${f}`, { cache: 'no-store' })
              .then(r => {
                if (!r.ok) throw new Error(`Falha ao baixar ${f}: ${r.status}`);
                return r.json();
              })
              .then(j => ({ file: f, data: j }))
          )
        );

        const ok = results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value.data);

        results
          .filter(r => r.status === 'rejected')
          .forEach(r => console.warn('[Dataset ignorado]', r.reason));

        setData(mergeDatasets(ok));
      } catch (e) {
        console.error('Erro ao carregar datasets:', e);
        setData({ administradoras: [], grupos: [] });
      }
    }
    loadAll();

    // tentar recuperar seleção do localStorage
    try {
      const raw = localStorage.getItem('compareSelection');
      if (raw) setSelectedIds(JSON.parse(raw));
    } catch {}
  }, []);

  // canoniza produto dinamicamente com fallback
  const productKey = (label) => {
    const norm = N(label);
    const mapped = prodMap.map[norm];
    return mapped || slugKey(norm);
  };

  /* ---------- aplica filtros ---------- */
  const filtered = useMemo(() => {
    const { minCarta, maxCarta, admKey, produtoKey, tipoGrupo, lanceMin, prazo } = filters || {};
    return (data.grupos || []).filter(g => {
      const okMin   = minCarta == null ? true : Number(g?.valorCarta ?? 0)  >= Number(minCarta);
      const okMax   = maxCarta == null ? true : Number(g?.valorCarta ?? 0)  <= Number(maxCarta);

      const gAdmKey = adminKeyFromGroup(g, administradorasMap);
      const okAdm   = !admKey ? true : gAdmKey === String(admKey);

      const okProd  = !produtoKey ? true : productKey(g?.produto) === String(produtoKey);
      const okTipo  = !tipoGrupo  ? true : N(g?.tipoGrupo)        === String(tipoGrupo);
      const okLance = lanceMin == null ? true : Number(g?.lanceMedio ?? 0) >= Number(lanceMin);
      const okPrazo = prazo == null    ? true : Number(g?.prazo ?? 0)      === Number(prazo);

      return okMin && okMax && okAdm && okProd && okTipo && okLance && okPrazo;
    });
  }, [filters, data, administradorasMap, prodMap]);

  /* ---------- seleção para comparar ---------- */
  const selected = useMemo(() => {
    const set = new Set(selectedIds);
    return (data.grupos || []).filter(g => set.has(g.id)).slice(0, 4);
  }, [selectedIds, data]);

  const onToggleCompare = (id) => {
    setSelectedIds(prev => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id);
      else if (set.size < 4) set.add(id);
      const arr = Array.from(set);
      try { localStorage.setItem('compareSelection', JSON.stringify(arr)); } catch {}
      return arr;
    });
  };

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-800">Simulador de Consórcio</h1>
        <p className="text-sm text-gray-600">Filtros dinâmicos, visual moderno e contratação direta.</p>
      </header>

      <Filters data={data} onFilterChange={setFilters} />

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(404px,1fr))]">
        {filtered.map(g => (
          <GroupCard
            key={g.id}
            group={g}
            administradoraName={administradorasMap.get(String(g.administradoraId))?.nome || g?.nomeAdministradora || ''}
            productLabel={prodMap.labels[productKey(g?.produto)] || toTitle(g?.produto)}
            inCompare={selectedIds.includes(g.id)}
            onToggleCompare={() => onToggleCompare(g.id)}
          />
        ))}
      </div>

      {selected.length > 0 && (
        <section className="sticky bottom-4 bg-white border rounded-2xl shadow p-4">
          <h2 className="font-medium mb-2">Selecionados para comparar ({selected.length}/4)</h2>
          <div className="flex gap-3 flex-wrap">
            {selected.map(s => (
              <span key={s.id} className="text-xs border rounded-full px-3 py-1">
                #{s.numeroGrupo || s.id} — {toTitle(s.produto)}
              </span>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
