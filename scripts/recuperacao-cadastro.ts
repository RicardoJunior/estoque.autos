// ============================================================
// Recuperação de cadastro — acha quem começou a se cadastrar e
// parou no meio do funil, e manda UM e-mail de retomada por
// estágio (uma vez só na vida da conta).
//
// O funil é: signup → confirma e-mail → assina → cria a loja.
// Quem parou fica preso num destes três estágios:
//
//   nao_confirmou   conta criada, e-mail nunca confirmado
//   sem_assinatura  e-mail confirmado, nunca assinou
//   sem_loja        assinatura ATIVA e loja nunca criada  ← paga e não usa
//
// Roda fora do Worker (GitHub Actions ou manual):
//
//   npx tsx scripts/recuperacao-cadastro.ts                     # só diagnostica
//   npx tsx scripts/recuperacao-cadastro.ts --preview sem_loja  # HTML no stdout
//   npx tsx scripts/recuperacao-cadastro.ts --teste eu@dominio  # amostra p/ mim
//   npx tsx scripts/recuperacao-cadastro.ts --enviar --estagio sem_loja
//
// SEM --enviar nada sai: o padrão é listar. A trava de reenvio é a
// tabela signup_recovery_emails (PK user_id+stage) — só grava o que
// o Resend aceitou, então falha de envio volta na rodada seguinte.
//
// Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY + RESEND_API_KEY
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import {
  isSignupRecoveryStage,
  previewSignupRecoveryEmail,
  sendSignupRecoveryEmail,
  SIGNUP_RECOVERY_STAGES,
  type SignupRecoveryStage,
} from "../src/lib/email";
import { isBillingInterval, isPlanId, type BillingInterval } from "../src/lib/billing";
import { ACTIVE_SUBSCRIPTION_STATUSES, type PlanId } from "../src/lib/types";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // ausente (CI) — env já vem do ambiente
  }
}

// ── argumentos ──────────────────────────────────────────────
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const next = process.argv[i + 1];
  return next && !next.startsWith("--") ? next : "";
}
const has = (name: string) => process.argv.includes(`--${name}`);

const ENVIAR = has("enviar");
const TESTE = arg("teste") || null;
const PREVIEW = arg("preview");
/** só manda para quem parou há pelo menos N horas — quem cadastrou agora
 *  ainda pode estar com a aba aberta terminando o fluxo */
const MIN_HORAS = Number(arg("min-horas") ?? 24);
/** e no máximo há N dias: sem isso a primeira rodada dispara para o
 *  backlog inteiro de uma vez, que é exatamente como se queima domínio */
const MAX_DIAS = Number(arg("max-dias") ?? 30);
const LIMITE = Number(arg("limite") ?? 200);
const ESTAGIO = arg("estagio");
/** cupom de retomada (ex.: --cupom SUALOJA50). Só entra nos estágios
 *  anteriores ao pagamento — ver couponAppliesTo em lib/email. */
const CUPOM = arg("cupom") || null;
const CUPOM_TEXTO = arg("cupom-texto") || "50% de desconto no primeiro mês";
/** --cupom-todos força o cupom até em sem_loja (quem já assinou). */
const cupom = CUPOM
  ? { code: CUPOM, label: CUPOM_TEXTO, force: has("cupom-todos") }
  : undefined;
if (ESTAGIO && !isSignupRecoveryStage(ESTAGIO)) {
  console.error(`--estagio inválido. Use: ${SIGNUP_RECOVERY_STAGES.join(" | ")}`);
  process.exit(1);
}

const STAGE_LABEL: Record<SignupRecoveryStage, string> = {
  nao_confirmou: "não confirmou o e-mail",
  sem_assinatura: "confirmou e não assinou",
  sem_loja: "assinou e não criou a loja",
};
// ordem de disparo: quem já paga vem primeiro
const STAGE_ORDER: SignupRecoveryStage[] = ["sem_loja", "sem_assinatura", "nao_confirmou"];

// ── preview: não toca no banco nem no Resend ────────────────
if (PREVIEW !== undefined) {
  const stage = isSignupRecoveryStage(PREVIEW) ? PREVIEW : "sem_loja";
  const { subject, html } = previewSignupRecoveryEmail({
    to: "lojista@exemplo.com.br",
    name: "Carlos Andrade",
    stage,
    plan: "basico",
    interval: "mensal",
    coupon: cupom,
  });
  const out = `/tmp/recuperacao-${stage}.html`;
  writeFileSync(out, html);
  console.error(`assunto: ${subject}\narquivo:  ${out}`);
  process.exit(0);
}

if ((ENVIAR || TESTE) && !process.env.RESEND_API_KEY) {
  console.error("Defina RESEND_API_KEY para enviar.");
  process.exit(1);
}
// o .env.local de desenvolvimento aponta para localhost — um disparo
// real com ele manda todo mundo para um link morto
if ((ENVIAR || TESTE) && /localhost|127\.0\.0\.1/.test(process.env.NEXT_PUBLIC_APP_URL ?? "")) {
  console.error(
    `NEXT_PUBLIC_APP_URL=${process.env.NEXT_PUBLIC_APP_URL} — os links do e-mail sairiam para localhost.\n` +
      "Rode com NEXT_PUBLIC_APP_URL=https://estoque.autos npx tsx scripts/recuperacao-cadastro.ts --enviar",
  );
  process.exit(1);
}
/** Cliente service role — exigido só nos modos que leem o banco. */
function conectar() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY.");
    process.exit(1);
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Amostra de cada estágio para um endereço meu — não toca no banco. */
async function enviarTeste(to: string) {
  for (const stage of ESTAGIO ? [ESTAGIO as SignupRecoveryStage] : STAGE_ORDER) {
    const r = await sendSignupRecoveryEmail({
      to,
      name: arg("nome") || "Carlos",
      stage,
      plan: "basico",
      interval: "mensal",
      coupon: cupom,
    });
    console.log(`${r.ok ? "✓" : "✗"} ${stage} → ${to} ${r.error ?? ""}`);
    await new Promise((res) => setTimeout(res, 600));
  }
}

async function main() {
  const supabase = conectar();

  // ── coleta ──────────────────────────────────────────────────
  interface Candidate {
    userId: string;
    email: string;
    name: string;
    stage: SignupRecoveryStage;
    /** quando o cadastro efetivamente travou (base da janela de tempo) */
    since: Date;
    plan: PlanId;
    interval: BillingInterval;
  }

  async function listAllUsers() {
    const all: {
      id: string;
      email?: string;
      created_at: string;
      email_confirmed_at?: string | null;
      user_metadata: Record<string, unknown>;
    }[] = [];
    for (let page = 1; ; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      all.push(...(data.users as typeof all));
      if (data.users.length < 1000) return all;
    }
  }

  const [users, profilesRes, subsRes, sentRes] = await Promise.all([
    listAllUsers(),
    supabase.from("profiles").select("id, tenant_id, name"),
    supabase.from("subscriptions").select("user_id, status, created_at"),
    supabase.from("signup_recovery_emails").select("user_id, stage"),
  ]);
  for (const r of [profilesRes, subsRes]) {
    if (r.error) {
      console.error(r.error.message);
      process.exit(1);
    }
  }
  // a trava pode ainda não existir (migration não aplicada). Para
  // DIAGNOSTICAR isso não importa — só significa "ninguém foi avisado".
  // Para ENVIAR importa muito: sem ela não há como não repetir.
  if (sentRes.error) {
    if (ENVIAR) {
      console.error(
        `signup_recovery_emails indisponível (${sentRes.error.message}).\n` +
          "Aplique supabase/migrations/20260831000000_signup_recovery.sql antes de enviar.",
      );
      process.exit(1);
    }
    console.warn(`\n⚠ signup_recovery_emails indisponível — seguindo como se ninguém tivesse sido avisado.\n  (${sentRes.error.message})`);
  }

  const profiles = new Map(
    (profilesRes.data ?? []).map((p) => [p.id as string, p as { tenant_id: string | null; name: string }]),
  );
  const subs = new Map(
    (subsRes.data ?? []).map((s) => [s.user_id as string, s as { status: string; created_at: string }]),
  );
  const sent = new Set((sentRes.data ?? []).map((s) => `${s.user_id}:${s.stage}`));

  const agora = Date.now();
  const limiteRecente = agora - MIN_HORAS * 3600_000;
  const limiteAntigo = agora - MAX_DIAS * 86_400_000;

  const candidatos: Candidate[] = [];
  const ignorados = { ativos: 0, convidados: 0, jaAvisados: 0, foraDaJanela: 0, semEmail: 0 };

  for (const u of users) {
    if (!u.email) {
      ignorados.semEmail++;
      continue;
    }
    const profile = profiles.get(u.id);
    // já tem loja (dono ou membro de equipe): terminou o cadastro
    if (profile?.tenant_id) {
      ignorados.ativos++;
      continue;
    }
    // convidado que nunca aceitou: o fluxo dele é o e-mail de convite,
    // não este — mandar "escolha seu plano" para um vendedor é ruído
    if (typeof u.user_metadata?.invite_next === "string") {
      ignorados.convidados++;
      continue;
    }

    const sub = subs.get(u.id);
    const assinaturaAtiva =
      !!sub && (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(sub.status);

    const stage: SignupRecoveryStage = !u.email_confirmed_at
      ? "nao_confirmou"
      : assinaturaAtiva
        ? "sem_loja"
        : "sem_assinatura";

    // o relógio conta do momento em que travou: para quem já assinou,
    // isso é a data da assinatura, não a do cadastro
    const since = new Date(stage === "sem_loja" && sub ? sub.created_at : u.created_at);

    if (sent.has(`${u.id}:${stage}`)) {
      ignorados.jaAvisados++;
      continue;
    }
    const t = since.getTime();
    if (t > limiteRecente || t < limiteAntigo) {
      ignorados.foraDaJanela++;
      continue;
    }

    const meta = u.user_metadata ?? {};
    candidatos.push({
      userId: u.id,
      email: u.email,
      name: (profile?.name || String(meta.name ?? "")).trim(),
      stage,
      since,
      plan: isPlanId(meta.plano as string) ? (meta.plano as PlanId) : "basico",
      interval: isBillingInterval(meta.intervalo as string)
        ? (meta.intervalo as BillingInterval)
        : "mensal",
    });
  }

  // ── relatório ───────────────────────────────────────────────
  const dias = (d: Date) => Math.floor((agora - d.getTime()) / 86_400_000);
  const alvo = candidatos
    .filter((c) => !ESTAGIO || c.stage === ESTAGIO)
    .sort(
      (a, b) =>
        STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) ||
        a.since.getTime() - b.since.getTime(),
    )
    .slice(0, LIMITE);

  console.log(
    `\n${users.length} contas · janela: parou entre ${MIN_HORAS}h e ${MAX_DIAS} dias atrás` +
      (cupom ? ` · cupom ${cupom.code} (${cupom.label})` : "") +
      "\n",
  );
  for (const stage of STAGE_ORDER) {
    const n = candidatos.filter((c) => c.stage === stage).length;
    console.log(`  ${stage.padEnd(15)} ${String(n).padStart(4)}  ${STAGE_LABEL[stage]}`);
  }
  console.log(
    `\n  fora: ${ignorados.ativos} com loja · ${ignorados.jaAvisados} já avisados · ` +
      `${ignorados.foraDaJanela} fora da janela · ${ignorados.convidados} convidados` +
      (ignorados.semEmail ? ` · ${ignorados.semEmail} sem e-mail` : ""),
  );
  console.log(`\n→ ${alvo.length} e-mail(s) a enviar${ENVIAR ? "" : "  (simulação — use --enviar)"}\n`);
  for (const c of alvo.slice(0, ENVIAR ? alvo.length : 40)) {
    console.log(`  ${c.stage.padEnd(15)} ${c.email.padEnd(38)} há ${dias(c.since)}d`);
  }

  if (!ENVIAR || alvo.length === 0) process.exit(0);

  // ── disparo ─────────────────────────────────────────────────
  console.log("\n── enviando ──");
  let ok = 0;
  const falhas: string[] = [];
  for (const c of alvo) {
    const r = await sendSignupRecoveryEmail({
      to: c.email,
      name: c.name,
      stage: c.stage,
      plan: c.plan,
      interval: c.interval,
      coupon: cupom,
    });
    if (!r.ok) {
      falhas.push(`${c.email}: ${r.error}`);
      console.log(`  ✗ ${c.email} — ${r.error}`);
    } else {
      // grava DEPOIS do aceite: o que falhou volta na próxima rodada
      const { error } = await supabase.from("signup_recovery_emails").insert({
        user_id: c.userId,
        stage: c.stage,
        provider_id: r.id ?? null,
      });
      if (error) {
        // trava não gravou = risco de reenvio; alto o suficiente para acusar
        falhas.push(`${c.email}: enviado mas trava não gravou (${error.message})`);
        console.log(`  ⚠ ${c.email} — enviado, trava não gravou: ${error.message}`);
      } else {
        ok++;
        console.log(`  ✓ ${c.email} (${c.stage})`);
      }
    }
    // ritmo educado: o Resend limita ~2 req/s por conta
    await new Promise((res) => setTimeout(res, 600));
  }

  console.log(`\n${ok} enviado(s), ${falhas.length} falha(s)`);
  if (falhas.length) process.exitCode = 1;
}

if (TESTE) enviarTeste(TESTE);
else main();
