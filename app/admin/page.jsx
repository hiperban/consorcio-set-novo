'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import AdminForm from '@/components/AdminForm';

/* ----- Helpers ----- */
function N(v) {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/* Junta datasets */
function mergeDatasets(list) {
  const admMap = new Map();
  const grupos = [];
  for (const d of list || []) {
    const adms = Array.isArray(d?.administradoras) ? d.administradoras : [];
    const gs   = Array.isArray(d?.grupos) ? d.grupos : [];
    adms.forEach(a => { if (a?.id && !admMap.has(a.id)) admMap.set(a.id, a); });
    gs.forEach(g => grupos.push(g));
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

export default function AdminPage() {
  const [data, setData] = useState({ administradoras: [], grupos: [] });
  const [auth, setAuth] = useState(false);
  const [envKeyMissing, setEnvKeyMissing] = useState(false);

  // ---------- AUTH ROBUSTO ----------
  useEffect(() => {
    const expectedRaw = process.env.NEXT_PUBLIC_ADMIN_KEY;
    const expected = (expectedRaw ?? '').trim();
    if (!expected) {
      setEnvKeyMissing(true);
      setAuth(false);
      return;
    }
    setEnvKeyMissing(false);

    try {
      const url = new URL(window.location.href);
      const qKeyRaw = url.searchParams.get('key');
      const qKey = qKeyRaw ? decodeURIComponent(qKeyRaw).trim() : '';

      // Se veio key via URL e bate, gravo e tiro da URL
      if (qKey && qKey === expected) {
        localStorage.setItem('admin_auth_key', expected);
        // Remove ?key= da URL sem recarregar
        url.searchParams.delete('key');
        window.history.replaceState({}, '', url.toString());
        setAuth(true);
        return;
      }

      // Se não veio key agora, checo localStorage
      const saved = (localStorage.getItem('admin_auth_key') || '').trim();
      setAuth(saved === expected);
    } catch (e) {
      setAuth(false);
    }
  }, []);

  // ---------- CARREGA DADOS ----------
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

    // Log gentil de problemas, mas sem quebrar a UI
    results
      .filter(r => r.status === 'rejected')
      .forEach(r => console.warn('[Dataset ignorado]', r.reason));

    setData(mergeDatasets(ok));
  } catch (e) {
    console.error('Erro ao carregar datasets:', e);
    setData({ administradoras: [], grupos: [] });
  }
  }, []);

  // ---------- UI ----------
  if (envKeyMissing) {
    return (
      <main className="container py-6">
        <div className="card space-y-2">
          <h1 className="text-lg font-semibold">Acesso restrito</h1>
          <p className="text-sm text-gray-700">
            Defina a variável <code>NEXT_PUBLIC_ADMIN_KEY</code> no Vercel (Project → Settings → Environment Variables),
            redeploy e acesse <code>/admin?key=SUA_CHAVE</code>.
          </p>
        </div>
      </main>
    );
  }

  if (!auth) {
    return (
      <main className="container py-6">
        <div className="card space-y-4">
          <h1 className="text-lg font-semibold">Autenticação necessária</h1>
          <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
            <li>Confirme a sua chave em <b>Vercel → Project → Settings → Environment Variables</b> como <code>NEXT_PUBLIC_ADMIN_KEY</code>.</li>
            <li>Acesse: <code>/admin?key=SUA_CHAVE</code>. Ex.: <code>/admin?key=abc123</code></li>
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
