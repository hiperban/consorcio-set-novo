'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminForm from '@/components/AdminForm';
import { PRODUCTS } from '@/config/catalog';

/* Junta datasets com sanitização (mesmo que você tinha) */
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
        embutido: g?.embutido != null ? Number(g.embutido) : null,
        participantes: g?.participantes != null ? Number(g.participantes) : null,
        assembleiaDia: g?.assembleiaDia != null ? Number(g.assembleiaDia) : null,
        prazo: Number(g?.prazo ?? 0),
        numeroGrupo: g?.numeroGrupo,
      });
    });
  }

  return { administradoras: Array.from(admMap.values()), grupos };
}

function LoginBox() {
  const router = useRouter();
  const sp = useSearchParams();
  const [val, setVal] = useState(sp.get('key') || '');

  function enter() {
    const k = (val || '').trim();
    router.replace(`/admin?key=${encodeURIComponent(k)}`);
  }

  return (
    <div className="max-w-md bg-white p-6 rounded-2xl border shadow-sm">
      <h2 className="text-lg font-semibold mb-1">Acesso Admin</h2>
      <p className="text-sm text-gray-600 mb-4">Digite a senha configurada no Vercel.</p>

      <input
        className="w-full border rounded-xl px-4 py-3 outline-none"
        placeholder="Senha"
        value={val}
        onChange={(e)=>setVal(e.target.value)}
        onKeyDown={(e)=>{ if (e.key === 'Enter') enter(); }}
      />

      <button
        className="mt-3 w-full rounded-xl bg-orange-600 text-white py-3 font-semibold"
        onClick={enter}
      >
        Entrar
      </button>
    </div>
  );
}

export default function AdminClient({ isAuthed }) {
  const [data, setData] = useState({ administradoras: [], grupos: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthed) return;

    async function loadAll() {
      try {
        setError('');
        const man = await fetch('/data/_manifest.json', { cache: 'no-store' }).then(r => r.json());
        const files = Array.isArray(man?.datasets) ? man.datasets : [];

        const results = await Promise.allSettled(
          files.map(async (f) => {
            try {
              const r = await fetch(`/data/${f}`, { cache: 'no-store' });
              if (!r.ok) throw new Error(`HTTP ${r.status} ao baixar ${f}`);
              const j = await r.json();
              return { file: f, data: j };
            } catch (e) {
              throw new Error(`[${f}] ${e.message}`);
            }
          })
        );

        const ok = results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value.data);

        const rejected = results.filter(r => r.status === 'rejected');
        if (rejected.length) {
          const lista = rejected
            .map(r => r.reason?.message || String(r.reason))
            .join(' | ');
          setError(`Alguns arquivos foram ignorados: ${rejected.length}. ${lista}`);
          console.warn('[Datasets ignorados]', lista);
        }

        setData(mergeDatasets(ok));
      } catch (e) {
        console.error(e);
        setError('Não foi possível carregar os dados.');
        setData({ administradoras: [], grupos: [] });
      }
    }

    loadAll();
  }, [isAuthed]);

  if (!isAuthed) {
    return (
      <main className="container py-10">
        <LoginBox />
      </main>
    );
  }

  // Produtos do catálogo (em CAIXA ALTA para o form)
  const produtosCatalogo = PRODUCTS.map(p => p.label.toUpperCase());

  return (
    <main className="container py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-brand-800">Admin</h1>

      {error ? (
        <div className="p-4 border rounded-2xl bg-yellow-50 text-yellow-800">
          <p className="font-medium mb-1">Aviso</p>
          <p className="text-sm whitespace-pre-wrap">{error}</p>
        </div>
      ) : null}

      <AdminForm initialData={data} produtosCatalogo={produtosCatalogo} />
    </main>
  );
}
