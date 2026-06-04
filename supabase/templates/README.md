# Templates de e-mail — estoque.autos

Templates HTML com a marca **estoque.autos** (fundo dark `#0a0b0d` + âmbar `#ff7a1a`,
wordmark estilizado, layout de 480px, botão CTA âmbar e nota de segurança no rodapé).

| Arquivo | Evento | Variáveis usadas |
| --- | --- | --- |
| `confirmation.html` | Confirmação de cadastro | `{{ .ConfirmationURL }}` |
| `invite.html` | Convite | `{{ .ConfirmationURL }}` |
| `recovery.html` | Redefinição de senha | `{{ .ConfirmationURL }}` |
| `magic_link.html` | Link mágico (login sem senha) | `{{ .ConfirmationURL }}` |
| `email_change.html` | Alteração de e-mail | `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}` |

## Local (Supabase CLI)

O `supabase/config.toml` já aponta `[auth.email.template.*]` para estes arquivos
(via `content_path`) com os `subject` em pt-BR. Rode `supabase start` / `supabase stop`
para aplicar. Os e-mails de teste local aparecem no Inbucket (`http://127.0.0.1:54324`).

## Cloud (produção) — IMPORTANTE

No Supabase **Cloud** o `config.toml` **NÃO** aplica templates de e-mail: ele só vale
para o ambiente local. Para usar em produção, escolha uma das opções:

### Opção A — Dashboard (manual)

1. Acesse **Authentication > Emails** (aba **Templates**) no Dashboard do projeto.
2. Para cada tipo (Confirm signup, Invite user, Reset password, Magic Link,
   Change email address), **cole o HTML** do arquivo correspondente.
3. Preencha o **Subject** com os textos abaixo.
4. Salve.

### Opção B — Management API

Use o endpoint de configuração de Auth para enviar `mailer_subjects_*` e
`mailer_templates_*_content` (HTML como string). Exemplo:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_confirmation": "Confirme seu e-mail — estoque.autos",
    "mailer_templates_confirmation_content": "<...HTML de confirmation.html...>"
  }'
```

Chaves equivalentes por tipo: `confirmation`, `invite`, `recovery`, `magic_link`,
`email_change` (ex.: `mailer_subjects_recovery`, `mailer_templates_recovery_content`).

## Subjects sugeridos (pt-BR)

| Tipo | Subject |
| --- | --- |
| Confirmação de cadastro | Confirme seu e-mail — estoque.autos |
| Convite | Você foi convidado — estoque.autos |
| Redefinição de senha | Redefina sua senha — estoque.autos |
| Link mágico | Seu link de acesso — estoque.autos |
| Alteração de e-mail | Confirme a alteração de e-mail — estoque.autos |
