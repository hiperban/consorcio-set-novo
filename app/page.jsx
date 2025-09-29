"use client";

import { useEffect, useMemo, useState } from "react";
import Filters from "../Filters";
import GroupCard from "../GroupCard";

/* ---------- Utils ---------- */
const N = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const slug = (s) => N(s).replace(/[^A-Z0-9]+/g, "-");

/* ---------- Mapas canônicos ---------- */
function productToCode(raw) {
  const t = N(raw);
  if (/IMOV/.test(t)) return { code: "IMOVEL", label: "Imóvel" };
  if (/AUTO|CARRO|VEICUL/.test(t)) return { code: "AUTOMOVEL", label: "Automóvel" };
  if (/MOTO/.test(t)) return { code: "MOTO", label: "Moto" };
  if (/CAMINHAO/.test(t)) return { code: "CAMINHAO", label: "Caminhão" };
  if (/PLACA|SOLAR/.test(t)) return { code: "PLACA_SOLAR", label: "Placa Solar" };
  if (/SERVI[ÇC]O|SERVICO/.test(t)) return { code: "SERVICO", label: "Serviços" };
  return { code: "OUTROS", label: raw || "Outros Bens" };
}

const tipoToCode = (raw) =>
  N(raw).includes("REDUZ") ? "REDUZIDA" : N(raw).includes("INTEGRAL") ? "INTEGRAL" : "";

/* ---------- Loader de dados ---------- */
async function loadAllDatasets() {
  const man = await fetch("/_manifest.json").then((r) => r.json());
  const files = Array.isArray(man?.datasets) ? man.datasets : [];
  const results = await Promise.allSettled(
    files.map((f) => fetch(`/${f}`).then((r) => r.json()))
  );

  const administradoras = [];
  const grupos = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const j = r.value || {};
    if (Array.isArray(j.administradoras)) administradoras.push(...j.administradoras);
    if (Array.isArray(j.grupos)) grupos.push(...j.grupos);
  }

  // índice de admins
  const admById = new Map();
  for (const a of administradoras) {
    const id = String(a.id ?? "").trim();
    if (!id) continue;
    admById.set(id, { ...a, __key: `id:${id}`, __slug: slug(a.nome || id) });
  }

  // normaliza grupos em canônico
  const normGrupos = grupos.map((g, i) => {
    const id = String(g?.administradoraId ?? "").trim();
    const adm = id ? admById.get(id) : null;
    const prod = productToCode(g?.produto);
    const tipo = tipoToCode(g?.tipoGrupo);

    return {
      ...g,
      __adminId: id || "",
      __adminName: adm?.nome || g?.nomeAdministradora || "",
      __adminKey: adm?.__key || (g?.nomeAdministradora ? `nm:${slug(g.nomeAdministradora)}` : ""),
      __productCode: prod.code,
      __productLabel: prod.label,
      __tipoCode: tipo,
      __valorCarta: Number(g?.valorCarta ?? NaN),
      __lanceMedio: Number(g?.lanceMedio ?? NaN),
      __prazo: Number(g?.prazo ?? NaN),
      __groupKey:
        g?.id ||
        `${adm?.__key ?? "adm"}|${prod.code}|${tipo}|${g?.numeroGrupo ?? i}|${g?.valorCarta ?? "x"}`,
    };
  });

  return { administradoras, grupos: normGrupos };
}

/* ---------- Match canônico (sem fallback por texto cru) ---------- */
function matches(g, flt) {
  if (!g) return false;
  if (flt.adminKey && g.__adminKey !== flt.adminKey) return false;
  if (flt.productCode && g.__productCode !== flt.productCode) return false;
  if (flt.tipoCode && g.__tipoCode !== flt.tipoCode) return false;
  if (Number.isFinite(flt.minCarta) && !(g.__valorCarta >= flt.minCarta)) return false;
  if (Number.isFinite(flt.maxCarta) && !(g.__valorCarta <= flt.maxCarta)) return false;
  if (Number.isFinite(flt.lanceMin) && !(g.__lanceMedio >= flt.lanceMin)) return false;
  if (Number.isFinite(flt.prazo) && !(g.__prazo === flt.prazo)) return false;
  return true;
}

/* ---------- Página ---------- */
export default function Page() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await loadAllDatasets();
        if (!alive) return;
        setData(d);
      } catch (e) {
        if (!alive) return;
        setError("Falha ao carregar dados.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    return (data?.grupos || []).filter((g) => matches(g, filters));
  }, [data, filters]);

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Simulador de Consórcio</h1>

      <Filters data={data} onApply={setFilters} />

      {isLoading && <p>Carregando…</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((g, idx) => (
          <GroupCard
            key={g.__groupKey ?? idx}
            group={{
              ...g,
              nomeAdministradora: g.__adminName || g.nomeAdministradora,
              produto: g.__productLabel,
            }}
          />
        ))}
      </div>

      {!isLoading && !error && visible.length === 0 && (
        <p className="text-gray-500">Nenhum grupo encontrado com os filtros.</p>
      )}
    </main>
  );
}
