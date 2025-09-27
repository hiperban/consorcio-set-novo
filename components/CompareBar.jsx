'use client';
import Link from 'next/link';
export default function CompareBar({ selected }){
  if (!selected?.length) return null;
  return (
    <div className="fixed bottom-4 left-0 right-0 z-50">
      <div className="container">
        <div className="card flex-row items-center justify-between">
          <span className="text-sm">Selecionados para comparar: <b>{selected.length}</b></span>
          <Link href={{ pathname:'/compare', query: { ids: selected.map(s=>s.id).join(',') } }} className="btn-primary">Ir para Comparar</Link>
        </div>
      </div>
    </div>
  );
}
