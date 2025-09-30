// app/compare/page.jsx
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { canonProduct, productLabel, canonAdmin, adminLabel, STRICT_MODE } from '@/config/catalog';

function N(v){
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

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
      });
    });
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

export default function ComparePage() {
  const [data, setData] = useState({ administradoras: [], grupos: [] });
  const [selectedIds, setSelectedIds] = useState([]);

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

        try {
          const raw = localStorage.getItem('compareSelection');
          if (raw) setSelectedIds(JSON.parse(raw));
        } catch {}
      } catch (e) {
        console.error(e);
        setData({ administradoras: [], grupos: [] });
      }
    }
    loadAll();
  }, []);

  const administradorasMap = useMemo(() => {
    const m = new Map();
    (data?.administradoras || []).forEach(a => { if (a?.id) m.set(String(a.id), a); });
    return m;
  }, [data]);

  const selected = useMemo(() => {
    const set = new Set(selectedIds);
    const arr = (data.grupos || []).filter(g => set.has(g.id));

    // STRICT_MODE: filtra apenas os que pertencem ao catálogo
    return arr.filter(g => {
      const admName = administradorasMap.get(String(g.administradoraId))?.nome || g?.nomeAdministradora || '';
      const aKey = canonAdmin(admName);
      const pKey = canonProduct(g?.produto);
      return !STRICT_MODE || (aKey && pKey);
    }).slice(0, 4);
  }, [data, selectedIds, administradorasMap]);

  return (
    <main className="container py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-brand-800">Comparar Selecionados</h1>
      {selected.length === 0 ? (
        <p className="text-gray-600">Você ainda não selecionou grupos compatíveis com o catálogo.</p>
      ) : (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
          {selected.map(g => {
            const admName = administradorasMap.get(String(g.administradoraId))?.nome || g?.nomeAdministradora || '';
            const aKey = canonAdmin(admName);
            const pKey = canonProduct(g?.produto);
            return (
              <div key={g.id} className="border rounded-2xl p-4">
                <div className="text-sm text-gray-500">Grupo #{g.numeroGrupo || g.id}</div>
                <div className="text-lg font-medium">{productLabel(pKey) || g?.produto}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Carta:</span> R$ {Number(g.valorCarta).toLocaleString('pt-BR')}</div>
                  <div><span className="text-gray-500">Parcela:</span> R$ {Number(g.valorParcela).toLocaleString('pt-BR')}</div>
                  <div><span className="text-gray-500">Prazo:</span> {g.prazo} meses</div>
                  <div><span className="text-gray-500">Taxa Adm:</span> {g.taxaAdm}%</div>
                  <div><span className="text-gray-500">Lance Médio:</span> {g.lanceMedio}%</div>
                  <div><span className="text-gray-500">Administradora:</span> {adminLabel(aKey) || admName}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
