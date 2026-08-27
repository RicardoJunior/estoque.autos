# API de Conversões (CAPI) — estoque.autos

Dataset (pixel): **1124618420524857** · BM `1084593411190039` · conta `3002622743416647`.

O navegador já dispara `PageView`, `CompleteRegistration`, `InitiateCheckout` e `Purchase`
(`src/lib/funnel.ts`). A CAPI **não substitui** o pixel: manda o mesmo evento pelo servidor
e a Meta funde os dois pelo `event_id`. Sem isso, bloqueador de anúncios, Safari/ITP e
iOS derrubam 20–40% dos eventos — e é justamente o `CompleteRegistration` que a campanha
usa pra otimizar.

## 1. Token (parte manual, no BM)

Caminho curto: **Gerenciador de Eventos → dataset `estoque.autos` → Configurações →
API de Conversões → Gerar token de acesso**. Copiar e guardar.

Caminho robusto (recomendado, o token não morre se sua senha/2FA mudar):
1. BM → Configurações do negócio → **Usuários → Usuários do sistema** → Adicionar
   → nome `capi-estoque`, função **Admin**.
2. **Adicionar ativos** → Fontes de dados → Datasets → `estoque.autos` → *Controle total*.
3. **Gerar novo token** → app do BM → permissões **`ads_management`** e
   **`business_management`** → gerar. Esse token não expira.

Guardar como secret do Worker (nunca no bundle, nunca `NEXT_PUBLIC_`):

```bash
printf '%s' 'EAAG...' | npx wrangler secret put META_CAPI_TOKEN
```

E adicionar `META_CAPI_TOKEN` na lista `SECRETS` de `scripts/deploy-prod.sh` (senão o
próximo deploy não o reenvia; secrets sobrevivem a deploys, mas a lista é a fonte da verdade).

## 2. Endpoint

```
POST https://graph.facebook.com/v23.0/1124618420524857/events
Content-Type: application/json

{
  "data": [ { ...evento... } ],
  "access_token": "<META_CAPI_TOKEN>",
  "test_event_code": "TEST12345"   // só durante o teste, remover depois
}
```

Formato de um evento:

```jsonc
{
  "event_name": "CompleteRegistration",
  "event_time": 1787770000,          // unix EM SEGUNDOS, ≤ 7 dias atrás
  "event_id": "sign_up:<user_id>",   // MESMA string do navegador → dedupe
  "event_source_url": "https://estoque.autos/cadastro/assinatura",
  "action_source": "website",        // "website" mesmo vindo do webhook do Stripe
  "user_data": {
    "em": ["<sha256 do e-mail>"],    // minúsculo, sem espaços, ANTES do hash
    "external_id": ["<sha256 do user_id>"],
    "fbp": "fb.1.1787000000.1234567890",
    "fbc": "fb.1.1787000000.<fbclid>",
    "client_ip_address": "203.0.113.9",
    "client_user_agent": "Mozilla/5.0 ..."
  },
  "custom_data": { "currency": "BRL", "value": 24.9, "content_name": "basico_mensal" }
}
```

Regras que quebram a integração se ignoradas:
- **`em`/`external_id` sempre em SHA-256 hex minúsculo.** IP e user agent vão **crus**.
- `fbp`/`fbc` são os cookies `_fbp` e `_fbc`. Se `_fbc` não existir mas a URL tiver
  `?fbclid=XYZ`, monte: `fb.1.<unix_ms>.XYZ`. **São eles que ligam o evento ao clique
  no anúncio** — sem `fbc`, a conversão não é atribuída à campanha.
- No Worker use `crypto.subtle.digest("SHA-256", ...)`. `node:crypto` não existe no workerd
  (mesmo motivo de o webhook do Stripe usar `createSubtleCryptoProvider`).

## 3. Deduplicação (a parte que mais dá errado)

O navegador precisa mandar o `eventID`, hoje ele não manda. Em `src/lib/funnel.ts`,
no `fire()`:

```ts
w.fbq!("track", META_EVENT[name], { ...params }, { eventID });
```

O mesmo `eventID` vai no `event_id` do payload do servidor. Regra: **mesmo `event_name`
+ mesmo `event_id`** → a Meta conta uma vez só. IDs sugeridos (determinísticos, já que
o `dedupeKey` existe):

| evento | event_id |
|---|---|
| CompleteRegistration | `sign_up:<user_id>` |
| InitiateCheckout | `begin_checkout:<user_id>:<price_id>` |
| Purchase | `purchase:<stripe_subscription_id>` |

## 4. Onde plugar em cada evento

| evento | gatilho no servidor | de onde vêm os dados |
|---|---|---|
| `CompleteRegistration` | server action que confirma a conta (a página `cadastro/assinatura` já renderiza `<FunnelEvent name="sign_up">`) | e-mail e id da sessão Supabase; `_fbp`/`_fbc` via `cookies()` |
| `InitiateCheckout` | `src/app/(auth)/cadastro/assinatura/actions.ts:65`, junto do `checkout.sessions.create` | mesma sessão + `price_id` |
| `Purchase` | `src/app/api/stripe/webhook/route.ts`, no `checkout.session.completed` | `session.customer_details.email`, valor real da assinatura |

**Purchase é o mais importante e o mais chato**: o webhook do Stripe não tem cookie nenhum.
Solução: na hora de criar a sessão de checkout, copiar `_fbp`, `_fbc`, IP e user agent
para `metadata` da sessão — o webhook lê de volta em `session.metadata`. Sem isso o
Purchase entra sem atribuição e a campanha não aprende com ele.

Ainda: `event_source_url` no Purchase deve ser a URL da plataforma
(`https://estoque.autos/onboarding?assinatura=ok`), não a do Stripe.

`PageView` pela CAPI não vale o custo — é ruído e gasta invocação de Worker.

## 5. Testar

1. Gerenciador de Eventos → dataset → aba **Testar eventos** → copiar o `test_event_code`.
2. Mandar os eventos com esse campo e conferir se aparecem em tempo real.
3. Fazer um cadastro real de ponta a ponta: o evento tem que aparecer **uma vez**, com
   a etiqueta **"Desduplicado"** / origem "Navegador e servidor". Se aparecer duas vezes,
   o `event_id` está diferente entre os dois lados.
4. Remover o `test_event_code` do código antes de subir pra valer.
5. Depois de 24–48h, checar **Qualidade da correspondência de eventos** no dataset.
   Alvo ≥ 6.0. Se estiver baixo, quase sempre falta `em` ou `fbc`.

## 6. Duas coisas do lado da Meta que ninguém lembra

- **Verificação do domínio** `estoque.autos` (BM → Segurança da marca → Domínios). Sem
  ela a Configuração de Eventos Agregados não aceita nossos eventos e a entrega em iOS
  degrada.
- **Configuração de eventos agregados**: `CompleteRegistration` precisa estar na lista
  dos 8 eventos priorizados do domínio — é o evento que a campanha otimiza. Ordem
  sugerida: Purchase > InitiateCheckout > CompleteRegistration > PageView.

## 7. LGPD

Só nas rotas da plataforma. **Nunca** nas vitrines dos lojistas — lá o controlador dos
dados é o lojista, e é a mesma regra que `funnel.ts` já segue no client.
