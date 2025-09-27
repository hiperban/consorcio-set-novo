'use client';

export default function GroupCard({ group, onCompareToggle }) {
  const contratarUrl =
    process.env.NEXT_PUBLIC_CONTRATAR_URL ||
    'https://loja.hiperban.com.br/SB59pZUm';

  const fmt = (v) =>
    v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // 3º item indica se o valor deve ficar SEM quebra (preços, prazos curtos etc.)
  const rows = [
    ['Administradora', group.nomeAdministradora, false],
    ['Produto', group.produto, false],
    ['Valor Carta', fmt(group.valorCarta), true],
    ['Parcela', fmt(group.valorParcela), true],
    ['Taxa Adm', `${group.taxaAdm}%`, true],
    ['Prazo', `${group.prazo} meses`, true],
    ['% Lance Médio', `${group.lanceMedio}%`, true],
    ['% Lance Embutido', `${group.lanceEmbutidoPermite}%`, true],
    ['Participantes', `${group.totalParticipantes}`, true],
    ['Assembleia (dia)', `${group.diaAssembleia}`, true],
  ];

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-800">
          Grupo {group.numeroGrupo}
        </h3>
        <span className="badge">{group.tipoGrupo}</span>
      </div>

      {/* 1 coluna até telas grandes; só vira 2 colunas em xl pra não espremer texto */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-10 gap-y-2 text-sm">
        {rows.map(([label, value, nowrap]) => (
          <div key={label} className="flex min-w-0 leading-6">
            {/* rótulo com largura confortável */}
            <span className="shrink-0 w-40 text-gray-500">{label}:</span>
            {/* valores: não quebrar palavras no meio; preços/prazos ficam em uma linha */}
            <span
              className={[
                'font-semibold min-w-0',
                nowrap ? 'whitespace-nowrap overflow-hidden text-ellipsis' : 'whitespace-normal break-normal',
              ].join(' ')}
              title={String(value)}
            >
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
