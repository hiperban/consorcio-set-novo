'use client';

export const dynamic = 'force-dynamic'; // evita prerender/ISR nessa página

import { useEffect, useMemo, useState } from 'react';

function mergeDatasets(list) {
  const admMap = new Map();
  const grupos = [];
  for (const d of list || []) {
    const adms = Array.isArray(d?.administradoras) ? d.administradoras : [];
    const gs   = Array.isArray(d?.grupos) ? d.grupos : [];
    adms.forEach(a => { if (a?.id && !admMap.has(String(a.id))) admMap.set(String(a.id), a); });
    gs.forEach(g => grupos.push(g));
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

function fmtBRL(v){
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
}
function fmtNum(v){
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toLocaleString('pt-BR') : '—';
}

function Table({ selected }) {
  const rows = [
    ['Grupo', g => g?.numeroGrupo ?? '—'],
    ['Administradora', g => g?.nomeAdministradora ?? g?.administradoraId ?? '—'],
    ['Produto', g => g?.produto ?? '—'],
    ['Tipo de Grupo', g => g?.tipoGrupo ?? '—'],
    ['Valor Carta', g => fmtBRL(g?.valorCarta)],
    ['Parcela', g => fmtBRL(g?.valorParcela)],
    ['Taxa Adm', g => (g?.taxaAdm != null ? `${g.taxaAdm}%` : '—')],
    ['% Lance Médio', g => (g?.lanceMedio != null ? `${g.lanceMedio}%` : '—')],
    ['% Lance Embutido', g => (g?.lanceEmbutidoPermite != null ? `${g.lanceEmbutidoPermite}%` : '—')],
    ['Participantes', g => fmtNum(g?.totalParticipantes)],
    ['Prazo (meses)', g => fmtNum(g?.prazo)],
    ['Assembleia (dia)', g => fmtNum(g?.diaAssembleia)],
  ];

  return (
    <div className="card overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-3 w-48">Campo</th>
            {selected.map(g => (
              <th key={g.id} className="text-left p-3">
                {(g?.nomeAdministradora ?? g?.administradoraId ?? '—')} #{g?.numeroGrupo ?? '—'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, get]) => (
            <tr key={label} className="border-t">
              <td className="p-3 text-gray-600">{label}</td>
              {selected.map(g => (
                <td key={g.id + label} className="p-3 font-medium">{get(g)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ComparePage() {
  const [data, setData] = useState({ administradoras: [], grupos: [] });
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const man = await fetch('/data/_manifest.json', { cache: 'no-store' }).then(r => r.json());
        const files = Array.isArray(man?.datasets) ? man.datasets : [];
        const datasets = await Promise.all(
          files.map(f => fetch(`/data/${f}`, { cache: 'no-store' }).then(r => r.json()))
        );
        if (alive) setData(mergeDatasets(datasets));
      } catch {
        if (alive) setData({ administradoras: [], grupos: [] });
      }
    })();

    try {
      const raw = localStorage.getItem('compareSelection');
      if (raw) setSelectedIds(JSON.parse(raw));
    } catch {}

    return () => { alive = false; };
  }, []);

  const selected = useMemo(() => {
    const set = new Set(selectedIds);
    return (data.grupos || []).filter(g => set.has(g.id)).slice(0, 4);
  }, [data, selectedIds]);

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-800">Comparar Grupos</h1>
        <p className="text-sm text-gray-600">Tabela lado a lado com até 4 grupos.</p>
      </header>

      <Table selected={selected} />
    </main>
  );
}
