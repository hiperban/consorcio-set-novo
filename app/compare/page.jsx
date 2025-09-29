"use client";

import { useState, useMemo } from "react";
import CompareBar from "@/CompareBar";
import GroupCard from "@/GroupCard";
import { useAllData, applyFilters } from "@/utils/data";
import Filters from "@/Filters";

export default function Page() {
  const { data, error, isLoading } = useAllData();
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState([]);

  const grupos = useMemo(() => {
    if (!data) return [];
    return (data?.grupos || []).filter((g) => applyFilters(g, filters));
  }, [data, filters]);

  function toggleSelect(group) {
    const exists = selected.find((s) => s.__groupKey === group.__groupKey);
    if (exists) {
      setSelected(selected.filter((s) => s.__groupKey !== group.__groupKey));
    } else {
      setSelected([...selected, group]);
    }
  }

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Comparar Grupos</h1>

      <Filters onChange={setFilters} data={data} />

      {isLoading && <p>Carregando...</p>}
      {error && <p>Erro ao carregar dados.</p>}

      <CompareBar selected={selected} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grupos.map((g, idx) => (
          <div key={idx} onClick={() => toggleSelect(g)}>
            <GroupCard
              group={g}
              isSelected={!!selected.find((s) => s.__groupKey === g.__groupKey)}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
