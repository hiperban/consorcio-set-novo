'use client';
import { useEffect, useMemo, useState } from 'react';

/* Normalização compatível */
function normalize(v){
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

/* Helpers de máscara BRL */
function maskBRL(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function parseBRLToNumber(masked) {
  const digits = String(masked || '').replace(/\D/g, '');
  if (!digits) return undefined;
  return parseInt(digits, 10) / 100;
}

export default function Filters({ data, onFilterChange }){
  // Inputs de valor com máscara
  const [minCartaMasked, setMinCartaMasked] = useState('');
  const [maxCartaMasked, setMaxCartaMasked] = useState('');

  // Estados dos selects armazenam o **valor normalizado**
  const [adm, setAdm] = useState('');
  const [lanceMin, setLanceMin] = useState('');
  const [produto, setProduto] = useState('');
  const [tipoGrupo, setTipoGrupo] = useState('');
  const [prazo, setPrazo] = useState('');

  /* Opções: value = normalizado, label = original */
  const administradoras = useMemo(() => {
    const map = new Map();
    (data?.administradoras || []).forEach(a => {
      const label = a?.nome ?? '';
      const value = normalize(label);
      if (value && !map.has(value)) map.set(value, { label, value });
    });
    return Array.from(map.values()).sort((x,y)=>x.label.localeCompare(y.label,'pt-BR'));
  }, [data]);

  const produtos = useMemo(() => {
    const map = new Map();
    (data?.grupos || []).forEach(g => {
      const label = String(g?.produto ?? '').trim();
      const value = normalize(label);
      if (value && !map.has(value)) map.set(value, { label, value });
    });
    return Array.from(map.values()).sort((x,y)=>x.label.localeCompare(y.label,'pt-BR'));
  }, [data]);

  useEffect(()=>{
    const min   = parseBRLToNumber(minCartaMasked);
    const max   = parseBRLToNumber(maxCartaMasked);
    const lance = lanceMin === '' ? undefined : parseFloat(lanceMin);
    const prazoNum = prazo === '' ? undefined : parseInt(prazo, 10);

    onFilterChange({
      minCarta: Number.isNaN(min) ? undefined : min,
      maxCarta: Number.isNaN(max) ? undefined : max,
      adm: adm || '',                 // já normalizado
      produto: produto || '',         // já normalizado
      tipoGrupo: tipoGrupo || '',     // já normalizado
      lanceMin: Number.isNaN(lance) ? undefined : lance,
      prazo: Number.isNaN(prazoNum) ? undefined : prazoNum
    });
  }, [minCartaMasked, maxCartaMasked, adm, lanceMin, produto, tipoGrupo, prazo, onFilterChange]);

  const onAdmChange = (value) => { setAdm(value); setProduto(''); setTipoGrupo(''); };

  return (
    <div className="card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Valor Carta Mín (R$)</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="R$ 0,00"
          value={minCartaMasked}
          onChange={(e)=> setMinCartaMasked(maskBRL(e.target.value))}
          className="w-full border rounded-2xl px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Valor Carta Máx (R$)</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="R$ 0,00"
          value={maxCartaMasked}
          onChange={(e)=> setMaxCartaMasked(maskBRL(e.target.value))}
          className="w-full border rounded-2xl px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Administradora</label>
        <select value={adm} onChange={e=>onAdmChange(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todas</option>
          {administradoras.map((opt)=>(<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">% Lance Mínimo</label>
        <input
          value={lanceMin}
          onChange={e=>setLanceMin(e.target.value)}
          inputMode="numeric"
          placeholder="ex.: 20"
          className="w-full border rounded-2xl px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Produto</label>
        <select value={produto} onChange={e=>setProduto(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todos</option>
          {produtos.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Tipo de Grupo</label>
        <select
          value={tipoGrupo}
          onChange={e=>setTipoGrupo(e.target.value)}
          className="w-full border rounded-2xl px-3 py-2"
        >
          <option value="">Todos</option>
          <option value={normalize('PARCELA REDUZIDA')}>PARCELA REDUZIDA</option>
          <option value={normalize('PARCELA INTEGRAL')}>PARCELA INTEGRAL</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Prazo (meses)</label>
        <input
          value={prazo}
          onChange={e=>setPrazo(e.target.value)}
          inputMode="numeric"
          className="w-full border rounded-2xl px-3 py-2"
        />
      </div>
    </div>
  );
}
