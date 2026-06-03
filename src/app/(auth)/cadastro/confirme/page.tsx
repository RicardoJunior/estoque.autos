import Link from "next/link";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <>
      <h1 className="text-xl font-bold">Confirme seu e-mail</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Enviamos um link de confirmação{email ? ` para ${email}` : ""}. Clique
        nele para ativar sua conta e continuar a criação da sua loja.
      </p>
      <Link href="/login" className="btn-ghost mt-6 w-full">
        Voltar para o login
      </Link>
    </>
  );
}
