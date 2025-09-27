'use client';
export default function GroupCard({ group, onCompareToggle }){
  const contratarUrl = process.env.NEXT_PUBLIC_CONTRATAR_URL || 'https://loja.hiperban.com.br/SB59pZUm';
  const fmt = v => v?.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  const rows = [
    ['Administradora', group.nomeAdministradora],
    ['Produto', group.produto],
    ['Valor Carta', fmt(group.valorCarta)],
    ['Parcela', fmt(group.valorParcela)],
    ['Taxa Adm', `${group.taxaAdm}%`],
    ['Prazo', `${group.prazo} meses`],
    ['% Lance Médio', `${group.lanceMedio}%`],
    ['% Lance Embutido', `${group.lanceEmbutidoPermite}%`],
    ['Participantes', `${group.totalParticipantes}`],
    ['Assembleia', `${group.diaAssembleia}`]
  ];

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-800">Grupo {group.numeroGrupo}</h3>
        <span className="badge">{group.tipoGrupo}</span>
      </div>

      {/* Grade responsiva: 1 coluna no mobile, 2 colunas no md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex">
            <span className="shrink-0 w-36 text-gray-500">{label}:</span>
            <span className="font-semibold break-words whitespace-normal">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" onChange={(e)=>onCompareToggle(group, e.target.checked)} /> Incluir no comparativo
        </label>
        <a href={contratarUrl} target="_blank" rel="noreferrer" className="btn-primary">Contratar</a>
      </div>
    </div>
  );
}
