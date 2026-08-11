import Link from "next/link";

// 404 da vitrine: tom neutro, sem expor detalhe da plataforma no aviso —
// só o link discreto de marketing no rodapé.
export default function StorefrontNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 text-center text-foreground">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-bold">
        Loja não encontrada ou indisponível
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Confira se o endereço está correto ou tente de novo mais tarde.
      </p>
      <Link
        href="/"
        className="mt-14 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Crie o site da sua loja — estoque
        <span className="text-[var(--color-brand)]">.autos</span>
      </Link>
    </div>
  );
}
