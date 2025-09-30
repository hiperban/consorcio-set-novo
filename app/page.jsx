'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';
import {
  STRICT_MODE,
  canonProduct, productLabel,
  canonAdmin,   adminLabel,
} from '@/config/catalog';

/* Helpers */
function N(v) {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

/* Merge + sanitização básica */
function mergeDatasets(list) {
  const admMap = new Map(); // id -> {id,nome}
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
      const tipoGrupo = String(g?.tipoGrupo || '').trim();
      if (!id || !administradoraId || !produto) return;

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

function adminNameFromGroup(g, administradorasMap){
  const id = String(g?.administradoraId ?? '');
  const byId = administradorasMap.get(id)?.nome;
  return byId || g?.nomeAdministradora || '';
}

export default function Home() {
  const [rawData, setRawData] = useState({ administradoras: [], grupos: [] });
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  // carrega manifest + datasets (tolerante a falhas)
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

        setRawData(mergeDatasets(ok));

        try {
          const raw = localStorage.getItem('compareSelection');
          if (raw) setSelectedIds(JSON.parse(raw));
        } catch {}
      } catch (e) {
        console.error('Erro ao carregar datasets:', e);
        setRawData({ administradoras: [], grupos: [] });
      }
    }
    loadAll();
  }, []);

  // mapa de administradoras por id (para descobrir nome “oficial”)
  const administradorasMap = useMemo(() => {
    const m = new Map();
    (rawData?.administradoras || []).forEach(a => { if (a?.id) m.set(String(a.id), a); });
    return m;
  }, [rawData]);

  // PRÉ-PROCESSA grupos: anexa aKey (admin canônica) e pKey (produto canônica)
  const data = useMemo(() => {
    const prepared = (rawData.grupos || []).map(g => {
      const admName = adminNameFromGroup(g, administradorasMap);
      const aKey = canonAdmin(admName);   // null se não estiver no catálogo
      const pKey = canonProduct(g?.produto); // null se não estiver no catálogo
      return { ...g, __admName: admName, __aKey: aKey, __pKey: pKey };
    });

    // Se STRICT_MODE: esconda tudo que não mapeia para o catálogo
    const grupos = STRICT_MODE ? prepared.filter(g => g.__aKey && g.__pKey) : prepared;

    return { administradoras: rawData.administradoras, grupos };
  }, [rawData, administradorasMap]);

  /* ---------- aplica filtros como interseção ---------- */
  const filtered = useMemo(() => {
    const { minCarta, maxCarta, admKey, produtoKey, tipoGrupo, lanceMin, prazo } = filters || {};
    return (data.grupos || []).filter(g => {
      // Numéricos
      const okMin   = minCarta == null ? true : Number(g?.valorCarta ?? 0)  >= Number(minCarta);
      const okMax   = maxCarta == null ? true : Number(g?.valorCarta ?? 0)  <= Number(maxCarta);
      const okLance = lanceMin == null ? true : Number(g?.lanceMedio ?? 0) >= Number(lanceMin);
      const okPrazo = prazo == null    ? true : Number(g?.prazo ?? 0)      === Number(prazo);

      // Chaves canônicas já pré-calculadas
      const okAdm   = !admKey     ? true : String(g.__aKey) === String(admKey);
      const okProd  = !produtoKey ? true : String(g.__pKey) === String(produtoKey);
      const okTipo  = !tipoGrupo  ? true : N(g?.tipoGrupo)  === String(tipoGrupo);

      // Interseção de todos os critérios
      return okMin && okMax && okAdm && okProd && okTipo && okLance && okPrazo;
    });
  }, [filters, data]);

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
        <p className="text-sm text-gray-600">Filtros com interseção de critérios (Admin × Produto × Tipo × Faixas).</p>
      </header>

      <Filters data={data} onFilterChange={setFilters} />

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(404px,1fr))]">
        {filtered.map(g => (
          <GroupCard
            key={g.id}
            group={g}
            administradoraName={adminLabel(g.__aKey) || g.__admName}
            productLabel={productLabel(g.__pKey) || g?.produto}
            inCompare={selectedIds.includes(g.id)}
            onToggleCompare={() => onToggleCompare(g.id)}
          />
        ))}
      </div>
    </main>
  );
}
