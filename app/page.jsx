"use client";

import { useState, useMemo } from "react";
import Filters from "@/Filters";
import GroupCard from "@/GroupCard";
import { useAllData, applyFilters } from "@/utils/data";

export default function Page() {
  const { data, error, isLoading } = useAllData();
  const [filters, setFilters] = useState({});

  const grupos = useMemo(() => {
    if (!data) return [];
    return (data?.grupos || []).filter((g) => applyFilters(g, filters));
  }, [data, filters]);

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Simulador de Consórcio</h1>

      <Filters onChange={setFilters} data={data} />

      {isLoading && <p>Carregando...</p>}
      {error && <p>Erro ao carregar dados.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grupos.map((g, idx) => (
          <GroupCard key={idx} group={g} />
        ))}
      </div>

      {!isLoading && grupos.length === 0 && (
        <p className="text
