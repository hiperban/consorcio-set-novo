'use client';

export default function GroupCard({ group, onCompareToggle }) {
  const contratarUrl =
    process.env.NEXT_PUBLIC_CONTRATAR_URL ||
    'https://loja.hiperban.com.br/SB59pZUm';

  const fmt = (v) =>
    v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Cores do selo conforme o tipo
  const tipo = String(group.tipoGrupo || '').toUpperCase();
  const badgeClass = tipo.includes('INTEGRAL')
    ? 'bg-emerald-600 text-white border-emerald-600' // verde sólido
    : tipo.includes('REDUZIDA')
      ? 'bg-rose-600 text-white border-rose-600'     // vermelho/rosa sólido
      : 'bg-gray-200 text-gray-800 border-gray-200'; // fallback neutro

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
    ['Assembleia (dia)', `${group.diaAssembleia}`],
  ];

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-800">
          Grupo {group.numeroGrupo}
        </h3>
        {/* ← AQUI é o selo (badge) com cor dinâmica */}
        <span className={`badge ${badgeClass}`}>{group.tipoGrupo}</span>
      </div>

      {/* layout interno dos campos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex min-w-0 leading-6">
            <span className="shrink-0 w-28 pr-2 text-gray-500">{label}:</span>
            <span className="flex-1 font-semibold min-w-0 whitespace-normal break-normal">
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            onChange={(e) => onCompareToggle(group, e.target.checked)}
          />{' '}
          Incluir no comparativo
        </label>
        <a
          href={contratarUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary"
        >
          Contratar
        </a>
      </div>
    </div>
  );
}
