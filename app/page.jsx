'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Filters from '@/components/Filters';
import GroupCard from '@/components/GroupCard';

/* Normalização compatível */
function N(v) {
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

/* Junta datasets */
function mergeDatasets(list) {
  const admMap = new Map(); // id -> {id,nome}
  const grupos = [];
  for (const d of list || []) {
    const adms = Array.isArray(d?.administradoras) ? d.administradoras : [];
    const gs   = Array.isArray(d?.grupos) ? d.grupos : [];
    adms.forEach(a => { if (a?.id && !admMap.has(a.id)) admMap.set(a.id, a); });
    gs.forEach(g => grupos.push(g));
  }
  return { administradoras: Array.from(admMap.values()), grupos };
}

/* Deriva a "chave" da administradora por NOME:
   - tenta achar pelo ID no mapa de administradoras;
   - se não encontrar, usa o nome que vem no grupo (nomeAdministradora);
   - normaliza com N(...).
*/
function adminKeyFromGroup(g, administradorasMap) {
  const id = String(g?.administradoraId ?? '');
  const byId = administradorasMap.get(id)?.nome;
  const name = byId || g?.nomeAdministradora || '';
  return N(name);
}

export default function Home() {
  const [data, setData] = useState({ administradoras: [], grupos: [] });
  const [filters, setFilters] = useState({});
  const [compare, setCompare] = useState([]);

  // mapa id->administradora para resolver nomes
  const administradorasMap = useMemo(() => {
    const m = new Map();
    (data?.administradoras || []).forEach(a => { if (a?.id) m.set(String(a.id), a); });
    return m;
  }, [data]);

  useEffect(() => {
    async function loadAll() {
      try {
        const man = await fetch('/data/_manifest.json', { cache: 'no-store' }).then(r => r.json());
        const files = Array.isArray(man?.datasets) ? man.datasets : [];
        const datasets = await Promise.all(
          files.map(f => fetch(`/data/${f}`, { cache: 'no-store' }).then(r => r.json()))
        );
        setData(mergeDatasets(datasets));
      } catch (e) {
        console.error('Erro ao carregar datasets:', e);
        setData({ administradoras: [], grupos: [] });
      }
    }
    loadAll();
  }, []);

  /* Filtro: administradora por NOME canônico, produto canônico, demais normalizados */
  const filtered = useMemo(() => {
    const { minCarta, maxCarta, admKey, lanceMin, produto, tipoGrupo, prazo } = filters || {};
    return (data.grupos || []).filter(g => {
      const okMin   = minCarta == null ? true : Number(g?.valorCarta ?? 0)  >= Number(minCarta);
      const okMax   = maxCarta == null ? true : Number(g?.valorCarta ?? 0)  <= Number(maxCarta);

      const gAdmKey = adminKeyFromGroup(g, administradorasMap); // ← chave por nome
      const okAdm   = !admKey ? true : gAdmKey === String(admKey);

      const okProd  = !produto  ? true : productKey(g?.produto)  === String(produto);
      const okTipo  = !tipoGrupo? true : N(g?.tipoGrupo)         === String(tipoGrupo);
      const okLance = lanceMin == null ? true : Number(g?.lanceMedio ?? 0) >= Number(lanceMin);
      const okPrazo = prazo == null ? true : Number(g?.prazo ?? 0)          === Number(prazo);
      return okMin && okMax && okAdm && okProd && okTipo && okLance && okPrazo;
    });
  }, [data, filters, administradorasMap]);

  function onCompareToggle(group, checked) {
    setCompare(prev => {
      const set = new Set(prev.map(x => x.id));
      if (checked) {
        if (!set.has(group.id)) return [...prev, group];
        return prev;
      }
      return prev.filter(x => x.id !== group.id);
    });
    try {
      const ids = (checked ? [...compare, group] : compare.filter(x => x.id !== group.id)).map(x => x.id);
      localStorage.setItem('compareSelection', JSON.stringify(ids));
    } catch {}
  }

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-800">Simulador de Consórcio</h1>
        <p className="text-sm text-gray-600">Filtros dinâmicos, visual moderno e contratação direta.</p>
      </header>

      <Filters data={data} onFilterChange={setFilters} />

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
        {filtered.map(g => (
          <GroupCard key={g.id} group={g} onCompareToggle={onCompareToggle} />
        ))}
      </div>
    </main>
  );
}
