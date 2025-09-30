// components/GroupCard.jsx
'use client';
import { useMemo, useState } from 'react';

function formatBRL(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function GroupCard({
  group,
  administradoraName,
  productLabel,
  inCompare = false,
  onToggleCompare,
}) {
  // Habilita selos de debug com ?debug na URL (opcional)
  const debug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('debug');
  }, []);

  const prazoMeses = group?.prazo ?? '';
  const taxaAdm = group?.taxaAdm ?? 0;
  const lanceMedio = group?.lanceMedio ?? 0;

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
      {/* Selo de debug opcional */}
      {debug && (
        <div className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full bg-slate-100 border">
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
          <div className="font-medium">{taxaAdm}%</div>
        </div>
        <div>
          <div className="text-gray-500">% Lance Médio:</div>
          <div className="font-medium">{lanceMedio}%</div>
        </div>

        <div>
          <div className="text-gray-500">Prazo:</div>
          <div className="font-medium">{prazoMeses} meses</div>
        </div>
        <div>
          <div className="text-gray-500">Tipo:</div>
          <div className="font-medium">{group?.tipoGrupo || '—'}</div>
        </div>

        {group?.embutido != null && (
          <div>
            <div className="text-gray-500">% Lance Embutido:</div>
            <div className="font-medium">{group.embutido}%</div>
          </div>
        )}
        {group?.assembleiaDia != null && (
          <div>
            <div className="text-gray-500">Assembleia (dia):</div>
            <div className="font-medium">{group.assembleiaDia}</div>
          </div>
        )}
        {group?.participantes != null && (
          <div>
            <div className="text-gray-500">Participantes:</div>
            <div className="font-medium">{group.participantes}</div>
          </div>
        )}
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
          onClick={() => alert('Fluxo de contratação aqui')}
          type="button"
        >
          Contratar
        </button>
      </div>
    </article>
  );
}
