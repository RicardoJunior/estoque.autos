import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Cabeçalho padrão das telas do painel: link de voltar opcional, título,
 * descrição e um slot de ação à direita (ex.: botão "Cadastrar carro").
 */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {backLabel ?? "Voltar"}
          </Link>
        )}
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  );
}
