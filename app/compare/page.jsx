// DENTRO de page.jsx do /compare, substitua o Table por este mais robusto (opcional)
function fmtBRL(v){ const n = Number(v ?? 0); return isFinite(n) ? n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—'; }
function fmtNum(v){ const n = Number(v ?? 0); return isFinite(n) ? n.toLocaleString('pt-BR') : '—'; }

function Table({ selected }) {
  const rows = [
    ['Grupo', g => g.numeroGrupo ?? '—'],
    ['Administradora', g => g.nomeAdministradora ?? g.administradoraId ?? '—'],
    ['Produto', g => g.produto ?? '—'],
    ['Tipo de Grupo', g => g.tipoGrupo ?? '—'],
    ['Valor Carta', g => fmtBRL(g.valorCarta)],
    ['Parcela', g => fmtBRL(g.valorParcela)],
    ['Taxa Adm', g => g.taxaAdm != null ? `${g.taxaAdm}%` : '—'],
    ['% Lance Médio', g => g.lanceMedio != null ? `${g.lanceMedio}%` : '—'],
    ['% Lance Embutido', g => g.lanceEmbutidoPermite != null ? `${g.lanceEmbutidoPermite}%` : '—'],
    ['Participantes', g => fmtNum(g.totalParticipantes)],
    ['Prazo (meses)', g => fmtNum(g.prazo)],
    ['Assembleia (dia)', g => fmtNum(g.diaAssembleia)],
  ];
  return (
    <div className="card overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-3 w-48">Campo</th>
            {selected.map(g => (
              <th key={g.id} className="text-left p-3">
                {(g.nomeAdministradora ?? g.administradoraId ?? '—')} #{g.numeroGrupo ?? '—'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label,get])=>(
            <tr key={label} className="border-t">
              <td className="p-3 text-gray-600">{label}</td>
              {selected.map(g=>(
                <td key={g.id+label} className="p-3 font-medium">{get(g)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
