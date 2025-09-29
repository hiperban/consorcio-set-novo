'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import AdminForm from '@/components/AdminForm';

/* Helpers */
function N(v) {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/* Junta datasets com sanitização */
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

export default function AdminPage() {
  const [data, setData] = useState({ administradoras: [], grupos: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAll() {
      try {
        setError('');
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

        const rejected = results.filter(r => r.status === 'rejected');
        if (rejected.length) {
          setError(`Alguns arquivos foram ignorados: ${rejected.length}. Veja o console para detalhes.`);
          rejected.forEach(r => console.warn('[Dataset ignorado]', r.reason));
        }

        setData(mergeDatasets(ok));
      } catch (e) {
        console.error(e);
        setError('Não foi possível carregar os dados.');
        setData({ administradoras: [], grupos: [] });
      }
    }
    loadAll();
  }, []);

  if (error) {
    return (
      <main className="container py-6 space-y-6">
        <h1 className="text-2xl font-semibold text-brand-800">Admin</h1>
        <div className="p-4 border rounded-2xl bg-yellow-50 text-yellow-800">
          <p className="font-medium mb-1">Aviso</p>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-2">
            Dica: valide a estrutura do JSON novo (administradoras[], grupos[]) e campos obrigatórios.
          </p>
          <ol className="list-decimal ml-4 text-sm mt-2 space-y-1">
            <li>Inclua <code>administradoras</code> com <code>id</code> e <code>nome</code>.</li>
            <li>Nos <code>grupos</code>, garanta: <code>id</code>, <code>administradoraId</code>, <code>produto</code>, <code>valorCarta</code>, <code>valorParcela</code>, <code>prazo</code>.</li>
            <li>Atualize <code>_manifest.json</code> adicionando o arquivo em <code>datasets</code>.</li>
            <li>Evite espaços ou caracteres especiais na chave. Use letras/números simples.</li>
          </ol>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-brand-800">Admin</h1>
      <AdminForm initialData={data} />
    </main>
  );
}
