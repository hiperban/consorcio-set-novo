// components/GroupCard.jsx
'use client';
import { useMemo } from 'react';

function formatBRL(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function pct(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `${v}%`;
}
function N(v){
  return String(v ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .trim().toUpperCase();
}

export default function GroupCard({
  group,
  administradoraName,
  productLabel,
  inCompare = false,
  onToggleCompare,
}) {
  // Debug overlay via ?debug
  const debug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('debug');
  }, []);

  const prazoMeses   = Number(group?.prazo ?? 0) || 0;
  const taxaAdm      = group?.taxaAdm;
  const lanceMedio   = group?.lanceMedio;
  const embutido     = group?.embutido;        // pode ser 0
  const participantes = group?.participantes;  // pode ser 0
  const assembleiaDia = group?.assembleiaDia;  // pode ser 0

  const tipoNorm = N(group?.tipoGrupo);
  const tipoIsIntegral = tipoNorm === 'PARCELA INTEGRAL';
  const tipoIsReduzida = tipoNorm === 'PARCELA REDUZIDA';
  const tipoBadgeClass = tipoIsIntegral
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : tipoIsReduzida
      ? 'bg-rose-100 text-rose-700 border-rose-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  const tipoLabel = group?.tipoGrupo || '—';

  return (
    <article
      className="relative border rounded-2xl p-4 shadow-sm bg-white"
      // ====== DATA ATTRS PARA DEBUG / INSPEÇÃO ======
      data-group-id={group?.id ?? ''}
      data-admin-id={group?.administradoraId ?? ''}
      data-admin-name={administradoraName ?? ''}
      data-admin-key={group?.__aKey ?? ''}        // ex: RODOBENS
      data-product-raw={group?.produto ?? ''}     // ex: "PLACA SOLAR"
      data-product-label={productLabel ?? ''}     // ex: "Placa Solar"
      data-product-key={group?.__pKey ?? ''}      // ex: PLACA_SOLAR
      data-tipo={group?.tipoGrupo ?? ''}          // ex: PARCELA INTEGRAL
      data-carta={group?.valorCarta ?? ''}
      data-parcela={group?.valorParcela ?? ''}
      data-prazo={prazoMeses}
    >
      {/* Selo TIPO no canto superior direito */}
      <div className={`absolute top-3 right-3 px-3 py-1 text-xs font-medium border rounded-full ${tipoBadgeClass}`}>
        {tipoLabel}
      </div>

      {/* Selo de debug opcional */}
      {debug && (
        <div className="absolute top-3 left-3 text-[10px] px-2 py-1 rounded-full bg-slate-100 border">
          AK:{group?.__aKey || '—'} | PK:{group?.__pKey || '—'}
        </div>
      )}

      <h3 className="text-lg font-semibold mb-2">
        Grupo {group?.numeroGrupo || group?.id || '—'}
      </h3>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <div className="text-gray-500">Administradora:</div>
          <div className="font-medium">{(administradoraName || '').toUpperCase()}</div>
        </div>
        <div>
          <div className="text-gray-500">Produto:</div>
          <div className="font-medium">{(productLabel || group?.produto || '').toUpperCase()}</div>
        </div>

        <div>
          <div className="text-gray-500">Valor Carta:</div>
          <div className="font-medium">{formatBRL(group?.valorCarta)}</div>
        </div>
        <div>
          <div className="text-gray-500">Parcela:</div>
          <div className="font-medium">{formatBRL(group?.valorParcela)}</div>
        </div>

        <div>
          <div className="text-gray-500">Taxa Adm:</div>
          <div className="font-medium">{pct(taxaAdm)}</div>
        </div>
        <div>
          <div className="text-gray-500">% Lance Médio:</div>
          <div className="font-medium">{pct(lanceMedio)}</div>
        </div>

        <div>
          <div className="text-gray-500">Prazo:</div>
          <div className="font-medium">{prazoMeses ? `${prazoMeses} meses` : '—'}</div>
        </div>
        <div>
          <div className="text-gray-500">Tipo:</div>
          <div className="font-medium">{tipoLabel}</div>
        </div>

        {/* === Campos que tinham sumido: agora sempre mostram (com fallback) === */}
        <div>
          <div className="text-gray-500">% Lance Embutido:</div>
          <div className="font-medium">{embutido != null ? pct(embutido) : '—'}</div>
        </div>
        <div>
          <div className="text-gray-500">Participantes:</div>
          <div className="font-medium">{participantes != null ? participantes : '—'}</div>
        </div>
        <div>
          <div className="text-gray-500">Assembleia (dia):</div>
          <div className="font-medium">{assembleiaDia != null ? assembleiaDia : '—'}</div>
        </div>
        {/* ocupa a coluna faltante pra manter a grade alinhada */}
        <div />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inCompare}
            onChange={onToggleCompare}
            className="accent-orange-500"
          />
          Incluir no comparativo
        </label>
        <button
          className="rounded-xl px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 transition"
          onClick={(https://loja.hiperban.com.br/SB59pZUm) => alert('Fluxo de contratação aqui')}
          type="button"
        >
          Contratar
        </button>
      </div>
    </article>
  );
}
