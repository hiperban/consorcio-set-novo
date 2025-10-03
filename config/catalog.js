// config/catalog.js
/* Catálogo fixo de Administradoras e Produtos
   -> Edite aqui sempre que adicionar novos itens
*/
function N(v){
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

export const STRICT_MODE = true; 
// true = oculta grupos fora do catálogo; false = mostra tudo (filtros só casam com o catálogo)

export const ADMINS = [
  { key: 'RODOBENS', label: 'Rodobens', synonyms: ['RODOBENS'] },
  { key: 'TRADICAO', label: 'Tradição', synonyms: ['TRADICAO', 'TRADIÇÃO'] },
  { key: 'PORTO_SEGURO', label: 'Porto Seguro', synonyms: ['PORTO SEGURO', 'PORTO_SEGURO', 'PORTOSEGUR0', 'PORTO'] },
  // Exemplo de como adicionar:
  // { key: 'OUTRA', label: 'Outra Adm', synonyms: ['OUTRA', 'OUTRA ADM'] },
];

export const PRODUCTS = [
  { key: 'IMOVEL',        label: 'Imóvel',        synonyms: ['IMOVEL', 'IMÓVEL'] },
  { key: 'PLACA_SOLAR',   label: 'Placa Solar',   synonyms: ['PLACA SOLAR'] },
  { key: 'EQUIPAMENTOS',  label: 'Equipamentos',  synonyms: ['EQUIPAMENTOS'] },
  { key: 'CIRURGIA',      label: 'Cirurgia',      synonyms: ['CIRURGIA'] },
  { key: 'SERVICOS',      label: 'Serviços',      synonyms: ['SERVICOS', 'SERVIÇOS'] },
  { key: 'REFORMAS',      label: 'Reformas',      synonyms: ['REFORMAS'] },
  { key: 'VEICULO',       label: 'VEICULO',       synonyms: ['VEICULO'] },
  { key: 'VIAGENS',       label: 'Viagens',       synonyms: ['VIAGENS'] },
  // Exemplo de novo produto:
  // { key: 'AUTO', label: 'Auto', synonyms: ['AUTO', 'AUTOMOVEL', 'AUTOMÓVEL'] },
];

const ADMIN_KEY_BY_NORM = new Map();
const ADMIN_LABEL_BY_KEY = new Map();
for (const a of ADMINS) {
  ADMIN_LABEL_BY_KEY.set(a.key, a.label);
  for (const s of a.synonyms || []) ADMIN_KEY_BY_NORM.set(N(s), a.key);
  ADMIN_KEY_BY_NORM.set(N(a.label), a.key);
  ADMIN_KEY_BY_NORM.set(N(a.key), a.key);
}

const PRODUCT_KEY_BY_NORM = new Map();
const PRODUCT_LABEL_BY_KEY = new Map();
for (const p of PRODUCTS) {
  PRODUCT_LABEL_BY_KEY.set(p.key, p.label);
  for (const s of p.synonyms || []) PRODUCT_KEY_BY_NORM.set(N(s), p.key);
  PRODUCT_KEY_BY_NORM.set(N(p.label), p.key);
  PRODUCT_KEY_BY_NORM.set(N(p.key), p.key);
}

export function canonAdmin(nameOrLabel){
  const key = ADMIN_KEY_BY_NORM.get(N(nameOrLabel));
  return key || null;
}
export function canonProduct(label){
  const key = PRODUCT_KEY_BY_NORM.get(N(label));
  return key || null;
}
export function adminLabel(key){ return ADMIN_LABEL_BY_KEY.get(key) || key; }
export function productLabel(key){ return PRODUCT_LABEL_BY_KEY.get(key) || key; }
