// app/admin-login/page.jsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/admin';

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    if (res.ok) {
      router.replace(next);
    } else {
      const t = await res.text();
      setErr(t || 'Chave inválida');
    }
  }

  return (
    <main className="container py-10 max-w-md">
      <h1 className="text-2xl font-semibold mb-6">Acesso Administrativo</h1>
      <form onSubmit={onSubmit} className="space-y-4 border rounded-2xl p-6 bg-white">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Chave de acesso</label>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Digite sua chave"
            required
            autoFocus
          />
        </div>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button
          type="submit"
          className="rounded-xl px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 transition"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
