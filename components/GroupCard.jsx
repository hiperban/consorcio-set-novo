'use client';

export default function GroupCard({ group, onCompareToggle }) {
  const g = group || {};
  const fmtBRL = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—';
    };
  const line = (label, value) => (
    <div className="flex justify-between gap-2">
      <span className="text-xs text-gray-600">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-brand-800">
          {g.nomeAdministradora || g.__adminKey || '—'}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
          {g.tipoGrupo || (g.__tipoKey?.replaceAll('_',' ') ?? '')}
        </span>
      </div>

      <div className="text-sm text-gray-700">
        {line('Grupo', g.numeroGrupo ?? '—')}
        {line('Produto', g.produto ?? g.__productKey?.replaceAll('_',' ') ?? '—')}
        {line('Valor Carta', fmtBRL(g.__valorCarta ?? g.valorCarta))}
        {line('Parcela', fmtBRL(g.__valorParcela ?? g.valorParcela))}
        {line('Taxa Adm', g.taxaAdm != null ? `${g.taxaAdm}%` : '—')}
        {line('% Lance Médio', g.lanceMedio != null ? `${g.lanceMedio}%` : '—')}
        {line('% Lance Embutido', g.lanceEmbutidoPermite != null ? `${g.lanceEmbutidoPermite}%` : '—')}
        {line('Participantes', g.totalParticipantes ?? '—')}
        {line('Prazo (meses)', g.__prazo ?? g.prazo ?? '—')}
        {line('Assembleia (dia)', g.diaAssembleia ?? '—')}
      </div>

      <div className="flex items-center justify-between pt-2">
        <a
          href="https://loja.hiperban.com.br/SB59pZUm"
          target="_blank" rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Contratar
        </a>
        <label className="text-xs flex items-center gap-2">
          <input type="checkbox" onChange={(e)=>onCompareToggle?.(g, e.target.checked)} />
          Comparar
        </label>
      </div>
    </div>
  );
}
