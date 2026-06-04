"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { VEHICLE_STATUS_LABELS } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORTS: Record<string, string> = {
  recent: "Mais recentes",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
  km_asc: "Menor km",
};

export function VehicleFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/admin/veiculos?${next.toString()}`);
  }

  // debounce da busca textual
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (search === current) return;
    const t = setTimeout(() => setParam("q", search), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        className="h-8 max-w-xs flex-1"
        placeholder="Buscar por marca ou modelo…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Select
        value={params.get("status") ?? ""}
        onValueChange={(value) => setParam("status", value ?? "")}
      >
        <SelectTrigger className="h-8 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos os status</SelectItem>
          {Object.entries(VEHICLE_STATUS_LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.get("sort") ?? "recent"}
        onValueChange={(value) => setParam("sort", value ?? "recent")}
      >
        <SelectTrigger className="h-8 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SORTS).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
