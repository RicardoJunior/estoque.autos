import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      {/* header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-lg font-bold tracking-tight">
          estoque<span className="text-[var(--color-brand)]">.autos</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-brand)]"
          >
            Entrar
          </Link>
          <Link href="/cadastro" className="btn-primary">
            Criar loja grátis
          </Link>
        </nav>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          O site da sua loja de carros,{" "}
          <span className="text-[var(--color-brand)]">pronto em minutos</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--color-ink-soft)]">
          Crie sua conta, cadastre o estoque e tenha uma vitrine profissional no
          ar. Escolha entre 6 templates, suas cores e seu logo — sem precisar de
          programador.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/cadastro" className="btn-primary px-6 py-3 text-base">
            Começar agora
          </Link>
          <Link href="/login" className="btn-ghost px-6 py-3 text-base">
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {[
          {
            t: "Site pronto",
            d: "6 templates profissionais. Escolha o seu, ajuste as cores e suba o logo.",
          },
          {
            t: "Estoque fácil",
            d: "Cadastre seus carros com fotos, preço e detalhes. Publique com um clique.",
          },
          {
            t: "Receba contatos",
            d: "Cada carro tem formulário de proposta e botão de WhatsApp que viram leads.",
          },
        ].map((f) => (
          <div key={f.t} className="card p-6">
            <div className="font-semibold">{f.t}</div>
            <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-ink-soft)]">
        © {new Date().getFullYear()} estoque.autos
      </footer>
    </div>
  );
}
