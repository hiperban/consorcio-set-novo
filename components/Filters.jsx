'use client';
import { useEffect, useMemo, useState } from 'react';

/* Normalização compatível */
function N(v){
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

/* Canonização de Produto */
function productKey(v) {
  const t = N(v);
  if (['AUTOMOVEL','VEICULO','VEICULOS','CARRO','CARROS','VEICULAR'].includes(t)) return 'AUTOMOVEL';
  if (['SERVICO','SERVICOS','SERVIÇO','SERVIÇOS','SERV'].includes(t)) return 'SERVICOS';
  if (['MOTO','MOTOCICLETA','MOTOS'].includes(t)) return 'MOTO';
  if (['IMOVEL','IMOVEIS','IMÓVEL','IMÓVEIS','IMOBILIARIO','IMOBILIÁRIO'].includes(t)) return 'IMOVEL';
  if (['CAMINHAO','CAMINHAOES','CAMINHÃO','CAMINHÕES','PESADOS','CAMINHAO/PESADOS'].includes(t)) return 'CAMINHAO';
  return 'OUTROS BENS';
}
const PRODUCT_LABEL = {
  AUTOMOVEL: 'Automóvel',
  SERVICOS: 'Serviços',
  MOTO: 'Moto',
  IMOVEL: 'Imóvel',
  CAMINHAO: 'Caminhão',
  'OUTROS BENS': 'Outros Bens',
};

/* Máscara BRL */
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
  const [minCartaMasked, setMinCartaMasked] = useState('');
  const [maxCartaMasked, setMaxCartaMasked] = useState('');

  // Agora guardamos a ADMIN pelo "nome canônico" (não por ID)
  const [admKey, setAdmKey] = useState('');
  const [lanceMin, setLanceMin] = useState('');
  const [produto, setProduto] = useState('');     // chave canônica
  const [tipoGrupo, setTipoGrupo] = useState(''); // normalizado
  const [prazo, setPrazo] = useState('');

  /* Opções de Administradora por NOME (canônico) */
  const administradoras = useMemo(() => {
    // Pega nomes tanto de data.administradoras quanto dos grupos (nomeAdministradora)
    const map = new Map();
    (data?.administradoras || []).forEach(a => {
      const label = a?.nome ?? '';
      const key = N(label);
      if (key && !map.has(key)) map.set(key, label);
    });
    (data?.grupos || []).forEach(g => {
      const label = g?.nomeAdministradora ?? '';
      const key = N(label);
      if (key && !map.has(key)) map.set(key, label);
    });
    // transforma em array [{key,label}] e ordena por label
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((x,y)=> String(x.label).localeCompare(String(y.label), 'pt-BR'));
  }, [data]);

  /* Opções de Produto (canonizadas) */
  const produtos = useMemo(() => {
    const set = new Set();
    (data?.grupos || []).forEach(g => set.add(productKey(g?.produto)));
    return Array.from(set)
      .map(k => ({ value: k, label: PRODUCT_LABEL[k] ?? k }))
      .sort((a,b)=> a.label.localeCompare(b.label, 'pt-BR'));
  }, [data]);

  useEffect(()=>{
    const min   = parseBRLToNumber(minCartaMasked);
    const max   = parseBRLToNumber(maxCartaMasked);
    const lance = lanceMin === '' ? undefined : parseFloat(lanceMin);
    const prazoNum = prazo === '' ? undefined : parseInt(prazo, 10);

    onFilterChange({
      minCarta: Number.isNaN(min) ? undefined : min,
      maxCarta: Number.isNaN(max) ? undefined : max,
      admKey: admKey || '',                 // ← nome canônico da administradora
      produto: produto || '',               // chave canônica
      tipoGrupo: N(tipoGrupo || ''),        // normalizado
      lanceMin: Number.isNaN(lance) ? undefined : lance,
      prazo: Number.isNaN(prazoNum) ? undefined : prazoNum
    });
  }, [minCartaMasked, maxCartaMasked, admKey, lanceMin, produto, tipoGrupo, prazo, onFilterChange]);

  const onAdmChange = (value) => { setAdmKey(value); setProduto(''); setTipoGrupo(''); };

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
        <select value={admKey} onChange={e=>onAdmChange(e.target.value)} className="w-full border rounded-2xl px-3 py-2">
          <option value="">Todas</option>
          {administradoras.map(opt => (<option key={opt.key} value={opt.key}>{opt.label}</option>))}
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
          <option value={N('PARCELA REDUZIDA')}>PARCELA REDUZIDA</option>
          <option value={N('PARCELA INTEGRAL')}>PARCELA INTEGRAL</option>
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
