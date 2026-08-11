# Templates de e-mail — estoque.autos

Templates HTML com a marca **estoque.autos** (fundo dark `#0a0b0d` + âmbar `#ff7a1a`,
wordmark estilizado, layout de 480px, botão CTA âmbar, código OTP em destaque e
nota de segurança no rodapé).

Todos os links usam o padrão **token_hash** (`{{ .TokenHash }}` →
`/auth/confirm?token_hash=...&type=...`), que funciona em **qualquer
navegador/dispositivo** — diferente do fluxo PKCE (`{{ .ConfirmationURL }}`),
que exige abrir o link no mesmo navegador que iniciou o fluxo. Onde faz
sentido, o e-mail também traz o código de 6 dígitos (`{{ .Token }}`) para o
usuário digitar na tela correspondente do app.

| Arquivo | Evento | Verificação no app |
| --- | --- | --- |
| `confirmation.html` | Confirmação de cadastro | link `type=signup` ou código em `/cadastro/confirme` |
| `magic_link.html` | Login por código / magic link | link `type=magiclink` ou código em `/login/codigo` |
| `recovery.html` | Redefinição de senha | link `type=recovery` ou código em `/esqueci-senha` |
| `email_change.html` | Alteração de e-mail | link `type=email_change` |
| `invite.html` | Convite | link `type=invite` |

## Aplicando no projeto cloud (produção)

O `supabase/config.toml` referencia estes arquivos em `[auth.email.template.*]`
(via `content_path`) e configura o SMTP do **Resend** em `[auth.email.smtp]`.
Para aplicar tudo no projeto cloud linkado:

```bash
# o RESEND_API_KEY precisa estar no ambiente (está no .env.local)
RESEND_API_KEY="..." supabase config push
```

O push mostra o diff da configuração remota antes de aplicar.

## Local (Supabase CLI)

Rodando `supabase start`, os mesmos templates valem localmente. Atenção: com
`[auth.email.smtp].enabled = true` e o `RESEND_API_KEY` no ambiente, o stack
local envia e-mails DE VERDADE pelo Resend; sem a variável, os e-mails caem no
Inbucket (`http://127.0.0.1:54324`).

## Editando

Mantenha: tabelas com estilos inline (compatibilidade de clientes de e-mail),
preheader oculto, largura 480px, e as variáveis Go (`{{ .Token }}`,
`{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`).
Assuntos ficam no `config.toml` (`subject`), não no HTML.
