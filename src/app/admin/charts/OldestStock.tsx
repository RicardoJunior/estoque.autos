import Link from "next/link";
import Image from "next/image";
import { Hourglass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import type { OldestVehicle } from "@/lib/metrics";

/**
 * Ranking dos anúncios há mais tempo no estoque (barras horizontais com
 * rótulo direto — todo valor é visível, sem depender de hover). Cada linha
 * leva ao veículo, onde dá para ajustar preço ou destacar.
 */
export function OldestStock({ vehicles }: { vehicles: OldestVehicle[] }) {
  const maxDays = Math.max(1, ...vehicles.map((v) => v.days));

  return (
    <Card className="gap-3 p-5">
      <div>
        <div className="font-semibold">Mais tempo em estoque</div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Os anúncios mais antigos ainda à venda — candidatos a reajuste ou
          destaque.
        </p>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Hourglass className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Nenhum carro em estoque no momento.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {vehicles.map((v) => (
            <li key={v.id}>
              <Link
                href={`/admin/veiculos/${v.id}`}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted/50"
              >
                <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  {v.photoUrl ? (
                    <Image
                      src={v.photoUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">
                      sem foto
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium">
                      {v.title}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {v.days} {v.days === 1 ? "dia" : "dias"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    {/* base reta (esquerda), só a ponta de dado arredonda */}
                    <div
                      className="h-1.5 flex-1 overflow-hidden rounded-r-full"
                      style={{
                        background:
                          "color-mix(in oklab, var(--chart-1) 16%, transparent)",
                      }}
                    >
                      <div
                        className="h-full rounded-r-full"
                        style={{
                          width: `${Math.max(2, (v.days / maxDays) * 100)}%`,
                          background: "var(--chart-1)",
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatPrice(v.price)}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
