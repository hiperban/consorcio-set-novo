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
  const tipo = String(group.tipoGrupo || '').toUpperCase();
const badgeClass =
  tipo.includes('REDUZIDA')
    ? 'bg-sky-100 text-sky-700 border-sky-200'
    : tipo.includes('INTEGRAL')
      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      : 'bg-gray-100 text-gray-700 border border-gray-200';
  const tipo = String(group.tipoGrupo || '').toUpperCase();

const badgeClass = tipo.includes('INTEGRAL')
  ? 'bg-emerald-600 text-white border-emerald-600'  // verde sólido
  : tipo.includes('REDUZIDA')
    ? 'bg-rose-600 text-white border-rose-600'      // (opcional) vermelho/rosa sólido
    : 'bg-gray-200 text-gray-800 border-gray-200';  // fallback


  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-800">
          Grupo {group.numeroGrupo}
        </h3>
<span className={`badge ${badgeClass}`}>
  {group.tipoGrupo}
</span>
      </div>

      {/* 1 coluna até telas grandes; só vira 2 colunas em xl pra não espremer texto */}
     <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
  {rows.map(([label, value]) => (
    <div key={label} className="flex min-w-0 leading-6">
      {/* rótulo menor e mais próximo */}
      <span className="shrink-0 w-28 pr-2 text-gray-500">{label}:</span>
      {/* valor ocupa o restante; sem quebrar palavras no meio */}
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
