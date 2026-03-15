import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ───────────────────── CSS ───────────────────── */
const CSS = `
/* ── Reset & Base ── */
.lp {
  --gold: #F5C518;
  --amber: #E8A000;
  --bg: #07070B;
  --surface: #0E0E14;
  --card: #15151C;
  --border: #1E1E28;
  --text: #EDEDE9;
  --muted: #6E6E7A;
  font-family: 'Outfit', system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
.lp h1,.lp h2,.lp h3,.lp h4,.lp h5 {
  font-family: 'Urbanist', system-ui, sans-serif;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* ── Grain ── */
.lp-grain {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 999;
  opacity: 0.022; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ── Reveal ── */
.lp .rv { opacity:0; transform:translateY(36px); transition: opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }
.lp .rv.show { opacity:1; transform:translateY(0); }
.lp .rv.d1{transition-delay:60ms} .lp .rv.d2{transition-delay:120ms}
.lp .rv.d3{transition-delay:180ms} .lp .rv.d4{transition-delay:240ms}
.lp .rv.d5{transition-delay:300ms} .lp .rv.d6{transition-delay:360ms}

/* ── Keyframes ── */
@keyframes lp-drift {
  0%,100%{transform:translate(0,0) scale(1)}
  33%{transform:translate(4%,-3%) scale(1.03)}
  66%{transform:translate(-3%,2%) scale(.97)}
}
@keyframes lp-float {
  0%,100%{transform:perspective(1200px) rotateY(-5deg) rotateX(3deg) translateY(0)}
  50%{transform:perspective(1200px) rotateY(-5deg) rotateX(3deg) translateY(-14px)}
}
@keyframes lp-shimmer { 0%{left:-100%} 100%{left:200%} }
@keyframes lp-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }

/* ── Gold button ── */
.lp .btn-gold {
  background: linear-gradient(135deg, var(--gold), var(--amber));
  color: #0A0A0A; font-weight: 700; position: relative;
  overflow: hidden; cursor: pointer; border: none;
  text-decoration: none; display: inline-flex;
  align-items: center; justify-content: center;
  border-radius: 9999px; transition: transform .2s, box-shadow .2s;
}
.lp .btn-gold:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(245,197,24,.25); }
.lp .btn-gold::after {
  content:''; position:absolute; top:0; left:-100%;
  width:50%; height:100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent);
  animation: lp-shimmer 3.5s ease-in-out infinite;
}

/* ── Ghost button ── */
.lp .btn-ghost {
  border: 1px solid var(--border); color: var(--text);
  border-radius: 9999px; cursor: pointer;
  text-decoration: none; display: inline-flex;
  align-items: center; justify-content: center;
  transition: border-color .3s, background .3s;
  background: transparent;
}
.lp .btn-ghost:hover { border-color: rgba(245,197,24,.35); background: rgba(245,197,24,.04); }

/* ── Feature card ── */
.lp .feat-card {
  transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s, border-color .35s;
}
.lp .feat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 28px 50px rgba(0,0,0,.3);
  border-color: rgba(245,197,24,.22) !important;
}

/* ── Gold text ── */
.lp .gold-text {
  background: linear-gradient(135deg, #F5C518, #FF8C00);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Nav blur ── */
.lp .nav-scrolled {
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  background: rgba(7,7,11,.88) !important;
  border-bottom: 1px solid var(--border);
}

/* ── Dashboard float ── */
.lp .mock-float { animation: lp-float 7s ease-in-out infinite; }

/* ── Pricing popular ── */
.lp .plan-pop {
  border-color: var(--gold) !important;
  background: linear-gradient(180deg, rgba(245,197,24,.05) 0%, transparent 35%);
}

/* ── Template card ── */
.lp .tmpl-card { transition: transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s; }
.lp .tmpl-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 30px 60px rgba(0,0,0,.35); }

/* ── Section offset ── */
.lp section[id] { scroll-margin-top: 80px; }

/* ── Scrollbar ── */
.lp::-webkit-scrollbar { width:5px }
.lp::-webkit-scrollbar-track { background:var(--bg) }
.lp::-webkit-scrollbar-thumb { background:var(--border); border-radius:99px }

/* ── Step connector ── */
.lp .step-line {
  position: absolute; top: 28px; left: calc(50% + 28px);
  width: calc(100% - 56px); height: 2px;
  background: linear-gradient(90deg, var(--gold), var(--border));
  opacity: .3;
}
`;

/* ───────────────── Features Data ────────────────── */
const FEATURES = [
  {
    title: 'Gestão de Estoque',
    desc: 'Cadastre veículos com fotos, especificações e preços. Controle status, destaques e organize todo seu inventário.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"
        />
      </svg>
    ),
  },
  {
    title: 'Vitrine Online',
    desc: 'Escolha entre 3 templates profissionais e tenha sua landing page personalizada no ar em minutos.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.466.732-3.558"
        />
      </svg>
    ),
  },
  {
    title: 'Captação de Leads',
    desc: 'Formulários inteligentes na sua vitrine. Receba propostas e contatos com notificações em tempo real.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
    ),
  },
  {
    title: 'Controle Financeiro',
    desc: 'Acompanhe margem de lucro, fluxo de caixa e comissões de vendedores em dashboards completos.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
        />
      </svg>
    ),
  },
  {
    title: 'Gestão de Equipe',
    desc: 'Crie perfis de vendedores, gerentes e proprietários. Defina permissões e acompanhe desempenho.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Marketplaces',
    desc: 'Publique seus veículos no OLX, Webmotors e iCarros com poucos cliques. Alcance mais compradores.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
        />
      </svg>
    ),
  },
];

/* ───────────────── Pricing Data ────────────────── */
const PLANS = [
  {
    name: 'Starter',
    price: '97',
    desc: 'Para lojas que estão começando no digital.',
    popular: false,
    items: [
      'Até 30 veículos',
      '1 usuário',
      'Template Classic',
      'Captação de leads',
      'Suporte por e-mail',
    ],
  },
  {
    name: 'Profissional',
    price: '197',
    desc: 'Para lojas que querem crescer e vender mais.',
    popular: true,
    items: [
      'Até 100 veículos',
      '5 usuários',
      'Todos os templates',
      'Relatórios financeiros',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Enterprise',
    price: '397',
    desc: 'Para operações de grande porte.',
    popular: false,
    items: [
      'Veículos ilimitados',
      'Usuários ilimitados',
      'Integração Marketplaces',
      'API personalizada',
      'Gerente de conta dedicado',
    ],
  },
];

/* ═══════════════ COMPONENT ═══════════════ */
export const ProductLandingPage: React.FC = () => {
  const lpRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  /* ── Load Google Fonts ── */
  useEffect(() => {
    const id = 'lp-gfonts';
    if (!document.getElementById(id)) {
      const pre1 = document.createElement('link');
      pre1.rel = 'preconnect';
      pre1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(pre1);
      const pre2 = document.createElement('link');
      pre2.rel = 'preconnect';
      pre2.href = 'https://fonts.gstatic.com';
      pre2.crossOrigin = 'anonymous';
      document.head.appendChild(pre2);
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  /* ── Scroll listener ── */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* ── Intersection Observer for reveal ── */
  useEffect(() => {
    if (!lpRef.current) return;
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('show');
          }
        }),
      { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
    );
    lpRef.current.querySelectorAll('.rv').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <>
      <style>{CSS}</style>
      <div ref={lpRef} className="lp min-h-screen relative">
        <div className="lp-grain" />

        {/* ╔═══════════════════════════════════════╗
            ║            NAVIGATION                 ║
            ╚═══════════════════════════════════════╝ */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'nav-scrolled' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
                <defs>
                  <linearGradient id="nav-logo-g" x1="0" y1="0" x2="36" y2="36">
                    <stop offset="0%" stopColor="#F5C518" />
                    <stop offset="100%" stopColor="#E8A000" />
                  </linearGradient>
                </defs>
                <rect
                  x="2"
                  y="2"
                  width="32"
                  height="32"
                  rx="10"
                  fill="#0E0E14"
                  stroke="url(#nav-logo-g)"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 24a9 9 0 0112.73-12.73"
                  stroke="url(#nav-logo-g)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M18 18l4.5-4.5"
                  stroke="url(#nav-logo-g)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="18" cy="18" r="2" fill="url(#nav-logo-g)" />
              </svg>
              <span
                className="text-[17px] font-semibold tracking-tight"
                style={{ fontFamily: 'Urbanist' }}
              >
                estoque<span className="gold-text">.autos</span>
              </span>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#6E6E7A]">
              <button
                onClick={() => scrollTo('features')}
                className="hover:text-[#EDEDE9] transition-colors cursor-pointer"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => scrollTo('templates')}
                className="hover:text-[#EDEDE9] transition-colors cursor-pointer"
              >
                Templates
              </button>
              <button
                onClick={() => scrollTo('pricing')}
                className="hover:text-[#EDEDE9] transition-colors cursor-pointer"
              >
                Preços
              </button>
            </div>

            {/* CTA + mobile toggle */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:block text-[13px] font-medium text-[#6E6E7A] hover:text-[#EDEDE9] transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/signup"
                className="btn-gold px-5 py-2.5 text-[13px] font-bold rounded-full"
              >
                Começar Grátis
              </Link>
              {/* Hamburger */}
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[#1E1E28] text-[#6E6E7A] hover:text-[#EDEDE9] transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  {mobileMenu ? (
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenu && (
            <div className="md:hidden border-t border-[#1E1E28] bg-[#07070B]/95 backdrop-blur-xl px-5 pb-5 pt-3 flex flex-col gap-3">
              <button
                onClick={() => scrollTo('features')}
                className="text-left text-sm py-2 text-[#6E6E7A] hover:text-[#EDEDE9] cursor-pointer"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => scrollTo('templates')}
                className="text-left text-sm py-2 text-[#6E6E7A] hover:text-[#EDEDE9] cursor-pointer"
              >
                Templates
              </button>
              <button
                onClick={() => scrollTo('pricing')}
                className="text-left text-sm py-2 text-[#6E6E7A] hover:text-[#EDEDE9] cursor-pointer"
              >
                Preços
              </button>
              <Link to="/login" className="text-sm py-2 text-[#6E6E7A] hover:text-[#EDEDE9]">
                Entrar
              </Link>
            </div>
          )}
        </nav>

        {/* ╔═══════════════════════════════════════╗
            ║              HERO                     ║
            ╚═══════════════════════════════════════╝ */}
        <section className="relative min-h-screen flex items-center pt-20 pb-12 overflow-hidden">
          {/* BG effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -top-[30%] -right-[15%] w-[900px] h-[900px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(245,197,24,.18) 0%, transparent 65%)',
                animation: 'lp-drift 18s ease-in-out infinite',
              }}
            />
            <div
              className="absolute -bottom-[20%] -left-[15%] w-[700px] h-[700px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(232,160,0,.12) 0%, transparent 65%)',
                animation: 'lp-drift 14s ease-in-out infinite reverse',
              }}
            />
            {/* Grid */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(245,197,24,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,.03) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
              }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full">
            <div className="grid lg:grid-cols-[1fr,1.1fr] gap-12 lg:gap-16 items-center">
              {/* Text */}
              <div>
                <div className="rv inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1E1E28] bg-[#0E0E14]/70 text-xs text-[#6E6E7A] mb-8 backdrop-blur-sm">
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400"
                    style={{ animation: 'lp-pulse 2s ease-in-out infinite' }}
                  />
                  +500 lojas já usam a plataforma
                </div>

                <h1 className="rv d1 text-[clamp(2.6rem,6vw,4.5rem)] font-extrabold leading-[1.06] tracking-tight mb-7">
                  Sua loja de <br className="hidden sm:block" />
                  veículos no <span className="gold-text">mundo digital.</span>
                </h1>

                <p className="rv d2 text-lg sm:text-xl text-[#6E6E7A] leading-relaxed mb-10 max-w-[520px]">
                  Gerencie estoque, crie sua vitrine online e receba leads automaticamente. A
                  plataforma mais completa do Brasil para lojas de veículos.
                </p>

                <div className="rv d3 flex flex-wrap gap-4">
                  <Link to="/signup" className="btn-gold px-8 py-4 text-[15px] font-bold gap-2">
                    Criar conta grátis
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={() => scrollTo('templates')}
                    className="btn-ghost px-8 py-4 text-[15px] font-medium gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6.5 4L12 8L6.5 12V4Z" fill="currentColor" />
                    </svg>
                    Ver templates
                  </button>
                </div>

                {/* Trust badges */}
                <div className="rv d4 mt-12 flex items-center gap-6 text-xs text-[#6E6E7A]">
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-emerald-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Teste grátis 14 dias
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-emerald-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Sem cartão de crédito
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-emerald-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Cancele quando quiser
                  </span>
                </div>
              </div>

              {/* Dashboard Mockup */}
              <div className="rv d4 hidden lg:block">
                <div className="mock-float" style={{ transformStyle: 'preserve-3d' }}>
                  <div className="rounded-2xl border border-[#1E1E28] bg-[#0C0C12] shadow-2xl shadow-black/50 overflow-hidden">
                    {/* Title bar */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E1E28] bg-[#0A0A10]">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                      </div>
                      <div className="flex-1 mx-6 h-6 rounded-md bg-[#15151C] border border-[#1E1E28] flex items-center justify-center">
                        <span className="text-[10px] text-[#6E6E7A]">
                          app.estoque.autos/dashboard
                        </span>
                      </div>
                    </div>

                    <div className="flex">
                      {/* Sidebar */}
                      <div className="w-[180px] border-r border-[#1E1E28] bg-[#0A0A10] p-3 flex flex-col gap-1">
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#F5C518]/10 text-[#F5C518]">
                          <div className="w-4 h-4 rounded bg-[#F5C518]/20" />
                          <span className="text-[11px] font-semibold">Painel</span>
                        </div>
                        {['Veículos', 'Leads', 'Vendas', 'Financeiro', 'Equipe'].map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#6E6E7A] hover:bg-[#15151C] transition-colors"
                          >
                            <div className="w-4 h-4 rounded bg-[#1E1E28]" />
                            <span className="text-[11px]">{item}</span>
                          </div>
                        ))}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 p-5 min-h-[320px]">
                        <div className="text-[11px] text-[#6E6E7A] mb-1">Bem-vindo de volta 👋</div>
                        <div
                          className="text-[14px] font-bold mb-5"
                          style={{ fontFamily: 'Urbanist' }}
                        >
                          Dashboard
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-5">
                          {[
                            { label: 'Veículos', value: '42', color: '#F5C518' },
                            { label: 'Faturamento', value: 'R$ 2.1M', color: '#22C55E' },
                            { label: 'Leads / mês', value: '156', color: '#3B82F6' },
                          ].map((s) => (
                            <div
                              key={s.label}
                              className="rounded-xl border border-[#1E1E28] bg-[#0E0E14] p-3"
                            >
                              <div
                                className="text-[18px] font-bold"
                                style={{ color: s.color, fontFamily: 'Urbanist' }}
                              >
                                {s.value}
                              </div>
                              <div className="text-[10px] text-[#6E6E7A] mt-0.5">{s.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Vehicle list */}
                        <div
                          className="text-[11px] font-semibold mb-3"
                          style={{ fontFamily: 'Urbanist' }}
                        >
                          Últimos veículos
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { name: 'Honda Civic', price: 'R$ 89.900', color: '#2563EB' },
                            { name: 'Toyota Corolla', price: 'R$ 125.000', color: '#7C3AED' },
                            { name: 'VW T-Cross', price: 'R$ 98.500', color: '#059669' },
                          ].map((v) => (
                            <div
                              key={v.name}
                              className="rounded-lg border border-[#1E1E28] bg-[#0E0E14] overflow-hidden"
                            >
                              <div
                                className="h-[52px] w-full"
                                style={{
                                  background: `linear-gradient(135deg, ${v.color}30, ${v.color}10)`,
                                }}
                              >
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg
                                    className="w-6 h-6"
                                    style={{ color: `${v.color}80` }}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={1}
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                  </svg>
                                </div>
                              </div>
                              <div className="p-2">
                                <div className="text-[10px] font-semibold truncate">{v.name}</div>
                                <div className="text-[10px] font-bold" style={{ color: '#F5C518' }}>
                                  {v.price}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ╔═══════════════════════════════════════╗
            ║            STATS BAR                  ║
            ╚═══════════════════════════════════════╝ */}
        <section className="relative z-10 border-y border-[#1E1E28] bg-[#0A0A10]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
            <div className="rv grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
              {[
                { value: '500+', label: 'Lojas Ativas' },
                { value: '15.000+', label: 'Veículos Cadastrados' },
                { value: '50.000+', label: 'Leads Gerados' },
                { value: '99.9%', label: 'Uptime' },
              ].map((s, i) => (
                <div key={s.label} className={`rv d${i + 1}`}>
                  <div
                    className="text-2xl sm:text-3xl font-extrabold gold-text"
                    style={{ fontFamily: 'Urbanist' }}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs sm:text-sm text-[#6E6E7A] mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ╔═══════════════════════════════════════╗
            ║           FEATURES                    ║
            ╚═══════════════════════════════════════╝ */}
        <section id="features" className="py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="text-center mb-16">
              <div className="rv inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1E1E28] bg-[#0E0E14]/70 text-xs text-[#6E6E7A] mb-6">
                Funcionalidades
              </div>
              <h2 className="rv d1 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5">
                Tudo que sua loja <span className="gold-text">precisa</span>
              </h2>
              <p className="rv d2 text-[#6E6E7A] text-lg max-w-2xl mx-auto leading-relaxed">
                Do cadastro de veículos à captação de clientes, uma plataforma completa para
                gerenciar e escalar sua operação.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={`rv d${i + 1} feat-card rounded-2xl border border-[#1E1E28] bg-[#0E0E14] p-7`}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#F5C518]/10 text-[#F5C518] flex items-center justify-center mb-5">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Urbanist' }}>
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#6E6E7A] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ╔═══════════════════════════════════════╗
            ║           TEMPLATES                   ║
            ╚═══════════════════════════════════════╝ */}
        <section id="templates" className="py-24 sm:py-32 bg-[#0A0A10]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="text-center mb-16">
              <div className="rv inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1E1E28] bg-[#0E0E14]/70 text-xs text-[#6E6E7A] mb-6">
                Templates
              </div>
              <h2 className="rv d1 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5">
                3 vitrines profissionais, <span className="gold-text">zero código</span>
              </h2>
              <p className="rv d2 text-[#6E6E7A] text-lg max-w-2xl mx-auto leading-relaxed">
                Escolha o visual que combina com sua loja. Personalize cores, logo e textos em
                poucos cliques.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Classic */}
              <div className="rv d1 tmpl-card rounded-2xl border border-[#1E1E28] bg-[#0E0E14] overflow-hidden">
                <div className="p-3 border-b border-[#1E1E28] flex items-center gap-1.5">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
                    <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
                    <div className="w-2 h-2 rounded-full bg-[#28C840]" />
                  </div>
                  <span className="text-[9px] text-[#6E6E7A] ml-2">sualoja.estoque.autos</span>
                </div>
                <div className="bg-white p-4 min-h-[200px]">
                  {/* Mini classic template */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gray-200" />
                      <div className="h-2 w-20 rounded bg-gray-300" />
                    </div>
                    <div className="h-2 w-12 rounded bg-gray-200" />
                  </div>
                  <div className="h-2 w-32 rounded bg-gray-200 mb-4" />
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="rounded-lg overflow-hidden">
                        <div className="aspect-[4/3] bg-gray-100" />
                        <div className="py-1.5">
                          <div className="h-1.5 w-full rounded bg-gray-200 mb-1" />
                          <div className="h-1.5 w-2/3 rounded bg-gray-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base mb-1" style={{ fontFamily: 'Urbanist' }}>
                    Classic
                  </h3>
                  <p className="text-xs text-[#6E6E7A]">
                    Clean e profissional. Layout organizado com fundo claro.
                  </p>
                </div>
              </div>

              {/* Modern */}
              <div className="rv d2 tmpl-card rounded-2xl border border-[#1E1E28] bg-[#0E0E14] overflow-hidden">
                <div className="p-3 border-b border-[#1E1E28] flex items-center gap-1.5">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
                    <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
                    <div className="w-2 h-2 rounded-full bg-[#28C840]" />
                  </div>
                  <span className="text-[9px] text-[#6E6E7A] ml-2">sualoja.estoque.autos</span>
                </div>
                <div className="bg-[#0F172A] p-4 min-h-[200px]">
                  {/* Mini modern template */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-blue-900/50" />
                      <div className="h-2 w-20 rounded bg-blue-800/40" />
                    </div>
                    <div className="h-2 w-12 rounded bg-blue-900/30" />
                  </div>
                  <div className="h-12 rounded-lg bg-gradient-to-r from-blue-600/20 to-violet-600/20 mb-3 flex items-center px-3">
                    <div className="h-2 w-28 rounded bg-white/30" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="rounded-lg overflow-hidden bg-slate-800/50">
                        <div className="aspect-[4/3] bg-slate-700/40" />
                        <div className="py-1.5 px-1">
                          <div className="h-1.5 w-full rounded bg-slate-600/40 mb-1" />
                          <div className="h-1.5 w-2/3 rounded bg-blue-500/30" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base mb-1" style={{ fontFamily: 'Urbanist' }}>
                    Modern
                  </h3>
                  <p className="text-xs text-[#6E6E7A]">
                    Ousado e contemporâneo. Design escuro com tipografia impactante.
                  </p>
                </div>
              </div>

              {/* Premium */}
              <div className="rv d3 tmpl-card rounded-2xl border border-[#1E1E28] bg-[#0E0E14] overflow-hidden">
                <div className="p-3 border-b border-[#1E1E28] flex items-center gap-1.5">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
                    <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
                    <div className="w-2 h-2 rounded-full bg-[#28C840]" />
                  </div>
                  <span className="text-[9px] text-[#6E6E7A] ml-2">sualoja.estoque.autos</span>
                </div>
                <div className="bg-[#0C0C0E] p-4 min-h-[200px]">
                  {/* Mini premium template */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#F5C518]/20 border border-[#F5C518]/30" />
                      <div className="h-2 w-20 rounded bg-[#F5C518]/20" />
                    </div>
                    <div className="h-2 w-12 rounded bg-[#F5C518]/10" />
                  </div>
                  <div className="h-12 rounded-lg bg-gradient-to-r from-[#F5C518]/10 to-[#E8A000]/5 mb-3 border border-[#F5C518]/10 flex items-center px-3">
                    <div className="h-2 w-28 rounded bg-[#F5C518]/25" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="rounded-lg overflow-hidden border border-[#F5C518]/10"
                      >
                        <div className="aspect-[4/3] bg-[#F5C518]/5" />
                        <div className="py-1.5 px-1">
                          <div className="h-1.5 w-full rounded bg-white/10 mb-1" />
                          <div className="h-1.5 w-2/3 rounded bg-[#F5C518]/20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base mb-1" style={{ fontFamily: 'Urbanist' }}>
                    Premium
                  </h3>
                  <p className="text-xs text-[#6E6E7A]">
                    Luxo e sofisticação. Tons dourados para uma experiência exclusiva.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ╔═══════════════════════════════════════╗
            ║         HOW IT WORKS                  ║
            ╚═══════════════════════════════════════╝ */}
        <section className="py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="text-center mb-16">
              <h2 className="rv text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5">
                Online em <span className="gold-text">3 passos</span>
              </h2>
              <p className="rv d1 text-[#6E6E7A] text-lg max-w-xl mx-auto">
                Do cadastro à primeira venda, em poucos minutos.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
              {[
                {
                  num: '01',
                  title: 'Crie sua conta',
                  desc: 'Cadastro rápido, sem burocracia. Comece seu teste grátis de 14 dias em segundos.',
                },
                {
                  num: '02',
                  title: 'Monte seu estoque',
                  desc: 'Adicione veículos com fotos, detalhes e preços. Organize por categorias e destaques.',
                },
                {
                  num: '03',
                  title: 'Comece a vender',
                  desc: 'Sua vitrine online já está no ar. Receba leads e feche negócios pelo WhatsApp.',
                },
              ].map((step, i) => (
                <div key={step.num} className={`rv d${i + 1} text-center relative`}>
                  {/* Connector line */}
                  {i < 2 && <div className="step-line hidden md:block" />}
                  <div className="w-14 h-14 rounded-2xl bg-[#F5C518]/10 border border-[#F5C518]/20 flex items-center justify-center mx-auto mb-5">
                    <span
                      className="text-lg font-extrabold gold-text"
                      style={{ fontFamily: 'Urbanist' }}
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Urbanist' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#6E6E7A] leading-relaxed max-w-xs mx-auto">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ╔═══════════════════════════════════════╗
            ║           PRICING                     ║
            ╚═══════════════════════════════════════╝ */}
        <section id="pricing" className="py-24 sm:py-32 bg-[#0A0A10]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="text-center mb-16">
              <div className="rv inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1E1E28] bg-[#0E0E14]/70 text-xs text-[#6E6E7A] mb-6">
                Planos
              </div>
              <h2 className="rv d1 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5">
                Invista no <span className="gold-text">crescimento</span>
              </h2>
              <p className="rv d2 text-[#6E6E7A] text-lg max-w-xl mx-auto">
                Planos que cabem no bolso de qualquer loja. Comece grátis, escale quando precisar.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PLANS.map((plan, i) => (
                <div
                  key={plan.name}
                  className={`rv d${i + 1} rounded-2xl border border-[#1E1E28] bg-[#0E0E14] p-7 flex flex-col ${plan.popular ? 'plan-pop relative' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 rounded-full text-[11px] font-bold bg-[#F5C518] text-[#0A0A0A] uppercase tracking-wider">
                        Mais Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Urbanist' }}>
                      {plan.name}
                    </h3>
                    <p className="text-xs text-[#6E6E7A]">{plan.desc}</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-[#6E6E7A]">R$</span>
                      <span className="text-4xl font-extrabold" style={{ fontFamily: 'Urbanist' }}>
                        {plan.price}
                      </span>
                      <span className="text-sm text-[#6E6E7A]">/mês</span>
                    </div>
                  </div>

                  <ul className="flex-1 mb-8 space-y-3">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm">
                        <svg
                          className="w-4 h-4 text-[#F5C518] flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-[#BBBBC0]">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/signup"
                    className={
                      plan.popular
                        ? 'btn-gold px-6 py-3.5 text-sm font-bold w-full text-center'
                        : 'btn-ghost px-6 py-3.5 text-sm font-semibold w-full text-center'
                    }
                  >
                    Começar agora
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ╔═══════════════════════════════════════╗
            ║         INTEGRATIONS                  ║
            ╚═══════════════════════════════════════╝ */}
        <section className="py-20 border-y border-[#1E1E28]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 text-center">
            <p className="rv text-sm text-[#6E6E7A] mb-10 uppercase tracking-widest font-medium">
              Integração com os maiores marketplaces
            </p>
            <div className="rv d1 flex items-center justify-center gap-10 sm:gap-16 flex-wrap">
              {/* OLX */}
              <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 48 20" className="h-8" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="10" r="7.5" stroke="#6E0AD6" strokeWidth="2.5" fill="none" />
                  <path
                    d="M20 2.5v15h9"
                    stroke="#6E0AD6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M33 2.5l6 7.5-6 7.5M45 2.5l-6 7.5 6 7.5"
                    stroke="#6E0AD6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>

              {/* Webmotors */}
              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#E01A2B" strokeWidth="2" />
                  <path
                    d="M7 12h10M12 7v10"
                    stroke="#E01A2B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  className="text-lg font-extrabold tracking-tight"
                  style={{ color: '#E01A2B', fontFamily: 'Urbanist' }}
                >
                  webmotors
                </span>
              </div>

              {/* iCarros */}
              <div className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
                <span
                  className="text-xl tracking-tight"
                  style={{ color: '#0077CC', fontFamily: 'Urbanist' }}
                >
                  <span className="font-normal">i</span>
                  <span className="font-extrabold">Carros</span>
                </span>
              </div>

              {/* Mercado Livre */}
              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 28 28" className="w-7 h-7 flex-shrink-0" fill="none">
                  <circle cx="14" cy="14" r="13" fill="#FFE600" />
                  <path
                    d="M7.5 18c0-3.5 2.9-6.5 6.5-6.5s6.5 3 6.5 6.5"
                    stroke="#2D3277"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M9.5 16.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"
                    stroke="#2D3277"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <span
                  className="text-lg font-bold tracking-tight"
                  style={{ color: '#2D3277', fontFamily: 'Urbanist' }}
                >
                  mercado livre
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ╔═══════════════════════════════════════╗
            ║           FINAL CTA                   ║
            ╚═══════════════════════════════════════╝ */}
        <section className="py-24 sm:py-32 relative overflow-hidden">
          {/* BG glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(245,197,24,.08) 0%, transparent 60%)',
              }}
            />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
            <h2 className="rv text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
              Pronto para transformar
              <br />
              <span className="gold-text">sua loja?</span>
            </h2>
            <p className="rv d1 text-lg text-[#6E6E7A] mb-10 max-w-lg mx-auto leading-relaxed">
              Junte-se a mais de 500 lojistas que já vendem mais com o Estoque.autos. Comece seu
              teste grátis hoje.
            </p>
            <div className="rv d2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="btn-gold px-10 py-4 text-base font-bold gap-2">
                Começar grátis — 14 dias
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <button
                onClick={() => scrollTo('pricing')}
                className="btn-ghost px-8 py-4 text-base font-medium"
              >
                Ver planos
              </button>
            </div>
          </div>
        </section>

        {/* ╔═══════════════════════════════════════╗
            ║            FOOTER                     ║
            ╚═══════════════════════════════════════╝ */}
        <footer className="border-t border-[#1E1E28] bg-[#07070B]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
              {/* Brand */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
                    <defs>
                      <linearGradient id="ft-logo-g" x1="0" y1="0" x2="36" y2="36">
                        <stop offset="0%" stopColor="#F5C518" />
                        <stop offset="100%" stopColor="#E8A000" />
                      </linearGradient>
                    </defs>
                    <rect
                      x="2"
                      y="2"
                      width="32"
                      height="32"
                      rx="10"
                      fill="#0E0E14"
                      stroke="url(#ft-logo-g)"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M10 24a9 9 0 0112.73-12.73"
                      stroke="url(#ft-logo-g)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 18l4.5-4.5"
                      stroke="url(#ft-logo-g)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="18" cy="18" r="2" fill="url(#ft-logo-g)" />
                  </svg>
                  <span
                    className="text-[15px] font-semibold tracking-tight"
                    style={{ fontFamily: 'Urbanist' }}
                  >
                    estoque<span className="gold-text">.autos</span>
                  </span>
                </div>
                <p className="text-sm text-[#6E6E7A] leading-relaxed max-w-xs">
                  A plataforma mais completa do Brasil para gestão de lojas de veículos.
                </p>
              </div>

              {/* Produto */}
              <div>
                <h4
                  className="text-xs font-bold uppercase tracking-widest text-[#6E6E7A] mb-4"
                  style={{ fontFamily: 'Urbanist' }}
                >
                  Produto
                </h4>
                <ul className="space-y-2.5">
                  {['Funcionalidades', 'Templates', 'Preços', 'Integrações'].map((link) => (
                    <li key={link}>
                      <button
                        onClick={() =>
                          scrollTo(
                            link.toLowerCase() === 'funcionalidades'
                              ? 'features'
                              : link.toLowerCase() === 'preços'
                                ? 'pricing'
                                : 'templates'
                          )
                        }
                        className="text-sm text-[#6E6E7A] hover:text-[#EDEDE9] transition-colors cursor-pointer"
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recursos */}
              <div>
                <h4
                  className="text-xs font-bold uppercase tracking-widest text-[#6E6E7A] mb-4"
                  style={{ fontFamily: 'Urbanist' }}
                >
                  Recursos
                </h4>
                <ul className="space-y-2.5">
                  {['Central de Ajuda', 'Blog', 'API Docs', 'Status'].map((link) => (
                    <li key={link}>
                      <span className="text-sm text-[#6E6E7A]">{link}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Empresa */}
              <div>
                <h4
                  className="text-xs font-bold uppercase tracking-widest text-[#6E6E7A] mb-4"
                  style={{ fontFamily: 'Urbanist' }}
                >
                  Empresa
                </h4>
                <ul className="space-y-2.5">
                  {['Sobre', 'Contato', 'Termos de Uso', 'Privacidade'].map((link) => (
                    <li key={link}>
                      <span className="text-sm text-[#6E6E7A]">{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-8 border-t border-[#1E1E28] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[#6E6E7A]">
                &copy; {new Date().getFullYear()} Estoque.autos. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-4">
                {/* Social icons placeholder */}
                {['instagram', 'linkedin', 'youtube'].map((social) => (
                  <div
                    key={social}
                    className="w-8 h-8 rounded-lg border border-[#1E1E28] bg-[#0E0E14] flex items-center justify-center text-[#6E6E7A] hover:text-[#EDEDE9] hover:border-[#F5C518]/20 transition-all cursor-pointer"
                  >
                    <span className="text-[10px] font-bold uppercase">{social[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
