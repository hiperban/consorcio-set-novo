'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

const fmt = v => v?.toLocaleString('pt-BR', { style:'currency', currency:'BRL'});

function CompareInner(){
  const [data, setData] = useState(null);
  const params = useSearchParams();
  const ids = useMemo(()=> (params.get('ids')||'').split(',').filter(Boolean), [params]);

  useEffect(()=>{
    fetch('/data/groups.json').then(r=>r.json()).then(setData);
  },[]);

  const list = useMemo(()=>{
    if (!data) return [];
    return (data.grupos||[]).filter(g => ids.includes(g.id));
  }, [data, ids]);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-3 text-brand-800">Comparativo</h2>
      {list.length === 0 ? <p className="text-sm text-gray-600">Nenhum grupo selecionado.</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left bg-brand-50">
                <th className="p-2">Campo</th>
                {list.map(g => (<th key={g.id} className="p-2">Grupo {g.numeroGrupo} — {g.nomeAdministradora}</th>))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Produto', 'produto'],
                ['Tipo de Grupo', 'tipoGrupo'],
                ['Valor da Carta', 'valorCarta', fmt],
                ['Valor da Parcela', 'valorParcela', fmt],
                ['Taxa Adm (%)', 'taxaAdm'],
                ['Prazo (meses)', 'prazo'],
                ['% Lance Médio', 'lanceMedio'],
                ['% Lance Embutido', 'lanceEmbutidoPermite'],
                ['Participantes', 'totalParticipantes'],
                ['Dia da Assembleia', 'diaAssembleia'],
              ].map(([label, key, format])=> (
                <tr key={key} className="border-t">
                  <td className="p-2 font-medium">{label}</td>
                  {list.map(g => (<td key={g.id+key} className="p-2">{format?format(g[key]):g[key]}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ComparePage(){
  return (
    <Suspense fallback={<div className="card">Carregando comparativo...</div>}>
      <CompareInner/>
    </Suspense>
  );
}
