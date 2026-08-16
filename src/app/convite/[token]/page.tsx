import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TEAM_ROLE_LABELS, type TeamRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { AcceptInvite } from "./AcceptInvite";
import { logoutToInviteAction } from "./actions";

export const metadata = {
  title: "Convite para a equipe",
  robots: { index: false, follow: false },
};

/** linha devolvida pela RPC pública invite_preview */
interface InvitePreview {
  store_name: string;
  email: string;
  role: TeamRole;
  expired: boolean;
  accepted: boolean;
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("invite_preview", { p_token: token });
  const preview = ((Array.isArray(data) ? data[0] : data) ??
    null) as InvitePreview | null;

  if (!preview) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">Convite não encontrado</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Este link de convite é inválido. Confira se o endereço foi copiado
          por completo ou peça um novo convite à loja.
        </p>
      </Shell>
    );
  }

  if (preview.accepted) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">Convite já utilizado</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Este convite para a {preview.store_name} já foi aceito. Se foi você,
          basta entrar na sua conta para acessar o painel.
        </p>
        <Link
          href="/login"
          className={`${buttonVariants({ variant: "outline" })} mt-6 w-full`}
        >
          Ir para o login
        </Link>
      </Shell>
    );
  }

  if (preview.expired) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">Convite expirado</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Este convite para a {preview.store_name} venceu — convites valem por
          7 dias. Peça à loja para enviar um novo.
        </p>
      </Shell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const emailMatches =
    !!user?.email &&
    user.email.toLowerCase() === preview.email.toLowerCase();

  return (
    <Shell>
      <h1 className="text-xl font-bold">Você foi convidado</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        A loja abaixo convidou você para fazer parte da equipe dela no
        estoque.autos.
      </p>

      <div className="mt-5 rounded-xl border border-border bg-muted/30 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-base font-semibold">
            {preview.store_name}
          </span>
          <Badge>{TEAM_ROLE_LABELS[preview.role]}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Convite enviado para {preview.email}
        </p>
      </div>

      <div className="mt-6">
        {!user ? (
          <>
            <p className="mb-4 text-sm text-[var(--color-ink-soft)]">
              Entre na sua conta — ou crie uma com o e-mail convidado — para
              aceitar.
            </p>
            <div className="grid gap-2">
              <Link
                href={`/login?next=${encodeURIComponent(`/convite/${token}`)}`}
                className={`${buttonVariants()} w-full`}
              >
                Entrar
              </Link>
              <Link
                href={`/cadastro?next=${encodeURIComponent(`/convite/${token}`)}`}
                className={`${buttonVariants({ variant: "outline" })} w-full`}
              >
                Criar conta
              </Link>
            </div>
          </>
        ) : emailMatches ? (
          <AcceptInvite token={token} />
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              Este convite foi enviado para{" "}
              <strong className="font-semibold">{preview.email}</strong>, mas
              você está conectado como{" "}
              <strong className="font-semibold">{user.email}</strong>.
            </div>
            <form action={logoutToInviteAction}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit" variant="outline" className="w-full">
                Sair e entrar com outra conta
              </Button>
            </form>
          </div>
        )}
      </div>
    </Shell>
  );
}

/**
 * Shell público centrado no padrão dark do app — o layout do grupo
 * (auth) não se aplica a /convite, então o casulo é local.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-xl font-bold tracking-tight text-[var(--color-ink)]"
      >
        estoque<span className="text-[var(--color-brand)]">.autos</span>
      </Link>
      <div className="w-full max-w-md rounded-xl bg-card p-8 text-card-foreground ring-1 ring-foreground/10">
        {children}
      </div>
    </div>
  );
}
