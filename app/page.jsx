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

/* Junta datasets com sanitização básica */
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

/* Regra única de casamento de filtros (usada no useMemo e também no render) */
function matchGroup(g, filters) {
  const { minCarta, maxCarta, admKey, produtoKey, tipoGrupo, lanceMin, prazo } = filters || {};
  const aKey = g.__aKey;
  const pKey = g.__pKey;

  if (STRICT_MODE && (!aKey || !pKey)) return false;

  const okAdm   = !admKey     ? true : String(aKey) === String(admKey);
  const okProd  = !produtoKey ? true : String(pKey) === String(produtoKey);
  const okTipo  = !tipoGrupo  ? true : N(g?.tipoGrupo) === String(tipoGrupo);

  const okMin   = minCarta == null ? true : Number(g?.valorCarta ?? 0)  >= Number(minCarta);
  const okMax   = maxCarta == null ? true : Number(g?.valorCarta ?? 0)  <= Number(maxCarta);
  const okLance = lanceMin == null ? true : Number(g?.lanceMedio ?? 0) >= Number(lanceMin);
  const okPrazo = prazo == null    ? true : Number(g?.prazo ?? 0)      === Number(prazo);

  return okAdm && okProd && okTipo && okMin && okMax && okLance && okPrazo;
}

export default function Home() {
  const [rawData, setRawData] = useState({ administradoras: [], grupos: [] });
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  // Carrega manifest + datasets (tolerante a falhas)
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

  // Mapa de administradoras por id (para descobrir o nome “oficial”)
  const administradorasMap = useMemo(() => {
    const m = new Map();
    (rawData?.administradoras || []).forEach(a => { if (a?.id) m.set(String(a.id), a); });
    return m;
  }, [rawData]);

  // Pré-processa: anexa __admName, __aKey, __pKey e aplica STRICT_MODE aqui
  const data = useMemo(() => {
    const prepared = (rawData.grupos || []).map(g => {
      const admName = adminNameFromGroup(g, administradorasMap);
      const aKey = canonAdmin(admName) || null;
      const pKey = canonProduct(g?.produto) || null;
      return { ...g, __admName: admName, __aKey: aKey, __pKey: pKey };
    });

    const grupos = STRICT_MODE
      ? prepared.filter(g => g.__aKey && g.__pKey)
      : prepared;

    return { administradoras: rawData.administradoras, grupos };
  }, [rawData, administradorasMap]);

  // Lista já filtrada (interseção)
  const filtered = useMemo(() => {
    return (data.grupos || []).filter(g => matchGroup(g, filters));
  }, [data, filters]);

  // Selecionados para comparar (apenas do conjunto filtrado)
  const selected = useMemo(() => {
    const set = new Set(selectedIds);
    return filtered.filter(g => set.has(g.id)).slice(0, 4);
  }, [selectedIds, filtered]);

  // Toggle compare
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

      {/* Painel de debug: mostra exatamente o que o page.jsx está recebendo */}
      <div className="text-xs p-2 rounded bg-slate-50 border">
        <strong>DEBUG filtros →</strong>{' '}
        {JSON.stringify(filters)}
      </div>

      <Filters data={data} onFilterChange={setFilters} />

      {/* Remount forçado do grid quando os filtros mudam */}
      <div
        key={[
          filters.admKey || '',
          filters.produtoKey || '',
          filters.tipoGrupo || '',
          filters.minCarta ?? '',
          filters.maxCarta ?? '',
          filters.lanceMin ?? '',
          filters.prazo ?? '',
        ].join('|')}
        className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(404px,1fr))]"
      >
        {filtered.map(g => {
          // Defesa final: mesmo que algo mude no meio do render, só mostra se casar
          if (!matchGroup(g, filters)) return null;

          // Chave composta para impedir reciclagem errada pelo React
          const compositeKey = `${g.id}::${g.__aKey || ''}::${g.__pKey || ''}`;

          return (
            <GroupCard
              key={compositeKey}
              group={g}
              administradoraName={adminLabel(g.__aKey) || g.__admName}
              productLabel={productLabel(g.__pKey) || g?.produto}
              inCompare={selectedIds.includes(g.id)}
              onToggleCompare={() => onToggleCompare(g.id)}
            />
          );
        })}
      </div>
    </main>
  );
}
