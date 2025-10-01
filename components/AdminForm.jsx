// components/AdminForm.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PRODUCTS } from '@/config/catalog';

/* ===== Helpers de formatação ===== */
function onlyDigits(v) {
  return String(v ?? '').replace(/\D+/g, '');
}
function toNumberBRL(v) {
  const raw = String(v ?? '')
    .replace(/\./g, '')     // remove separador de milhar
    .replace(',', '.');     // vírgula -> ponto
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}
function fmtBRL(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtPct(n) {
  if (n == null || n === '') return '';
  const v = Number(n);
  return Number.isFinite(v) ? `${v}%` : '';
}
function parsePct(v) {
  const n = String(v ?? '').replace('%','').replace(',','.');
  const f = Number(n);
  return Number.isFinite(f) ? f : 0;
}

const TIPOS = ['PARCELA INTEGRAL', 'PARCELA REDUZIDA'];

/* ================================================================================== */

export default function AdminForm({
  initialData = { administradoras: [], grupos: [] },
  produtosCatalogo, // opcional: array de labels em CAIXA ALTA
}) {
  // Fallback para o catálogo local caso a prop não venha
  const PRODUTOS = useMemo(() => {
    if (Array.isArray(produtosCatalogo) && produtosCatalogo.length) return produtosCatalogo;
    return PRODUCTS.map(p => p.label.toUpperCase());
  }, [produtosCatalogo]);

  /* ======= Administradoras ======= */
  const [adms, setAdms] = useState(() => initialData.administradoras || []);
  const [admId, setAdmId] = useState('');
  const [admNome, setAdmNome] = useState('');

  const onAddAdm = () => {
    const id = String(admId || '').trim();
    const nome = String(admNome || '').trim();
    if (!id || !nome) return;
    if (adms.some(a => String(a.id) === id)) return;
    setAdms(prev => [...prev, { id, nome }]);
    setAdmId('');
    setAdmNome('');
  };
  const onRemoveAdm = (id) => {
    setAdms(prev => prev.filter(a => String(a.id) !== String(id)));
  };

  // Importar JSON (merge simples)
  const fileRef = useRef(null);
  const onImportJson = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const newAdms = Array.isArray(json?.administradoras) ? json.administradoras : [];
      const newGrps = Array.isArray(json?.grupos) ? json.grupos : [];

      // merge de adms (por id)
      const byId = new Map(adms.map(a => [String(a.id), a]));
      for (const a of newAdms) {
        const id = String(a?.id || '').trim();
        const nome = String(a?.nome || '').trim();
        if (!id || !nome) continue;
        if (!byId.has(id)) byId.set(id, { id, nome });
      }
      setAdms(Array.from(byId.values()));

      // concatena grupos válidos
      setGrupos(prev => {
        const valids = newGrps
          .map(g => sanitizeGroup(g))
          .filter(Boolean);
        return [...prev, ...valids];
      });
    } catch (e) {
      alert('Arquivo JSON inválido.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  /* ======= Grupos ======= */
  const [manterFixos, setManterFixos] = useState(true);

  // campos do form de grupos
  const [gId, setGId] = useState('');
  const [gNumero, setGNumero] = useState(''); // opcional
  const [gAdmId, setGAdmId] = useState(adms[0]?.id || '');
  const [gProduto, setGProduto] = useState(PRODUTOS[0] || 'IMOVEL');
  const [gTipo, setGTipo] = useState(TIPOS[0]);
  const [gValorCarta, setGValorCarta] = useState('');     // moeda
  const [gValorParcela, setGValorParcela] = useState(''); // moeda
  const [gTaxaAdm, setGTaxaAdm] = useState('');           // %
  const [gLanceMedio, setGLanceMedio] = useState('');     // %
  const [gEmbutido, setGEmbutido] = useState('');         // %
  const [gParticipantes, setGParticipantes] = useState(''); // int
  const [gAssembleia, setGAssembleia] = useState('');       // int (dia)
  const [gPrazo, setGPrazo] = useState('');               // meses

  const [grupos, setGrupos] = useState(() => (initialData.grupos || []).map(sanitizeGroup).filter(Boolean));

  function sanitizeGroup(g) {
    try {
      const id = String(g?.id || '').trim() || String(g?.numeroGrupo || '').trim();
      const administradoraId = String(g?.administradoraId || '').trim();
      const produto = String(g?.produto || '').trim().toUpperCase();
      if (!id || !administradoraId || !produto) return null;

      return {
        id,
        numeroGrupo: g?.numeroGrupo ?? id,
        administradoraId,
        produto,                         // Admin usa label em CAIXA ALTA
        tipoGrupo: String(g?.tipoGrupo || '').trim(),
        valorCarta: Number(g?.valorCarta ?? 0),
        valorParcela: Number(g?.valorParcela ?? 0),
        taxaAdm: Number(g?.taxaAdm ?? 0),
        lanceMedio: Number(g?.lanceMedio ?? 0),
        embutido: g?.embutido != null ? Number(g.embutido) : null,
        participantes: g?.participantes != null ? Number(g.participantes) : null,
        assembleiaDia: g?.assembleiaDia != null ? Number(g.assembleiaDia) : null,
        prazo: Number(g?.prazo ?? 0),
      };
    } catch {
      return null;
    }
  }

  const resetCamposNaoFixos = () => {
    setGId('');
    setGValorCarta('');
    setGValorParcela('');
    setGPrazo('');
  };

  const onAddGrupo = () => {
    // valida mínimos
    if (!gAdmId || !gProduto) return;
    const novo = sanitizeGroup({
      id: gId || `${gNumero || ''}`.trim() || cryptoRandomId(),
      numeroGrupo: gNumero || gId || undefined,
      administradoraId: gAdmId,
      produto: gProduto, // label em CAIXA ALTA
      tipoGrupo: gTipo,
      valorCarta: toNumberBRL(String(gValorCarta).replace(/[^\d.,]/g, '')),
      valorParcela: toNumberBRL(String(gValorParcela).replace(/[^\d.,]/g, '')),
      taxaAdm: parsePct(gTaxaAdm),
      lanceMedio: parsePct(gLanceMedio),
      embutido: gEmbutido !== '' ? parsePct(gEmbutido) : null,
      participantes: gParticipantes !== '' ? Number(onlyDigits(gParticipantes)) : null,
      assembleiaDia: gAssembleia !== '' ? Number(onlyDigits(gAssembleia)) : null,
      prazo: gPrazo !== '' ? Number(onlyDigits(gPrazo)) : 0,
    });
    if (!novo) return;
    setGrupos(prev => [novo, ...prev]);

    if (manterFixos) {
      // mantém: Numero, Administradora, Produto, Tipo, Taxa, %s, Participantes, Assembleia
      resetCamposNaoFixos();
    } else {
      // limpa tudo
      setGId('');
      setGNumero('');
      setGAdmId(adms[0]?.id || '');
      setGProduto(PRODUTOS[0] || 'IMOVEL');
      setGTipo(TIPOS[0]);
      setGValorCarta('');
      setGValorParcela('');
      setGTaxaAdm('');
      setGLanceMedio('');
      setGEmbutido('');
      setGParticipantes('');
      setGAssembleia('');
      setGPrazo('');
    }
  };

  function cryptoRandomId() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const a = crypto.getRandomValues(new Uint32Array(2));
      return `G-${a[0].toString(16)}-${a[1].toString(16)}`;
    }
    return `G-${Math.random().toString(16).slice(2)}`;
  }

  const onDuplicateGrupo = (g) => {
    const clone = { ...g, id: cryptoRandomId() };
    setGrupos(prev => [clone, ...prev]);
  };
  const onRemoveGrupo = (g) => {
    setGrupos(prev => prev.filter(x => x !== g));
  };

  // Exportar JSON no formato esperado pelo simulador
  const onExportJson = () => {
    const payload = {
      administradoras: adms,
      grupos: grupos,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `groups_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Adapta admin selecionada default quando muda lista
  useEffect(() => {
    if (!adms.length) return;
    if (!adms.some(a => String(a.id) === String(gAdmId))) {
      setGAdmId(adms[0].id);
    }
  }, [adms]); // eslint-disable-line

  return (
    <section className="space-y-8">
      {/* ================= Administradoras ================= */}
      <div className="border rounded-2xl p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Administradoras</h2>
          <div className="flex items-center gap-2 text-sm">
            <label className="inline-flex items-center gap-2">
              Importar JSON:
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                onChange={e => onImportJson(e.target.files?.[0])}
                className="text-sm"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[200px,1fr,160px] gap-3">
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="ID"
            value={admId}
            onChange={e => setAdmId(e.target.value)}
          />
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Nome"
            value={admNome}
            onChange={e => setAdmNome(e.target.value)}
          />
          <button
            className="rounded-xl px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 transition"
            onClick={onAddAdm}
            type="button"
          >
            Adicionar
          </button>
        </div>

        {adms.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {adms.map(a => (
              <li key={a.id} className="flex items-center justify-between border rounded-xl px-3 py-2">
                <span>{a.id} — <strong>{a.nome}</strong></span>
                <button
                  className="text-rose-600 hover:underline"
                  onClick={() => onRemoveAdm(a.id)}
                  type="button"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ================= Grupos ================= */}
      <div className="border rounded-2xl p-4 bg-white">
        <h2 className="font-semibold text-lg mb-3">Grupos</h2>

        <label className="inline-flex items-center gap-2 text-sm mb-2">
          <input
            type="checkbox"
            className="accent-orange-500"
            checked={manterFixos}
            onChange={e => setManterFixos(e.target.checked)}
          />
          Manter campos fixos ao adicionar
          <span className="text-gray-500">
            &nbsp;— Mantém: Número, Administradora, Produto, Tipo, Taxa Adm, % Lance, % Embutido, Participantes e Assembleia. Limpa: ID, Valor Carta, Valor Parcela e Prazo.
          </span>
        </label>

        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="ID"
            value={gId}
            onChange={e => setGId(e.target.value)}
          />
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Número do Grupo (opcional)"
            value={gNumero}
            onChange={e => setGNumero(e.target.value)}
          />

          {/* Administradora */}
          <select
            className="border rounded-xl px-3 py-2"
            value={gAdmId}
            onChange={e => setGAdmId(e.target.value)}
          >
            {adms.map(a => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>

          {/* Produto (catálogo) */}
          <select
            className="border rounded-xl px-3 py-2"
            value={gProduto}
            onChange={e => setGProduto(e.target.value)}
          >
            {PRODUTOS.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Tipo */}
          <select
            className="border rounded-xl px-3 py-2"
            value={gTipo}
            onChange={e => setGTipo(e.target.value)}
          >
            {TIPOS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Valor Carta */}
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="R$ 15.000,00"
            value={gValorCarta}
            onChange={e => setGValorCarta(e.target.value)}
          />

          {/* Valor Parcela */}
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="R$ 1.514,56"
            value={gValorParcela}
            onChange={e => setGValorParcela(e.target.value)}
          />

          {/* Taxa Adm (%) */}
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="ex: 20"
            value={gTaxaAdm}
            onChange={e => setGTaxaAdm(e.target.value)}
          />
          {/* % Lance Médio */}
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="ex: 60"
            value={gLanceMedio}
            onChange={e => setGLanceMedio(e.target.value)}
          />
          {/* % Lance Embutido */}
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="ex: 0"
            value={gEmbutido}
            onChange={e => setGEmbutido(e.target.value)}
          />
          {/* Participantes */}
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="ex: 999"
            value={gParticipantes}
            onChange={e => setGParticipantes(e.target.value)}
          />
          {/* Assembleia (dia) */}
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="ex: 10"
            value={gAssembleia}
            onChange={e => setGAssembleia(e.target.value)}
          />
          {/* Prazo */}
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="ex: 84"
            value={gPrazo}
            onChange={e => setGPrazo(e.target.value)}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            className="rounded-xl px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 transition"
            onClick={onAddGrupo}
            type="button"
          >
            Adicionar Grupo
          </button>

          <button
            className="rounded-xl px-4 py-2 bg-slate-100 border hover:bg-slate-200 transition"
            onClick={onExportJson}
            type="button"
          >
            Exportar JSON
          </button>
        </div>

        {/* Lista de grupos atuais */}
        {grupos.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {grupos.map((g, idx) => (
              <li key={`${g.id}-${idx}`} className="flex items-center justify-between border rounded-xl px-3 py-2">
                <span>
                  Grupo <strong>{g.numeroGrupo || g.id}</strong> —{' '}
                  <strong>{g.administradoraId}</strong> —{' '}
                  <strong>{g.produto}</strong> — {fmtBRL(g.valorCarta)}
                </span>
                <span className="flex items-center gap-4">
                  <button
                    className="text-slate-600 hover:underline"
                    onClick={() => onDuplicateGrupo(g)}
                    type="button"
                  >
                    Duplicar
                  </button>
                  <button
                    className="text-rose-600 hover:underline"
                    onClick={() => onRemoveGrupo(g)}
                    type="button"
                  >
                    Remover
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
