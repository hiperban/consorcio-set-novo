'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import AdminForm from '@/components/AdminForm';

/** Junta vários datasets do /public/data */
function mergeDatasets(list) {
  const admMap = new Map();
  const grupos = [];
  for (const d of list) {
    (d?.administradoras || []).forEach(a => { if (!admMap.has(a.id)) admMap.set(a.id, a); });
    (d?.grupos || []).forEach(g => grupos.push(g));
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

export default function AdminPage() {
  const [data, setData] = useState({ administradoras: [], grupos: [] });
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    // chave via query ?key=... comparada com NEXT_PUBLIC_ADMIN_KEY
    try {
      const params = new URLSearchParams(window.location.search);
      const k = params.get('key');
      const expected = process.env.NEXT_PUBLIC_ADMIN_KEY;
      setAuth(Boolean(expected) && k === expected);
    } catch {
      setAuth(false);
    }
  }, []);

  useEffect(() => {
    async function loadAll() {
      try {
        const man = await fetch('/data/_manifest.json', { cache: 'no-store' }).then(r => r.json());
        const files = Array.isArray(man.datasets) ? man.datasets : [];
        const datasets = await Promise.all(
          files.map(f => fetch(`/data/${f}`, { cache: 'no-store' }).then(r => r.json()))
        );
        setData(mergeDatasets(datasets));
      } catch {
        setData({ administradoras: [], grupos: [] });
      }
    }
    loadAll();
  }, []);

  if (!auth) {
    return (
      <main className="container py-6">
        <div className="card">
          <h1 className="text-lg font-semibold">Acesso restrito</h1>
          <p className="text-sm text-gray-600">
            Abra com <code>/admin?key=SUA_CHAVE</code>. Defina a chave em <b>NEXT_PUBLIC_ADMIN_KEY</b> nas variáveis do Vercel.
          </p>
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
