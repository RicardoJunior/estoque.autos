import Link from "next/link";
import { Logo } from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.estoque.autos";

/**
 * Chrome compartilhado por /blog e /ajuda — usa o TEMA GLOBAL dark/âmbar do app
 * (não é vitrine). Nav + footer no mesmo espírito da landing, mais o CSS de
 * tipografia `.ct-prose` para os artigos. Todo o CSS vive aqui (escopado por
 * `.ct`), sem tocar em globals.css.
 */
export function ContentShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: "blog" | "ajuda";
}) {
  return (
    <div className="ct">
      <style>{css}</style>
      <div className="ct-grain" aria-hidden />

      <header className="ct-nav">
        <div className="ct-wrap ct-nav-in">
          <Link href="/" aria-label="estoque.autos">
            <Logo size={22} />
          </Link>
          <nav className="ct-nav-links">
            <Link href="/blog" data-active={active === "blog"}>
              Blog
            </Link>
            <Link href="/ajuda" data-active={active === "ajuda"}>
              Central de ajuda
            </Link>
          </nav>
          <div className="ct-nav-cta">
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Entrar
            </Link>
            <Link
              href="/#planos"
              className={buttonVariants({ size: "sm" })}
            >
              Começar
            </Link>
          </div>
        </div>
      </header>

      <main className="ct-main">{children}</main>

      <footer className="ct-footer">
        <div className="ct-wrap ct-footer-in">
          <Logo size={20} />
          <span className="ct-footer-c">
            © 2026 estoque.autos · feito para lojistas
          </span>
          <div className="ct-footer-links">
            <Link href="/blog">Blog</Link>
            <Link href="/ajuda">Ajuda</Link>
            <Link href="/login">Entrar</Link>
            <a href={`${APP_URL}/#planos`}>Planos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const css = `
.ct{
  --amber:var(--color-primary); --amber2:#ffb14d;
  background:var(--color-background); color:var(--color-foreground);
  min-height:100dvh; position:relative; letter-spacing:-0.005em;
  display:flex; flex-direction:column;
}
.ct a{color:inherit;text-decoration:none}
.ct ::selection{background:var(--amber);color:#10100c}
.ct-wrap{max-width:1140px;margin:0 auto;padding:0 24px;width:100%}
.ct-grain{position:fixed;inset:0;background-image:${GRAIN};background-size:160px;
  opacity:.05;mix-blend-mode:overlay;pointer-events:none;z-index:60}

/* nav */
.ct-nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);
  background:color-mix(in srgb, var(--color-background) 70%, transparent);
  border-bottom:1px solid var(--color-border)}
.ct-nav-in{display:flex;align-items:center;justify-content:space-between;height:68px}
.ct-nav-links{display:flex;gap:30px;font-size:14px;color:var(--color-muted-foreground)}
.ct-nav-links a:hover{color:var(--color-foreground)}
.ct-nav-links a[data-active="true"]{color:var(--color-foreground)}
.ct-nav-cta{display:flex;align-items:center;gap:10px}
@media(max-width:640px){.ct-nav-links{display:none}}

.ct-main{flex:1}

/* footer */
.ct-footer{border-top:1px solid var(--color-border);padding:30px 0;margin-top:80px}
.ct-footer-in{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.ct-footer-c{font-size:13px;color:var(--color-muted-foreground)}
.ct-footer-links{display:flex;gap:22px;font-size:14px;color:var(--color-muted-foreground)}
.ct-footer-links a:hover{color:var(--color-foreground)}

/* ── hub (lista) ── */
.ct-hub{padding:72px 0 0}
.ct-kicker{font-size:12px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--amber)}
.ct-h1{margin:14px 0 0;font-size:clamp(34px,5.4vw,60px);line-height:1.02;font-weight:400;
  letter-spacing:-.02em;text-transform:uppercase;max-width:20ch;text-wrap:balance;
  font-family:var(--font-display),ui-sans-serif,system-ui,sans-serif}
.ct-intro{margin:18px 0 0;max-width:620px;color:var(--color-muted-foreground);
  font-size:18px;line-height:1.55;text-wrap:pretty}

/* grupo por categoria */
.ct-group{margin-top:56px}
.ct-group-h{font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;
  color:var(--color-muted-foreground);padding-bottom:16px;border-bottom:1px solid var(--color-border)}

/* grid de cards */
.ct-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:24px}
@media(max-width:720px){.ct-grid{grid-template-columns:1fr}}

.ct-card{display:flex;flex-direction:column;gap:10px;border:1px solid var(--color-border);
  border-radius:16px;padding:24px;background:var(--color-card);
  transition:transform .2s,border-color .2s}
.ct-card:hover{transform:translateY(-4px);
  border-color:color-mix(in srgb, var(--amber) 40%, transparent)}
.ct-card-cat{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--amber)}
.ct-card-t{font-size:20px;font-weight:700;line-height:1.2;text-wrap:balance}
.ct-card-d{color:var(--color-muted-foreground);font-size:14.5px;line-height:1.55;text-wrap:pretty}
.ct-card-meta{margin-top:auto;display:flex;align-items:center;gap:10px;font-size:13px;
  color:var(--color-muted-foreground)}
.ct-card-arrow{margin-left:auto;color:var(--amber);transition:transform .2s}
.ct-card:hover .ct-card-arrow{transform:translateX(4px)}

/* lista compacta (ajuda) */
.ct-list{margin-top:20px;border:1px solid var(--color-border);border-radius:16px;
  overflow:hidden;background:var(--color-card)}
.ct-list-item{display:flex;align-items:center;gap:14px;padding:18px 22px;
  border-bottom:1px solid var(--color-border);transition:background .15s}
.ct-list-item:last-child{border-bottom:none}
.ct-list-item:hover{background:var(--color-accent)}
.ct-list-t{font-weight:600;font-size:15.5px}
.ct-list-d{font-size:13px;color:var(--color-muted-foreground);margin-top:3px;text-wrap:pretty}
.ct-list-arrow{margin-left:auto;color:var(--amber);flex-shrink:0;transition:transform .2s}
.ct-list-item:hover .ct-list-arrow{transform:translateX(4px)}

/* ── artigo ── */
.ct-article{padding:64px 0 0}
.ct-article-wrap{max-width:760px;margin:0 auto;padding:0 24px;width:100%}
.ct-back{display:inline-flex;align-items:center;gap:7px;font-size:14px;
  color:var(--color-muted-foreground);transition:color .15s}
.ct-back:hover{color:var(--amber)}
.ct-article-head{margin:28px 0 0}
.ct-article-cat{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--amber)}
.ct-article-meta{margin-top:14px;font-size:13.5px;color:var(--color-muted-foreground)}

/* tipografia do conteúdo MDX (.ct-prose) — dark legível */
.ct-prose{margin-top:8px;color:var(--color-foreground);font-size:17px;line-height:1.72}
.ct-prose > * + *{margin-top:1.15em}
.ct-prose h1{font-size:clamp(30px,4.6vw,46px);line-height:1.08;font-weight:400;
  letter-spacing:-.02em;text-transform:uppercase;margin:0 0 8px;text-wrap:balance;
  font-family:var(--font-display),ui-sans-serif,system-ui,sans-serif}
.ct-prose h2{font-size:27px;font-weight:700;line-height:1.2;margin-top:2em;
  letter-spacing:-.01em;scroll-margin-top:90px;text-wrap:balance}
.ct-prose h3{font-size:20px;font-weight:700;line-height:1.3;margin-top:1.6em;
  scroll-margin-top:90px;text-wrap:balance}
.ct-prose h2 + p,.ct-prose h3 + p{margin-top:.7em}
.ct-prose p{color:var(--color-foreground);text-wrap:pretty}
.ct-prose a{color:var(--amber);text-decoration:underline;text-underline-offset:3px;
  text-decoration-color:color-mix(in srgb, var(--amber) 45%, transparent)}
.ct-prose a:hover{text-decoration-color:var(--amber)}
.ct-prose strong{color:var(--color-foreground);font-weight:700}
.ct-prose ul,.ct-prose ol{padding-left:1.35em;display:flex;flex-direction:column;gap:.5em}
.ct-prose ul{list-style:none;padding-left:0}
.ct-prose ul > li{position:relative;padding-left:1.6em}
.ct-prose ul > li::before{content:"";position:absolute;left:.15em;top:.62em;width:7px;height:7px;
  border-radius:50%;background:var(--amber)}
.ct-prose ol{list-style:decimal;padding-left:1.5em}
.ct-prose ol > li{padding-left:.3em}
.ct-prose ol > li::marker{color:var(--amber);font-weight:700}
.ct-prose li > ul,.ct-prose li > ol{margin-top:.4em}
/* checklist (GFM task list) */
.ct-prose li.task-list-item,.ct-prose li:has(> input[type="checkbox"]){padding-left:1.7em}
.ct-prose li.task-list-item::before,.ct-prose li:has(> input[type="checkbox"])::before{display:none}
.ct-prose input[type="checkbox"]{margin-left:-1.5em;margin-right:.6em;accent-color:var(--amber);
  width:15px;height:15px;vertical-align:-2px}
.ct-prose blockquote{border-left:3px solid var(--amber);padding:4px 0 4px 20px;margin-left:0;
  color:var(--color-muted-foreground);font-style:normal;
  background:color-mix(in srgb, var(--amber) 6%, transparent);
  border-radius:0 8px 8px 0}
.ct-prose blockquote p{color:inherit}
.ct-prose code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.88em;
  background:var(--color-muted);padding:2px 6px;border-radius:6px;color:var(--amber2)}
.ct-prose pre{background:var(--color-muted);border:1px solid var(--color-border);
  border-radius:12px;padding:18px;overflow-x:auto;font-size:14px;line-height:1.6}
.ct-prose pre code{background:none;padding:0;color:var(--color-foreground);font-size:inherit}
.ct-prose hr{border:none;border-top:1px solid var(--color-border);margin:2.4em 0}
.ct-prose table{width:100%;border-collapse:collapse;font-size:15px;display:block;overflow-x:auto}
.ct-prose thead{border-bottom:2px solid var(--color-border)}
.ct-prose th{text-align:left;font-weight:700;padding:10px 14px;color:var(--color-foreground)}
.ct-prose td{padding:10px 14px;border-top:1px solid var(--color-border);
  color:var(--color-muted-foreground);vertical-align:top}
.ct-prose img{border-radius:14px;border:1px solid var(--color-border);height:auto;max-width:100%}
`;
