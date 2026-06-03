import Link from "next/link";
import { Anton, Archivo } from "next/font/google";

const display = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});
const sans = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const TEMPLATES = [
  { name: "Clássico", vibe: "Tradicional e confiável" },
  { name: "Moderno", vibe: "Tecnológico e arrojado" },
  { name: "Premium", vibe: "Alto padrão" },
  { name: "Minimal", vibe: "Sofisticado e discreto" },
  { name: "Esportivo", vibe: "Energia e velocidade" },
  { name: "Vitrine", vibe: "Visual em primeiro lugar" },
];

const FEATURES = [
  { k: "Site pronto", d: "6 templates profissionais. Escolha, ajuste a cor e suba o logo." },
  { k: "Lead em cada carro", d: "Formulário de proposta e botão de WhatsApp que viram contato no seu painel." },
  { k: "Estoque fácil", d: "Cadastre fotos, preço e ficha. Publique ou reserve com um clique." },
  { k: "WhatsApp direto", d: "O cliente clica e fala com você. Cada clique vira um lead registrado." },
  { k: "Achado no Google", d: "Cada anúncio com SEO, link de compartilhamento e sitemap automáticos." },
  { k: "Sem programador", d: "Você cuida da loja. O site se cuida sozinho." },
];

export default function HomePage() {
  return (
    <div
      className={`lp ${display.variable} ${sans.variable}`}
      style={{ fontFamily: "var(--font-archivo), sans-serif" }}
    >
      <style>{css}</style>

      {/* grão cinematográfico */}
      <div className="lp-grain" aria-hidden />

      {/* ───────────── NAV ───────────── */}
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <span className="lp-logo">
            estoque<span className="lp-amber">.autos</span>
          </span>
          <nav className="lp-nav-links">
            <a href="#como">Como funciona</a>
            <a href="#templates">Templates</a>
            <a href="#precos">Preços</a>
          </nav>
          <div className="lp-nav-cta">
            <Link href="/login" className="lp-link">
              Entrar
            </Link>
            <Link href="/cadastro" className="lp-btn lp-btn-amber">
              Criar loja grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ───────────── HERO ───────────── */}
      <section className="lp-hero">
        <div className="lp-headlights" aria-hidden />
        <div className="lp-wrap lp-hero-in">
          <p className="lp-eyebrow lp-rise" style={{ animationDelay: "0ms" }}>
            <span className="lp-dot" /> Plataforma para lojas de veículos
          </p>

          <h1 className="lp-h1">
            <span className="lp-rise" style={{ animationDelay: "60ms" }}>
              O SITE DA SUA
            </span>
            <span className="lp-rise" style={{ animationDelay: "140ms" }}>
              LOJA DE CARROS,
            </span>
            <span
              className="lp-rise lp-amber lp-glowtext"
              style={{ animationDelay: "220ms" }}
            >
              PRONTO EM MINUTOS.
            </span>
          </h1>

          <p className="lp-sub lp-rise" style={{ animationDelay: "320ms" }}>
            Crie a conta, cadastre o estoque e tenha uma vitrine profissional no
            ar. Escolha entre 6 templates, suas cores e seu logo — e cada carro
            já vem com formulário de proposta e botão de WhatsApp.
          </p>

          <div className="lp-hero-cta lp-rise" style={{ animationDelay: "400ms" }}>
            <Link href="/cadastro" className="lp-btn lp-btn-amber lp-btn-lg">
              Começar agora <span className="lp-arrow">→</span>
            </Link>
            <a href="#precos" className="lp-btn lp-btn-ghost lp-btn-lg">
              Ver planos
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
            ["1 clique", "para publicar"],
            ["WhatsApp", "leads direto"],
            ["0", "linhas de código"],
          ].map(([a, b]) => (
            <div className="lp-stat" key={b}>
              <span className="lp-stat-a">{a}</span>
              <span className="lp-stat-b">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── COMO FUNCIONA ───────────── */}
      <section id="como" className="lp-sec">
        <div className="lp-wrap">
          <p className="lp-kicker">Como funciona</p>
          <h2 className="lp-h2">Três passos. Nenhum técnico.</h2>
          <div className="lp-steps">
            {[
              ["01", "Crie sua conta", "Nome da loja, endereço do site e pronto — leva menos de um minuto."],
              ["02", "Monte a vitrine", "Escolha o template, a cor e suba o logo. Cadastre seus carros com fotos."],
              ["03", "Receba contatos", "Seu site entra no ar. Cada proposta e clique no WhatsApp vira um lead."],
            ].map(([n, t, d]) => (
              <div className="lp-step" key={n}>
                <span className="lp-step-n">{n}</span>
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
          <h2 className="lp-h2">
            Seis estilos. <span className="lp-amber">Uma loja só sua.</span>
          </h2>
          <p className="lp-lead">
            Troque de template quando quiser — sem perder nada. A cor principal e
            o logo se aplicam a todos, na hora.
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
          <h2 className="lp-h2">Feito para vender carro.</h2>
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

      {/* ───────────── PREÇOS ───────────── */}
      <section id="precos" className="lp-sec lp-sec-alt">
        <div className="lp-wrap">
          <p className="lp-kicker">Planos</p>
          <h2 className="lp-h2">Preço de assinatura, não de agência.</h2>
          <p className="lp-lead">
            Sem fidelidade, sem taxa de setup. Comece hoje e cancele quando
            quiser.
          </p>

          <div className="lp-plans">
            {/* Básico */}
            <div className="lp-plan">
              <div className="lp-plan-head">
                <span className="lp-plan-name">Básico</span>
                <span className="lp-plan-tag">Para começar</span>
              </div>
              <div className="lp-price">
                <span className="lp-price-cur">R$</span>
                <span className="lp-price-val">19</span>
                <span className="lp-price-cents">,90</span>
                <span className="lp-price-per">/mês</span>
              </div>
              <ul className="lp-plan-list">
                <li>Site pronto com os 6 templates</li>
                <li>Cor principal + logo da loja</li>
                <li>
                  <strong>Até 20 carros</strong> ativos
                </li>
                <li>Leads por proposta e WhatsApp</li>
                <li>
                  Endereço <em>estoque.autos/sua-loja</em>
                </li>
              </ul>
              <Link href="/cadastro" className="lp-btn lp-btn-ghost lp-btn-block">
                Começar no Básico
              </Link>
            </div>

            {/* Pro */}
            <div className="lp-plan lp-plan-pro">
              <span className="lp-plan-badge">Mais escolhido</span>
              <div className="lp-plan-head">
                <span className="lp-plan-name">Pro</span>
                <span className="lp-plan-tag">Para crescer</span>
              </div>
              <div className="lp-price">
                <span className="lp-price-cur">R$</span>
                <span className="lp-price-val">49</span>
                <span className="lp-price-cents">,90</span>
                <span className="lp-price-per">/mês</span>
              </div>
              <ul className="lp-plan-list">
                <li>Tudo do Básico, e mais:</li>
                <li>
                  <strong>Domínio próprio</strong> (sualoja.com.br)
                </li>
                <li>
                  <strong>Até 60 carros</strong> ativos
                </li>
                <li>Destaque nos resultados de busca</li>
                <li>Suporte prioritário</li>
              </ul>
              <Link href="/cadastro" className="lp-btn lp-btn-amber lp-btn-block">
                Assinar o Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="lp-sec">
        <div className="lp-wrap lp-faq-wrap">
          <p className="lp-kicker">Dúvidas</p>
          <h2 className="lp-h2">Antes de começar.</h2>
          <div className="lp-faq">
            {[
              ["Preciso saber programar?", "Não. Você cadastra os carros e escolhe o visual; o site fica pronto sozinho."],
              ["Quanto tempo leva pra ficar no ar?", "Minutos. Você cria a conta, escolhe o template, sobe o logo e já publica."],
              ["Posso trocar de template depois?", "Sim, quando quiser, sem perder os carros nem as configurações."],
              ["Como funciona o domínio próprio?", "No plano Pro você conecta o seu domínio (ex.: sualoja.com.br) à sua loja."],
              ["O que conta como carro ativo?", "Veículos publicados na vitrine. Vendidos e arquivados não contam no limite."],
            ].map(([q, a]) => (
              <details className="lp-faq-item" key={q}>
                <summary>
                  {q}
                  <span className="lp-faq-plus" aria-hidden>
                    +
                  </span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA FINAL ───────────── */}
      <section className="lp-final">
        <div className="lp-headlights lp-headlights-2" aria-hidden />
        <div className="lp-wrap lp-final-in">
          <h2 className="lp-final-h">
            Sua vitrine pode estar
            <br />
            no ar <span className="lp-amber">hoje</span>.
          </h2>
          <Link href="/cadastro" className="lp-btn lp-btn-amber lp-btn-lg">
            Criar minha loja grátis <span className="lp-arrow">→</span>
          </Link>
          <p className="lp-final-note">Sem cartão para começar.</p>
        </div>
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-in">
          <span className="lp-logo">
            estoque<span className="lp-amber">.autos</span>
          </span>
          <span className="lp-footer-c">
            © {new Date().getFullYear()} estoque.autos · feito para lojistas
          </span>
          <div className="lp-footer-links">
            <Link href="/login">Entrar</Link>
            <Link href="/cadastro">Criar loja</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const css = `
.lp{
  --ink:#f4f1ea; --dim:#9a9d97; --bg:#0a0b0d; --surf:#15171c; --surf2:#1b1e25;
  --amber:#ff7a1a; --amber2:#ffb14d; --line:rgba(255,255,255,.09);
  background:var(--bg); color:var(--ink); min-height:100dvh; overflow-x:hidden;
  position:relative; letter-spacing:-0.005em;
}
.lp-amber{color:var(--amber)}
.lp ::selection{background:var(--amber);color:#10100c}
.lp a{color:inherit;text-decoration:none}
.lp-wrap{max-width:1140px;margin:0 auto;padding:0 24px}
.lp-h1,.lp-h2,.lp-final-h,.lp-stat-a,.lp-price-val,.lp-step-n{
  font-family:var(--font-display),sans-serif;font-weight:400}

/* grão */
.lp-grain{position:fixed;inset:0;background-image:${GRAIN};background-size:160px;
  opacity:.05;mix-blend-mode:overlay;pointer-events:none;z-index:60}

/* nav */
.lp-nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);
  background:rgba(10,11,13,.6);border-bottom:1px solid var(--line)}
.lp-nav-in{display:flex;align-items:center;justify-content:space-between;height:68px}
.lp-logo{font-weight:800;font-size:18px;letter-spacing:-.03em}
.lp-nav-links{display:flex;gap:30px;font-size:14px;color:var(--dim)}
.lp-nav-links a:hover{color:var(--ink)}
.lp-nav-cta{display:flex;align-items:center;gap:18px}
.lp-link{font-size:14px;color:var(--dim)}.lp-link:hover{color:var(--ink)}
@media(max-width:760px){.lp-nav-links{display:none}}

/* botões */
.lp-btn{display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:14px;
  padding:11px 18px;border-radius:999px;transition:transform .18s,background .18s,box-shadow .18s;
  border:1px solid transparent;white-space:nowrap}
.lp-btn:hover{transform:translateY(-2px)}
.lp-btn-amber{background:var(--amber);color:#140a02;box-shadow:0 8px 30px -8px rgba(255,122,26,.6)}
.lp-btn-amber:hover{background:var(--amber2);box-shadow:0 12px 40px -8px rgba(255,122,26,.75)}
.lp-btn-ghost{border-color:var(--line);color:var(--ink);background:rgba(255,255,255,.02)}
.lp-btn-ghost:hover{background:rgba(255,255,255,.06)}
.lp-btn-lg{font-size:15px;padding:15px 26px}
.lp-btn-block{display:flex;justify-content:center;width:100%;margin-top:26px}
.lp-arrow{transition:transform .2s}.lp-btn:hover .lp-arrow{transform:translateX(4px)}

/* hero */
.lp-hero{position:relative;padding:90px 0 40px;overflow:hidden}
.lp-headlights{position:absolute;left:50%;top:18%;width:1100px;height:620px;
  transform:translateX(-50%);pointer-events:none;
  background:
    radial-gradient(closest-side at 38% 50%, rgba(255,122,26,.34), transparent 70%),
    radial-gradient(closest-side at 62% 50%, rgba(255,150,60,.26), transparent 70%);
  filter:blur(8px);animation:lp-pulse 6s ease-in-out infinite}
.lp-hero-in{position:relative;text-align:center}
.lp-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:13px;color:var(--dim);
  border:1px solid var(--line);padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.02)}
.lp-dot{width:7px;height:7px;border-radius:50%;background:var(--amber);box-shadow:0 0 10px var(--amber)}
.lp-h1{margin:26px 0 0;line-height:.92;letter-spacing:-.02em;
  font-size:clamp(44px,8.2vw,108px);text-transform:uppercase}
.lp-h1 span{display:block}
.lp-glowtext{text-shadow:0 0 38px rgba(255,122,26,.45)}
.lp-sub{max-width:640px;margin:30px auto 0;font-size:clamp(16px,2vw,19px);
  line-height:1.55;color:var(--dim)}
.lp-hero-cta{display:flex;gap:14px;justify-content:center;margin-top:36px;flex-wrap:wrap}

/* mockup */
.lp-mock{position:relative;margin:70px auto 0;max-width:920px}
.lp-browser{border:1px solid var(--line);border-radius:16px;overflow:hidden;
  background:var(--surf);box-shadow:0 50px 120px -40px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.03);
  position:relative;z-index:2}
.lp-browser-bar{display:flex;align-items:center;gap:8px;padding:13px 16px;
  background:#0f1116;border-bottom:1px solid var(--line)}
.lp-dotr{width:11px;height:11px;border-radius:50%;background:#2b2f37}
.lp-url{margin-left:14px;font-size:12px;color:var(--dim);background:rgba(255,255,255,.04);
  padding:4px 12px;border-radius:6px}
.lp-store{padding:22px}
.lp-store-head{display:flex;align-items:center;gap:11px;padding-bottom:18px;margin-bottom:18px;
  border-bottom:1px solid var(--line)}
.lp-store-logo{width:30px;height:30px;border-radius:7px;background:var(--amber);color:#140a02;
  display:grid;place-items:center;font-weight:800;font-size:12px}
.lp-store-name{font-weight:700;font-size:15px}
.lp-store-cta{margin-left:auto;font-size:11px;font-weight:700;color:#140a02;
  background:var(--amber2);padding:6px 12px;border-radius:999px}
.lp-store-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.lp-card{border:1px solid var(--line);border-radius:11px;overflow:hidden;background:#0f1116}
.lp-card-img{aspect-ratio:4/3}
.lp-img-0{background:linear-gradient(135deg,#3a3f4a,#1b1e25)}
.lp-img-1{background:linear-gradient(135deg,#7a3410,#2a1408)}
.lp-img-2{background:linear-gradient(135deg,#2d4456,#13202a)}
.lp-card-body{padding:11px}
.lp-card-line{height:8px;width:70%;border-radius:4px;background:rgba(255,255,255,.16)}
.lp-card-price{margin-top:9px;font-weight:800;font-size:14px;color:var(--amber2)}
.lp-mock-floor{position:absolute;left:50%;bottom:-60px;width:80%;height:120px;
  transform:translateX(-50%);background:radial-gradient(ellipse at center,rgba(255,122,26,.16),transparent 70%);
  filter:blur(20px);z-index:1}
@media(max-width:620px){.lp-store-grid{grid-template-columns:1fr 1fr}.lp-card:last-child{display:none}}

/* strip */
.lp-strip{border-block:1px solid var(--line);background:rgba(255,255,255,.015)}
.lp-strip-in{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;padding:34px 24px}
.lp-stat{text-align:center}
.lp-stat-a{display:block;font-size:clamp(28px,4vw,40px);line-height:1;color:var(--ink)}
.lp-stat-b{display:block;margin-top:8px;font-size:13px;color:var(--dim)}
@media(max-width:620px){.lp-strip-in{grid-template-columns:1fr 1fr;gap:28px}}

/* seções */
.lp-sec{padding:96px 0;position:relative}
.lp-sec-alt{background:linear-gradient(180deg,rgba(255,255,255,.018),transparent)}
.lp-kicker{font-size:12px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--amber)}
.lp-h2{margin:16px 0 0;font-size:clamp(30px,4.6vw,52px);line-height:1.02;
  letter-spacing:-.02em;text-transform:uppercase;max-width:16ch}
.lp-lead{margin:18px 0 0;max-width:560px;color:var(--dim);font-size:17px;line-height:1.55}

/* steps */
.lp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:54px}
.lp-step{border-top:1px solid var(--line);padding-top:26px}
.lp-step-n{font-size:46px;color:var(--amber);line-height:1}
.lp-step-t{margin:18px 0 0;font-size:21px;font-weight:700}
.lp-step-d{margin:10px 0 0;color:var(--dim);line-height:1.55;font-size:15px}
@media(max-width:760px){.lp-steps{grid-template-columns:1fr;gap:8px}}

/* templates */
.lp-tpl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:48px}
.lp-tpl{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--surf);
  transition:transform .2s,border-color .2s}
.lp-tpl:hover{transform:translateY(-5px);border-color:rgba(255,122,26,.4)}
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
  padding:15px 17px;border-top:1px solid var(--line)}
.lp-tpl-name{font-weight:700;font-size:15px}
.lp-tpl-vibe{font-size:12px;color:var(--dim)}
@media(max-width:760px){.lp-tpl-grid{grid-template-columns:1fr 1fr;gap:14px}}
@media(max-width:480px){.lp-tpl-grid{grid-template-columns:1fr}}

/* features */
.lp-feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:48px;
  background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.lp-feat{background:var(--bg);padding:32px 28px;transition:background .2s}
.lp-feat:hover{background:var(--surf)}
.lp-feat-mark{display:block;width:24px;height:24px;border-radius:6px;
  background:linear-gradient(135deg,var(--amber),var(--amber2));
  box-shadow:0 0 18px -4px var(--amber)}
.lp-feat-k{margin:18px 0 0;font-size:18px;font-weight:700}
.lp-feat-d{margin:9px 0 0;color:var(--dim);line-height:1.55;font-size:14px}
@media(max-width:760px){.lp-feat-grid{grid-template-columns:1fr}}

/* preços */
.lp-plans{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:54px;max-width:840px}
.lp-plan{position:relative;border:1px solid var(--line);border-radius:20px;padding:32px;
  background:var(--surf);display:flex;flex-direction:column}
.lp-plan-pro{border-color:rgba(255,122,26,.55);background:linear-gradient(180deg,rgba(255,122,26,.07),var(--surf));
  box-shadow:0 30px 80px -40px rgba(255,122,26,.5)}
.lp-plan-badge{position:absolute;top:-12px;right:26px;background:var(--amber);color:#140a02;
  font-size:11px;font-weight:800;letter-spacing:.04em;padding:5px 13px;border-radius:999px;text-transform:uppercase}
.lp-plan-head{display:flex;align-items:center;justify-content:space-between}
.lp-plan-name{font-size:20px;font-weight:800}
.lp-plan-tag{font-size:12px;color:var(--dim)}
.lp-price{display:flex;align-items:baseline;gap:2px;margin:22px 0 4px}
.lp-price-cur{font-size:20px;color:var(--dim);margin-right:4px}
.lp-price-val{font-size:62px;line-height:.9}
.lp-price-cents{font-size:26px;color:var(--ink)}
.lp-price-per{font-size:14px;color:var(--dim);margin-left:6px}
.lp-plan-list{list-style:none;margin:22px 0 0;padding:0;display:flex;flex-direction:column;gap:13px}
.lp-plan-list li{position:relative;padding-left:28px;font-size:14.5px;color:#cfd2cc;line-height:1.4}
.lp-plan-list li::before{content:"";position:absolute;left:0;top:3px;width:16px;height:16px;
  border-radius:50%;background:rgba(255,122,26,.16);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M4 8.5l2.5 2.5L12 5' stroke='%23ff9d3c' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")}
.lp-plan-list strong{color:#fff;font-weight:700}
.lp-plan-list em{color:var(--amber2);font-style:normal}
@media(max-width:680px){.lp-plans{grid-template-columns:1fr}}

/* faq */
.lp-faq-wrap{max-width:760px}
.lp-faq{margin-top:44px;border-top:1px solid var(--line)}
.lp-faq-item{border-bottom:1px solid var(--line)}
.lp-faq-item summary{cursor:pointer;list-style:none;padding:22px 4px;display:flex;
  align-items:center;justify-content:space-between;font-size:17px;font-weight:600}
.lp-faq-item summary::-webkit-details-marker{display:none}
.lp-faq-plus{color:var(--amber);font-size:24px;transition:transform .2s;font-weight:300}
.lp-faq-item[open] .lp-faq-plus{transform:rotate(45deg)}
.lp-faq-item p{margin:0 4px 22px;color:var(--dim);line-height:1.6;max-width:60ch}

/* cta final */
.lp-final{position:relative;padding:120px 0;text-align:center;overflow:hidden;
  border-top:1px solid var(--line)}
.lp-headlights-2{top:auto;bottom:-40%;opacity:.8}
.lp-final-in{position:relative}
.lp-final-h{font-size:clamp(34px,6vw,72px);line-height:.96;text-transform:uppercase;
  letter-spacing:-.02em;margin:0 0 36px}
.lp-final-note{margin-top:18px;font-size:13px;color:var(--dim)}

/* footer */
.lp-footer{border-top:1px solid var(--line);padding:30px 0}
.lp-footer-in{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.lp-footer-c{font-size:13px;color:var(--dim)}
.lp-footer-links{display:flex;gap:22px;font-size:14px;color:var(--dim)}
.lp-footer-links a:hover{color:var(--ink)}

/* motion */
.lp-rise{opacity:0;transform:translateY(22px);animation:lp-rise .7s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes lp-rise{to{opacity:1;transform:none}}
@keyframes lp-pulse{0%,100%{opacity:.85}50%{opacity:1}}
@media(prefers-reduced-motion:reduce){.lp-rise{animation:none;opacity:1;transform:none}
  .lp-headlights{animation:none}}
`;
