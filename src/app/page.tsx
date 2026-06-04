import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BILLING_INTERVALS, PLANS as BILLING_PLANS } from "@/lib/billing";
import { PlanosSection } from "./PlanosSection";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.estoque.autos";

export const metadata: Metadata = {
  title: "estoque.autos — o site da sua loja de carros, pronto em minutos",
  description:
    "Crie a conta, cadastre o estoque e tenha uma vitrine profissional no ar. 6 templates, suas cores e seu logo — cada carro com proposta e WhatsApp que viram leads. Tabela FIPE no cadastro.",
  keywords: [
    "site para loja de carros",
    "site para revenda de veículos",
    "criar site de carros",
    "vitrine de veículos online",
    "sistema para loja de carros",
    "tabela fipe",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "estoque.autos",
    title: "estoque.autos — o site da sua loja de carros, pronto em minutos",
    description:
      "Vitrine profissional para sua loja de carros em minutos: 6 templates, suas cores, seu logo, leads por WhatsApp e tabela FIPE no cadastro.",
  },
  twitter: {
    card: "summary_large_image",
    title: "estoque.autos — o site da sua loja de carros, pronto em minutos",
    description:
      "Vitrine profissional para sua loja de carros em minutos. 6 templates, suas cores, leads por WhatsApp e tabela FIPE.",
  },
};

const TEMPLATES = [
  { name: "Clássico", vibe: "Tradicional e confiável" },
  { name: "Moderno", vibe: "Tecnológico e arrojado" },
  { name: "Premium", vibe: "Alto padrão" },
  { name: "Minimal", vibe: "Sofisticado e discreto" },
  { name: "Esportivo", vibe: "Energia e velocidade" },
  { name: "Vitrine", vibe: "Visual em primeiro lugar" },
];

const FEATURES = [
  { k: "Site pronto", d: "6 templates profissionais. Escolha, ajuste a cor, a fonte e suba o logo." },
  { k: "Lead em cada carro", d: "Formulário de proposta e botão de WhatsApp que viram contato no seu painel." },
  { k: "Tabela FIPE", d: "Cadastre pela base FIPE — marca, modelo, versão e ano — e veja o valor de referência." },
  { k: "WhatsApp direto", d: "O cliente clica e fala com você. Cada clique vira um lead registrado." },
  { k: "Achado no Google", d: "Cada anúncio com SEO, link de compartilhamento e sitemap automáticos." },
  { k: "Domínio próprio", d: "Conecte o seu domínio com um passo a passo simples de apontamento." },
];

const STEPS = [
  ["01", "Escolha o plano e crie a conta", "Selecione Básico ou Pro, crie a conta e o pagamento é seguro — leva minutos."],
  ["02", "Monte a vitrine", "Escolha o template, a cor e a fonte, suba o logo. Cadastre os carros pela FIPE."],
  ["03", "Receba contatos", "Seu site entra no ar. Cada proposta e clique no WhatsApp vira um lead."],
];

const FAQ: [string, string][] = [
  ["Preciso saber programar?", "Não. Você cadastra os carros e escolhe o visual; o site fica pronto sozinho."],
  ["Quanto tempo leva pra ficar no ar?", "Minutos. Você assina o plano, cria a conta, escolhe o template, sobe o logo e já publica."],
  ["Posso trocar de template depois?", "Sim, quando quiser, sem perder os carros nem as configurações."],
  ["Como funciona o domínio próprio?", "No plano Pro você conecta o seu domínio (ex.: sualoja.com.br) com instruções claras de apontamento de DNS."],
  ["De onde vem o preço FIPE?", "Da tabela FIPE oficial, atualizada mensalmente. Você cadastra o carro por marca/modelo/versão/ano e vê o valor de referência."],
  ["O que conta como carro ativo?", "Veículos publicados na vitrine. Vendidos e arquivados não contam no limite."],
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "estoque.autos",
      url: APP_URL,
      description:
        "Plataforma SaaS para lojas de veículos criarem um site profissional em minutos.",
    },
    {
      "@type": "SoftwareApplication",
      name: "estoque.autos",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: APP_URL,
      description:
        "Site profissional para lojas de carros: 6 templates, cores e fonte da loja, cadastro pela tabela FIPE e leads por WhatsApp.",
      offers: Object.values(BILLING_PLANS).flatMap((p) =>
        BILLING_INTERVALS.map((interval) => ({
          "@type": "Offer",
          name: `Plano ${p.name} (${interval})`,
          price: (p.priceCents[interval] / 100).toFixed(2),
          priceCurrency: "BRL",
          url: `${APP_URL}/cadastro?plano=${p.id}&intervalo=${interval}`,
        })),
      ),
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <div className="lp">
      <style>{css}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="lp-grain" aria-hidden />

      {/* ───────────── NAV ───────────── */}
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <Link href="/" aria-label="estoque.autos">
            <Logo size={22} />
          </Link>
          <nav className="lp-nav-links">
            <a href="#como">Como funciona</a>
            <a href="#templates">Templates</a>
            <a href="#planos">Planos</a>
          </nav>
          <div className="lp-nav-cta">
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Entrar
            </Link>
            <a href="#planos" className={cn(buttonVariants({ size: "sm" }), "lp-cta")}>
              Começar
            </a>
          </div>
        </div>
      </header>

      {/* ───────────── HERO ───────────── */}
      <section className="lp-hero">
        <div className="lp-headlights" aria-hidden />
        <div className="lp-wrap lp-hero-in">
          <Badge variant="outline" className="lp-eyebrow lp-rise" style={{ animationDelay: "0ms" }}>
            <span className="lp-dot" /> Plataforma para lojas de veículos
          </Badge>

          <h1 className="lp-h1 font-display">
            <span className="lp-rise" style={{ animationDelay: "60ms" }}>O SITE DA SUA</span>
            <span className="lp-rise" style={{ animationDelay: "140ms" }}>LOJA DE CARROS,</span>
            <span className="lp-rise lp-glowtext" style={{ animationDelay: "220ms" }}>
              PRONTO EM MINUTOS.
            </span>
          </h1>

          <p className="lp-sub lp-rise" style={{ animationDelay: "320ms" }}>
            Crie a conta, cadastre o estoque e tenha uma vitrine profissional no ar.
            Escolha entre 6 templates, suas cores e sua fonte — e cada carro já vem
            com proposta, botão de WhatsApp e valor de tabela FIPE.
          </p>

          <div className="lp-hero-cta lp-rise" style={{ animationDelay: "400ms" }}>
            <a
              href="#planos"
              className={cn(buttonVariants({ size: "lg" }), "lp-cta lp-cta-lg")}
            >
              Ver planos <span className="lp-arrow">→</span>
            </a>
            <a
              href="#como"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "lp-cta-lg")}
            >
              Como funciona
            </a>
          </div>

          {/* mockup de vitrine */}
          <div className="lp-mock lp-rise" style={{ animationDelay: "520ms" }}>
            <div className="lp-browser">
              <div className="lp-browser-bar">
                <span className="lp-dotr" />
                <span className="lp-dotr" />
                <span className="lp-dotr" />
                <span className="lp-url">estoque.autos/sua-loja</span>
              </div>
              <div className="lp-store">
                <div className="lp-store-head">
                  <span className="lp-store-logo">SL</span>
                  <span className="lp-store-name">Sua Loja</span>
                  <span className="lp-store-cta">Fale conosco</span>
                </div>
                <div className="lp-store-grid">
                  {["132.900", "124.500", "158.000"].map((p, i) => (
                    <div className="lp-card" key={i}>
                      <div className={`lp-card-img lp-img-${i}`} />
                      <div className="lp-card-body">
                        <div className="lp-card-line" />
                        <div className="lp-card-price">R$ {p}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lp-mock-floor" aria-hidden />
          </div>
        </div>
      </section>

      {/* ───────────── STRIP ───────────── */}
      <section className="lp-strip">
        <div className="lp-wrap lp-strip-in">
          {[
            ["6", "templates prontos"],
            ["FIPE", "no cadastro"],
            ["WhatsApp", "leads direto"],
            ["0", "linhas de código"],
          ].map(([a, b]) => (
            <div className="lp-stat" key={b}>
              <span className="lp-stat-a font-display">{a}</span>
              <span className="lp-stat-b">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── COMO FUNCIONA ───────────── */}
      <section id="como" className="lp-sec">
        <div className="lp-wrap">
          <p className="lp-kicker">Como funciona</p>
          <h2 className="lp-h2 font-display">Três passos. Nenhum técnico.</h2>
          <div className="lp-steps">
            {STEPS.map(([n, t, d]) => (
              <div className="lp-step" key={n}>
                <span className="lp-step-n font-display">{n}</span>
                <h3 className="lp-step-t">{t}</h3>
                <p className="lp-step-d">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── TEMPLATES ───────────── */}
      <section id="templates" className="lp-sec lp-sec-alt">
        <div className="lp-wrap">
          <p className="lp-kicker">Templates</p>
          <h2 className="lp-h2 font-display">
            Seis estilos. <span className="lp-amber">Uma loja só sua.</span>
          </h2>
          <p className="lp-lead">
            Troque de template quando quiser — sem perder nada. Cor, fonte e logo
            se aplicam a todos, na hora.
          </p>
          <div className="lp-tpl-grid">
            {TEMPLATES.map((t, i) => (
              <div className="lp-tpl" key={t.name}>
                <div className={`lp-tpl-prev lp-tpl-${i}`} aria-hidden>
                  <span className="lp-tpl-bar" />
                  <span className="lp-tpl-blk" />
                  <span className="lp-tpl-blk" />
                </div>
                <div className="lp-tpl-meta">
                  <span className="lp-tpl-name">{t.name}</span>
                  <span className="lp-tpl-vibe">{t.vibe}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FEATURES ───────────── */}
      <section className="lp-sec">
        <div className="lp-wrap">
          <p className="lp-kicker">Tudo incluso</p>
          <h2 className="lp-h2 font-display">Feito para vender carro.</h2>
          <div className="lp-feat-grid">
            {FEATURES.map((f) => (
              <div className="lp-feat" key={f.k}>
                <span className="lp-feat-mark" aria-hidden />
                <h3 className="lp-feat-k">{f.k}</h3>
                <p className="lp-feat-d">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── PLANOS ───────────── */}
      <section id="planos" className="lp-sec lp-sec-alt">
        <div className="lp-wrap">
          <p className="lp-kicker">Planos</p>
          <h2 className="lp-h2 font-display">Preço de assinatura, não de agência.</h2>
          <p className="lp-lead">
            Sem taxa de setup. Você escolhe o plano, assina e começa hoje — cancele
            quando quiser. No anual, dois preços redondos: R$ 190 ou R$ 490 por ano.
          </p>

          <PlanosSection />
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="lp-sec">
        <div className="lp-wrap lp-faq-wrap">
          <p className="lp-kicker">Dúvidas</p>
          <h2 className="lp-h2 font-display">Antes de começar.</h2>
          <Accordion className="lp-faq">
            {FAQ.map(([q, a], i) => (
              <AccordionItem value={`faq-${i}`} key={q}>
                <AccordionTrigger className="lp-faq-trigger">{q}</AccordionTrigger>
                <AccordionContent className="lp-faq-content">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ───────────── CTA FINAL ───────────── */}
      <section className="lp-final">
        <div className="lp-headlights lp-headlights-2" aria-hidden />
        <div className="lp-wrap lp-final-in">
          <h2 className="lp-final-h font-display">
            Sua vitrine pode estar no ar <span className="lp-amber">hoje</span>.
          </h2>
          <a
            href="#planos"
            className={cn(buttonVariants({ size: "lg" }), "lp-cta lp-cta-lg")}
          >
            Escolher meu plano <span className="lp-arrow">→</span>
          </a>
          <p className="lp-final-note">
            Planos a partir de R$ 19,90/mês · cancele quando quiser.
          </p>
        </div>
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-in">
          <Logo size={20} />
          <span className="lp-footer-c">
            © 2026 estoque.autos · feito para lojistas
          </span>
          <div className="lp-footer-links">
            <Link href="/blog">Blog</Link>
            <Link href="/ajuda">Ajuda</Link>
            <a href="#planos">Planos</a>
            <Link href="/login">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const css = `
.lp{
  --amber:var(--color-primary); --amber2:#ffb14d;
  background:var(--color-background); color:var(--color-foreground);
  min-height:100dvh; overflow-x:hidden; position:relative; letter-spacing:-0.005em;
}
.lp-amber{color:var(--amber)}
.lp ::selection{background:var(--amber);color:#10100c}
.lp a{color:inherit;text-decoration:none}
.lp-wrap{max-width:1140px;margin:0 auto;padding:0 24px}

/* grão */
.lp-grain{position:fixed;inset:0;background-image:${GRAIN};background-size:160px;
  opacity:.05;mix-blend-mode:overlay;pointer-events:none;z-index:60}

/* nav */
.lp-nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);
  background:color-mix(in srgb, var(--color-background) 70%, transparent);
  border-bottom:1px solid var(--color-border)}
.lp-nav-in{display:flex;align-items:center;justify-content:space-between;height:68px}
.lp-nav-links{display:flex;gap:30px;font-size:14px;color:var(--color-muted-foreground)}
.lp-nav-links a:hover{color:var(--color-foreground)}
.lp-nav-cta{display:flex;align-items:center;gap:10px}
@media(max-width:760px){.lp-nav-links{display:none}}

/* CTA âmbar com glow */
.lp-cta{box-shadow:0 8px 30px -8px color-mix(in srgb, var(--amber) 60%, transparent)}
.lp-cta:hover{box-shadow:0 12px 40px -8px color-mix(in srgb, var(--amber) 75%, transparent)}
.lp-cta-lg{height:50px;padding-inline:26px;font-size:15px;border-radius:999px}
.lp-arrow{transition:transform .2s;display:inline-block}
.lp button:hover .lp-arrow,.lp a:hover .lp-arrow{transform:translateX(4px)}

/* hero */
.lp-hero{position:relative;padding:90px 0 40px;overflow:hidden}
.lp-headlights{position:absolute;left:50%;top:18%;width:1100px;height:620px;
  transform:translateX(-50%);pointer-events:none;
  background:
    radial-gradient(closest-side at 38% 50%, color-mix(in srgb, var(--amber) 34%, transparent), transparent 70%),
    radial-gradient(closest-side at 62% 50%, rgba(255,150,60,.26), transparent 70%);
  filter:blur(8px);animation:lp-pulse 6s ease-in-out infinite}
.lp-hero-in{position:relative;text-align:center}
.lp-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:13px;font-weight:500;
  color:var(--color-muted-foreground);padding:7px 14px;border-radius:999px}
.lp-dot{width:7px;height:7px;border-radius:50%;background:var(--amber);box-shadow:0 0 10px var(--amber)}
.lp-h1{margin:26px 0 0;line-height:.92;letter-spacing:-.02em;font-weight:400;
  font-size:clamp(44px,8.2vw,108px);text-transform:uppercase;text-wrap:balance}
.lp-h1 span{display:block}
.lp-glowtext{color:var(--amber);text-shadow:0 0 38px color-mix(in srgb, var(--amber) 45%, transparent)}
.lp-sub{max-width:640px;margin:30px auto 0;font-size:clamp(16px,2vw,19px);
  line-height:1.55;color:var(--color-muted-foreground);text-wrap:pretty}
.lp-hero-cta{display:flex;gap:14px;justify-content:center;margin-top:36px;flex-wrap:wrap}

/* mockup */
.lp-mock{position:relative;margin:70px auto 0;max-width:920px}
.lp-browser{border:1px solid var(--color-border);border-radius:16px;overflow:hidden;
  background:var(--color-card);box-shadow:0 50px 120px -40px rgba(0,0,0,.9);position:relative;z-index:2}
.lp-browser-bar{display:flex;align-items:center;gap:8px;padding:13px 16px;
  background:color-mix(in srgb, var(--color-card) 80%, #000);border-bottom:1px solid var(--color-border)}
.lp-dotr{width:11px;height:11px;border-radius:50%;background:#2b2f37}
.lp-url{margin-left:14px;font-size:12px;color:var(--color-muted-foreground);
  background:rgba(255,255,255,.04);padding:4px 12px;border-radius:6px}
.lp-store{padding:22px}
.lp-store-head{display:flex;align-items:center;gap:11px;padding-bottom:18px;margin-bottom:18px;
  border-bottom:1px solid var(--color-border)}
.lp-store-logo{width:30px;height:30px;border-radius:7px;background:var(--amber);color:#140a02;
  display:grid;place-items:center;font-weight:800;font-size:12px}
.lp-store-name{font-weight:700;font-size:15px}
.lp-store-cta{margin-left:auto;font-size:11px;font-weight:700;color:#140a02;
  background:var(--amber2);padding:6px 12px;border-radius:999px}
.lp-store-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.lp-card{border:1px solid var(--color-border);border-radius:11px;overflow:hidden;
  background:color-mix(in srgb, var(--color-card) 70%, #000)}
.lp-card-img{aspect-ratio:4/3}
.lp-img-0{background:linear-gradient(135deg,#3a3f4a,#1b1e25)}
.lp-img-1{background:linear-gradient(135deg,#7a3410,#2a1408)}
.lp-img-2{background:linear-gradient(135deg,#2d4456,#13202a)}
.lp-card-body{padding:11px}
.lp-card-line{height:8px;width:70%;border-radius:4px;background:rgba(255,255,255,.16)}
.lp-card-price{margin-top:9px;font-weight:800;font-size:14px;color:var(--amber2)}
.lp-mock-floor{position:absolute;left:50%;bottom:-60px;width:80%;height:120px;
  transform:translateX(-50%);background:radial-gradient(ellipse at center,color-mix(in srgb, var(--amber) 16%, transparent),transparent 70%);
  filter:blur(20px);z-index:1}
@media(max-width:620px){.lp-store-grid{grid-template-columns:1fr 1fr}.lp-card:last-child{display:none}}

/* strip */
.lp-strip{border-block:1px solid var(--color-border);background:rgba(255,255,255,.015)}
.lp-strip-in{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;padding:34px 24px}
.lp-stat{text-align:center}
.lp-stat-a{display:block;font-size:clamp(28px,4vw,40px);line-height:1;font-weight:400}
.lp-stat-b{display:block;margin-top:8px;font-size:13px;color:var(--color-muted-foreground);text-wrap:pretty}
@media(max-width:620px){.lp-strip-in{grid-template-columns:1fr 1fr;gap:28px}}

/* seções */
.lp-sec{padding:96px 0;position:relative}
.lp-sec-alt{background:linear-gradient(180deg,rgba(255,255,255,.018),transparent)}
.lp-kicker{font-size:12px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--amber)}
.lp-h2{margin:16px 0 0;font-size:clamp(30px,4.6vw,52px);line-height:1.02;font-weight:400;
  letter-spacing:-.02em;text-transform:uppercase;max-width:18ch;text-wrap:balance}
.lp-lead{margin:18px 0 0;max-width:560px;color:var(--color-muted-foreground);font-size:17px;line-height:1.55;text-wrap:pretty}

/* steps */
.lp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:54px}
.lp-step{border-top:1px solid var(--color-border);padding-top:26px}
.lp-step-n{font-size:46px;color:var(--amber);line-height:1;font-weight:400}
.lp-step-t{margin:18px 0 0;font-size:21px;font-weight:700;text-wrap:balance}
.lp-step-d{margin:10px 0 0;color:var(--color-muted-foreground);line-height:1.55;font-size:15px;text-wrap:pretty}
@media(max-width:760px){.lp-steps{grid-template-columns:1fr;gap:8px}}

/* templates */
.lp-tpl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:48px}
.lp-tpl{border:1px solid var(--color-border);border-radius:14px;overflow:hidden;background:var(--color-card);
  transition:transform .2s,border-color .2s}
.lp-tpl:hover{transform:translateY(-5px);border-color:color-mix(in srgb, var(--amber) 40%, transparent)}
.lp-tpl-prev{aspect-ratio:16/10;padding:16px;display:flex;flex-direction:column;gap:9px;position:relative;overflow:hidden}
.lp-tpl-bar{height:14px;width:48%;border-radius:4px;background:rgba(255,255,255,.22)}
.lp-tpl-blk{flex:1;border-radius:8px;background:rgba(255,255,255,.06)}
.lp-tpl-0{background:linear-gradient(160deg,#1c1f26,#15171c)}
.lp-tpl-1{background:linear-gradient(160deg,#102031,#0c1620)}
.lp-tpl-1 .lp-tpl-bar{background:var(--amber)}
.lp-tpl-2{background:linear-gradient(160deg,#06070a,#000)}
.lp-tpl-2 .lp-tpl-blk{background:rgba(255,177,77,.14)}
.lp-tpl-3{background:linear-gradient(160deg,#1d1f22,#101113)}
.lp-tpl-3 .lp-tpl-bar{width:30%}
.lp-tpl-4{background:linear-gradient(160deg,#2a1505,#120a03)}
.lp-tpl-4 .lp-tpl-bar{background:var(--amber);transform:skewX(-12deg)}
.lp-tpl-5{background:linear-gradient(160deg,#222428,#141517)}
.lp-tpl-5 .lp-tpl-blk:first-of-type{flex:2}
.lp-tpl-meta{display:flex;align-items:baseline;justify-content:space-between;
  padding:15px 17px;border-top:1px solid var(--color-border)}
.lp-tpl-name{font-weight:700;font-size:15px}
.lp-tpl-vibe{font-size:12px;color:var(--color-muted-foreground);text-wrap:pretty}
@media(max-width:760px){.lp-tpl-grid{grid-template-columns:1fr 1fr;gap:14px}}
@media(max-width:480px){.lp-tpl-grid{grid-template-columns:1fr}}

/* features */
.lp-feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:48px;
  background:var(--color-border);border:1px solid var(--color-border);border-radius:16px;overflow:hidden}
.lp-feat{background:var(--color-background);padding:32px 28px;transition:background .2s}
.lp-feat:hover{background:var(--color-card)}
.lp-feat-mark{display:block;width:24px;height:24px;border-radius:6px;
  background:linear-gradient(135deg,var(--amber),var(--amber2));
  box-shadow:0 0 18px -4px var(--amber)}
.lp-feat-k{margin:18px 0 0;font-size:18px;font-weight:700;text-wrap:balance}
.lp-feat-d{margin:9px 0 0;color:var(--color-muted-foreground);line-height:1.55;font-size:14px;text-wrap:pretty}
@media(max-width:760px){.lp-feat-grid{grid-template-columns:1fr}}

/* planos */
.lp-plans{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:54px;max-width:840px}
.lp-plan{position:relative;border:1px solid var(--color-border);border-radius:20px;padding:32px;
  background:var(--color-card);display:flex;flex-direction:column}
.lp-plan-pro{border-color:color-mix(in srgb, var(--amber) 55%, transparent);
  background:linear-gradient(180deg,color-mix(in srgb, var(--amber) 7%, var(--color-card)),var(--color-card));
  box-shadow:0 30px 80px -40px color-mix(in srgb, var(--amber) 50%, transparent)}
.lp-plan-badge{position:absolute;top:-12px;right:26px;text-transform:uppercase;letter-spacing:.04em}
.lp-plan-head{display:flex;align-items:center;justify-content:space-between}
.lp-plan-name{font-size:20px;font-weight:800}
.lp-plan-tag{font-size:12px;color:var(--color-muted-foreground)}
.lp-price{display:flex;align-items:baseline;gap:2px;margin:22px 0 4px}
.lp-price-cur{font-size:20px;color:var(--color-muted-foreground);margin-right:4px}
.lp-price-val{font-size:62px;line-height:.9;font-weight:400}
.lp-price-cents{font-size:26px}
.lp-price-per{font-size:14px;color:var(--color-muted-foreground);margin-left:6px}
.lp-plan-list{list-style:none;margin:22px 0 0;padding:0;display:flex;flex-direction:column;gap:13px}
.lp-plan-list li{position:relative;padding-left:28px;font-size:14.5px;color:var(--color-foreground);line-height:1.4;text-wrap:pretty}
.lp-plan-list li::before{content:"";position:absolute;left:0;top:3px;width:16px;height:16px;
  border-radius:50%;background:color-mix(in srgb, var(--amber) 18%, transparent);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M4 8.5l2.5 2.5L12 5' stroke='%23ff9d3c' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")}
.lp-plan-btn{width:100%;margin-top:26px;border-radius:999px}
@media(max-width:680px){.lp-plans{grid-template-columns:1fr}}

/* faq (shadcn Accordion) */
.lp-faq-wrap{max-width:760px}
.lp-faq{margin-top:44px}
.lp-faq-trigger{font-size:17px;font-weight:600;padding-block:22px}
.lp-faq-content{color:var(--color-muted-foreground);line-height:1.6;max-width:62ch;text-wrap:pretty}

/* cta final */
.lp-final{position:relative;padding:120px 0;text-align:center;overflow:hidden;
  border-top:1px solid var(--color-border)}
.lp-headlights-2{top:auto;bottom:-40%;opacity:.8}
.lp-final-in{position:relative;display:flex;flex-direction:column;align-items:center}
.lp-final-h{font-size:clamp(34px,6vw,72px);line-height:.96;text-transform:uppercase;font-weight:400;
  letter-spacing:-.02em;margin:0 0 36px;max-width:18ch;text-wrap:balance}
.lp-final-note{margin-top:18px;font-size:13px;color:var(--color-muted-foreground)}

/* footer */
.lp-footer{border-top:1px solid var(--color-border);padding:30px 0}
.lp-footer-in{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.lp-footer-c{font-size:13px;color:var(--color-muted-foreground)}
.lp-footer-links{display:flex;gap:22px;font-size:14px;color:var(--color-muted-foreground)}
.lp-footer-links a:hover{color:var(--color-foreground)}

/* motion */
.lp-rise{opacity:0;transform:translateY(22px);animation:lp-rise .7s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes lp-rise{to{opacity:1;transform:none}}
@keyframes lp-pulse{0%,100%{opacity:.85}50%{opacity:1}}
@media(prefers-reduced-motion:reduce){.lp-rise{animation:none;opacity:1;transform:none}
  .lp-headlights{animation:none}}
`;
