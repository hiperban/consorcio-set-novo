'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminForm from '@/components/AdminForm';

export const dynamic = 'force-dynamic';

function AdminInner(){
  const [allowed, setAllowed] = useState(false);
  const [data, setData] = useState(null);
  const params = useSearchParams();
  const keyFromUrl = params.get('key');
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY;

  useEffect(()=>{
    if (!adminKey) setAllowed(!!keyFromUrl);
    else setAllowed(keyFromUrl === adminKey);
  }, [keyFromUrl, adminKey]);

  useEffect(()=>{
    fetch('/data/groups.json').then(r=>r.json()).then(setData);
  },[]);

  if (!allowed) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold mb-2 text-brand-800">Acesso restrito</h2>
        <p className="text-sm text-gray-600">Inclua <code>?key=SUA_CHAVE</code> na URL para acessar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card">
        <h2 className="text-lg font-semibold mb-1 text-brand-800">Administração</h2>
        <p className="text-sm text-gray-600">Gerencie administradoras e grupos. Exporte o JSON e publique no repositório.</p>
      </div>
      <AdminForm initialData={data}/>
    </div>
  );
}

export default function AdminPage(){
  return (
    <Suspense fallback={<div className="card">Carregando admin...</div>}>
      <AdminInner/>
    </Suspense>
  );
}
