# Estoque.autos SaaS

## Plataforma de Gestão para Lojas de Veículos

**Documento de Especificação Técnica e Funcional — Estrutura de Tasks por Prioridade**

Versão 1.0 — Fevereiro 2026

> **Stack Tecnológica**
> - Backend: Node.js + TypeScript + Express
> - Banco de Dados: Supabase (PostgreSQL)
> - Frontend: React + DaisyUI (Tailwind)
> - Testes: Jest | Design: Atomic Design

---

## 1. Visão Geral do Produto

O Estoque.autos SaaS é uma plataforma completa para lojas de veículos (carros, motos e utilitários) que unifica gestão de estoque, captação de leads, controle financeiro e presença digital em um único sistema. O objetivo é dar ao lojista total controle sobre sua operação, desde a compra do veículo até a venda final, com visibilidade de margem, fluxo de caixa e performance da equipe de vendas.

A plataforma oferece ao lojista uma landing page pública e personalizável para sua loja, servindo como vitrine digital com 3 templates disponíveis. Cada veículo possui uma página de detalhe dedicada com formulário de proposta e botão de contato, convertendo visitantes em leads qualificados diretamente no sistema.

Além disso, o sistema oferece integração com os principais marketplaces automotivos do Brasil: Webmotors, OLX, iCarros e Mercado Livre, permitindo ao lojista publicar seus veículos nesses canais diretamente pela plataforma, escolhendo para quais marketplaces replicar cada anúncio.

---

## 2. Stack Tecnológica

### 2.1 Backend

Runtime: Node.js (LTS) com TypeScript strict mode. Framework HTTP: Express.js com middlewares padrão (cors, helmet, compression, rate-limit). ORM/Query Builder: Supabase Client SDK (`@supabase/supabase-js`) para interação direta com o banco. Autenticação: Supabase Auth (JWT + Row Level Security). Storage: Supabase Storage para upload de imagens (veículos, logos). Validação: Zod para validação de schemas de entrada. Testes: Jest + Supertest para testes unitários e de integração.

### 2.2 Frontend

Framework: React 18+ com TypeScript. UI Kit: DaisyUI (baseado em Tailwind CSS) para componentes de interface. Arquitetura de Componentes: Atomic Design (Atoms, Molecules, Organisms, Templates, Pages). Gerenciamento de Estado: Zustand ou React Context (conforme complexidade). Roteamento: React Router v6. HTTP Client: Axios ou fetch nativo com wrapper tipado. Build Tool: Vite. Testes: Jest + React Testing Library.

### 2.3 Banco de Dados (Supabase)

O Supabase será utilizado como backend-as-a-service com PostgreSQL. Utilizaremos Row Level Security (RLS) para isolar dados entre tenants (lojas). Supabase Realtime para notificações de novos leads. Supabase Edge Functions para webhooks das integrações. Supabase Storage com buckets separados por tenant para imagens.

### 2.4 Estrutura de Pastas (Atomic Design)

- **`src/components/atoms/`** — Botões, inputs, labels, badges, avatars
- **`src/components/molecules/`** — Cards de veículo, campos de formulário com label, search bar
- **`src/components/organisms/`** — Header, sidebar, tabela de estoque, formulário completo de veículo
- **`src/components/templates/`** — Layouts de página (dashboard, listagem, detalhe)
- **`src/pages/`** — Páginas finais com dados injetados nos templates

---

## 3. Módulos e Features Detalhados

### 3.1 Autenticação e Multi-Tenancy

O sistema opera em modelo multi-tenant onde cada loja é um tenant isolado. O owner (dono da loja) cria a conta e pode convidar vendedores. Toda a segurança de isolamento é garantida por RLS no Supabase.

**Funcionalidades:**

- → Cadastro de conta (owner) com e-mail e senha via Supabase Auth
- → Login com JWT, refresh token automático
- → Criação do tenant (loja) no primeiro acesso pós-cadastro
- → Convite de vendedores por e-mail (role-based: owner, manager, seller)
- → Row Level Security: cada query filtrada por tenant_id automaticamente
- → Recuperação de senha via Supabase Auth
- → Perfil do usuário com foto, nome, telefone

### 3.2 Gestão da Loja (Configurações)

O módulo de gestão da loja permite ao owner configurar todos os dados da sua operação, incluindo identidade visual, informações de contato, endereço e personalização da landing page pública.

**Dados Básicos:**

- → Nome fantasia, razão social, CNPJ
- → Endereço completo com CEP (integração ViaCEP para auto-preenchimento)
- → Telefone(s) da loja, WhatsApp principal
- → E-mail de contato, redes sociais (Instagram, Facebook)
- → Horário de funcionamento (por dia da semana)

**Identidade Visual:**

- → Upload do logo da loja com ferramenta de crop integrada (react-image-crop ou similar)
- → Crop com aspect ratios pré-definidos: quadrado (1:1) para ícone e retangular (16:9) para header
- → Paleta de cores personalizável: cor primária, cor secundária, cor de destaque
- → Estas cores são aplicadas dinamicamente na landing page pública via CSS variables

**Landing Page Pública:**

- → 3 templates de landing page disponíveis para escolha
- → Template 1 — **Clássico**: header com logo, grid de veículos, footer com contato
- → Template 2 — **Moderno**: hero full-width com busca, cards com hover effects, seção de destaques
- → Template 3 — **Premium**: design escuro, carrossel de destaques, filtros laterais avançados
- → Preview em tempo real ao trocar de template ou alterar cores
- → Slug personalizado para URL da loja: `app.Estoque.autos.com.br/{slug}`
- → SEO básico: meta tags, Open Graph, título e descrição customizáveis

### 3.3 Gestão de Estoque (Veículos)

O coração do sistema. Permite cadastrar, editar, ativar/desativar e marcar como vendido cada veículo do estoque. Cada veículo possui dados completos para listagem interna e publicação nos marketplaces.

**Cadastro do Veículo:**

- → Marca, modelo, versão/trim (ex: Civic EXL 2.0)
- → Ano fabricação / Ano modelo
- → Placa (mascarada no frontend, visível só internamente)
- → Cor, combustível, câmbio (manual/automático/CVT/automatizado)
- → Quilometragem, número de portas, potência
- → Categoria: carro, moto, utilitário, caminhão
- → Opcionais/acessórios: checkboxes dinâmicos (ar, direção, airbag, ABS, multimídia, teto solar, etc.)
- → Descrição livre (rich text editor)
- → Até 30 fotos por veículo com reordenação drag-and-drop
- → Foto principal selecionável (capa do anúncio)
- → Upload com compressão automática client-side antes de enviar ao Supabase Storage

**Dados Financeiros do Veículo:**

- → Valor de compra (custo de aquisição)
- → Despesas adicionais: IPVA, transferência, polimento, revisão, funilaria, etc.
- → Valor de venda (preço anunciado)
- → Margem bruta calculada automaticamente: (venda - compra - despesas)
- → Percentual de margem sobre o custo
- → Campo de desconto máximo autorizado (para vendedores)

**Status do Veículo:**

- → **Disponível**: aparece na landing page e marketplaces
- → **Reservado**: cliente demonstrou interesse forte (aparece como 'reservado')
- → **Vendido**: removido da vitrine, entra no relatório de vendas
- → **Inativo**: removido de todos os canais, não aparece em lugar nenhum
- → Histórico de mudanças de status com timestamp e usuário responsável

**Listagem e Filtros Internos:**

- → Tabela com busca por texto (marca, modelo, placa)
- → Filtros: status, categoria, faixa de preço, ano, marca
- → Ordenação por: preço, data de cadastro, margem, quilometragem
- → Visualização em grid (cards) ou tabela
- → Indicadores visuais: badge de status, dias em estoque, margem %
- → Export para Excel/CSV

### 3.4 Página de Detalhe do Veículo (Pública)

Cada veículo com status 'Disponível' terá uma página de detalhe pública acessível via URL amigável. Esta página é o principal ponto de conversão de visitantes em leads.

**Elementos da Página:**

- → Galeria de fotos com lightbox e navegação por swipe (mobile-friendly)
- → Informações completas: marca, modelo, versão, ano, km, câmbio, combustível, cor
- → Lista de opcionais/acessórios com ícones
- → Preço de venda em destaque
- → Descrição do veículo
- → Dados da loja: nome, endereço, telefone, horário de funcionamento

**Conversão (Lead Capture):**

- → Formulário de proposta: nome, telefone, e-mail, valor da proposta, mensagem, veículo de troca (opcional)
- → Botão 'Entrar em Contato' que abre WhatsApp com mensagem pré-formatada incluindo dados do veículo
- → Botão 'Ligar Agora' (click-to-call em mobile)
- → Ambas as ações (proposta e contato) geram um registro de lead no sistema
- → Lead captura automaticamente: UTM source, página de origem, dispositivo, horário
- → Validação de campos obrigatórios e formatação de telefone/e-mail

### 3.5 Gestão de Leads

Todo contato gerado pela landing page (proposta ou clique em contato) é registrado como lead. O sistema permite gerenciar o funil de vendas completo.

**Dados do Lead:**

- → Nome, telefone, e-mail do interessado
- → Veículo de interesse (vinculado ao estoque)
- → Canal de origem: landing page, Webmotors, OLX, iCarros, Mercado Livre, manual
- → Tipo: proposta (com valor), contato WhatsApp, contato telefone
- → Valor da proposta (quando aplicável)
- → Veículo de troca oferecido (quando informado)
- → Data/hora do contato
- → UTM parameters e dispositivo

**Funil e Status do Lead:**

- → **Novo**: acabou de entrar
- → **Em Atendimento**: vendedor já fez contato
- → **Negociando**: proposta em análise
- → **Convertido**: virou venda
- → **Perdido**: não fechou (com motivo obrigatório: preço, financiamento, desistiu, comprou outro, etc.)

**Funcionalidades de Gestão:**

- → Atribuição de lead a vendedor (manual ou round-robin automático)
- → Timeline de interações por lead (notas, ligações, visitas)
- → Notificação em tempo real de novo lead (Supabase Realtime + push notification)
- → Filtros: por vendedor, status, veículo, canal, período
- → Dashboard de leads: total por período, taxa de conversão, tempo médio de atendimento

### 3.6 Gestão de Vendedores

O owner ou manager pode cadastrar vendedores que terão acesso limitado ao sistema, focado na gestão dos seus leads e consulta ao estoque.

**Funcionalidades:**

- → Cadastro de vendedor: nome, e-mail, telefone, foto
- → Convite por e-mail com link de ativação
- → Perfis de acesso: Owner (tudo), Manager (tudo menos financeiro), Seller (leads próprios + estoque read-only)
- → Dashboard individual do vendedor: meus leads, minhas vendas, minha comissão
- → Relatório de performance: leads atendidos, convertidos, perdidos, tempo médio de resposta
- → Ativar/desativar vendedor sem perder histórico
- → Configuração de comissão: % sobre margem ou valor fixo por venda

### 3.7 Registro de Vendas

Quando um veículo é marcado como vendido, o sistema registra todos os dados da transação para alimentar os relatórios financeiros.

**Dados da Venda:**

- → Veículo vendido (vinculado ao estoque)
- → Valor final de venda (pode diferir do anunciado)
- → Data da venda
- → Comprador: nome, CPF/CNPJ, telefone, e-mail
- → Vendedor responsável
- → Lead de origem (quando veio pelo sistema)
- → Forma de pagamento: à vista, financiamento, consórcio, troca + volta
- → Valor da troca recebida (quando aplicável)
- → Observações da venda

**Automações na Venda:**

- → Status do veículo atualizado automaticamente para 'Vendido'
- → Anúncios removidos automaticamente dos marketplaces integrados
- → Cálculo automático: margem bruta, margem líquida, comissão do vendedor
- → Lead de origem atualizado para status 'Convertido'

### 3.8 Fluxo de Caixa e Financeiro

O módulo financeiro oferece visão básica mas essencial da saúde financeira da operação, sem pretender substituir um ERP completo.

**Fluxo de Caixa Básico:**

- → Entradas: vendas realizadas (valor de venda)
- → Saídas: compras de veículos (custo de aquisição) + despesas por veículo
- → Saldo do período: entradas menos saídas
- → Visualização mensal com gráfico de barras (entradas vs saídas)
- → Possibilidade de lançamentos manuais: despesas fixas (aluguel, salários, etc.)

**Relatórios Financeiros:**

- → Margem bruta total do período
- → Margem média por veículo
- → Veículo mais e menos rentável
- → Giro de estoque: tempo médio entre compra e venda
- → Valor total do estoque (custo e potencial de venda)
- → Ticket médio de venda
- → Comissões a pagar por vendedor no período

**Dashboard Financeiro:**

- → Cards KPI: faturamento do mês, margem do mês, estoque total, veículos vendidos no mês
- → Gráfico de evolução mensal (últimos 12 meses)
- → Top 5 veículos por margem
- → Alerta de veículos parados há mais de X dias

### 3.9 Integrações com Marketplaces

O sistema permite publicar veículos nos principais portais automotivos do Brasil diretamente pela plataforma. O lojista escolhe, para cada veículo, em quais canais deseja publicar.

**Plataformas Integradas:**

- → **Webmotors** — API oficial ou integração via XML feed
- → **OLX** — API oficial (AUTOLINE/ZAP) ou integração via feed
- → **iCarros** — Integração via XML feed padrão do mercado
- → **Mercado Livre** — API oficial (Mercado Libre API) com autenticação OAuth

**Fluxo de Publicação:**

- → No cadastro/edição do veículo: checkboxes para selecionar marketplaces
- → Mapeamento automático de campos: os dados do veículo são adaptados para o formato de cada plataforma
- → Sincronização de fotos: upload automático das imagens para cada marketplace
- → Status sync: ao marcar como vendido/inativo, o anúncio é removido automaticamente dos marketplaces
- → Log de publicação: registro de sucesso/falha para cada marketplace com detalhes do erro

**Recepção de Leads dos Marketplaces:**

- → Webhook/e-mail parsing para receber leads gerados nos marketplaces
- → Lead entra no sistema com canal de origem identificado (Webmotors, OLX, etc.)
- → Vinculação automática com o veículo do estoque
- → Deduplicação: se mesmo telefone/e-mail já existe como lead, agrupa no mesmo contato

**Configuração por Marketplace:**

- → Credenciais da conta do lojista em cada plataforma
- → Ativação/desativação individual de cada integração
- → Mapeamento de categorias e campos específicos
- → Teste de conexão para validar credenciais

### 3.10 Landing Page Pública da Loja

A landing page é a vitrine digital da loja. É acessível publicamente e exibe os veículos disponíveis com filtros de busca. A página é responsive e otimizada para SEO.

**Elementos da Landing Page:**

- → Header com logo da loja (cropado pelo owner), nome, telefone e WhatsApp
- → Barra de busca e filtros: marca, modelo, ano, faixa de preço, câmbio, combustível
- → Grid/lista de veículos disponíveis com foto principal, preço, ano, km, câmbio
- → Paginação ou scroll infinito
- → Seção de destaques: veículos marcados como destaque pelo owner
- → Footer: endereço, mapa (Google Maps embed), horário de funcionamento, redes sociais
- → WhatsApp flutuante para contato rápido

**Templates Disponíveis:**

- → **Template Clássico**: layout limpo e direto, grid 3 colunas, tons neutros. Ideal para lojas tradicionais que priorizam clareza e funcionalidade
- → **Template Moderno**: hero com busca integrada, cards com efeito hover, micro-animações, design arrojado. Para lojas que querem transmitir modernidade e tecnologia
- → **Template Premium**: fundo escuro, tipografia elegante, carrossel hero, filtros laterais avançados, efeitos parallax sutis. Para lojas de alto padrão e veículos premium

**Personalização:**

- → Seletor de template com preview ao vivo
- → Cores personalizáveis: primária, secundária, accent (aplicadas via CSS variables/DaisyUI themes)
- → Logo com crop: upload + ferramenta de recorte integrada no painel admin
- → Textos editáveis: slogan/tagline, texto do footer, sobre a loja
- → Ordenação padrão dos veículos: mais recentes, menor preço, menor km
- → Toggle de funcionalidades: mostrar/ocultar filtros, mostrar/ocultar mapa, financiamento

---

## 4. Modelo de Dados (Principais Entidades)

Todas as tabelas possuem `tenant_id` para isolamento multi-tenant via RLS.

| Tabela | Campos Principais |
|---|---|
| `tenants` | id, name, slug, cnpj, address, phone, whatsapp, email, logo_url, template_id, colors (jsonb), settings (jsonb), created_at |
| `users` | id, tenant_id, email, name, phone, avatar_url, role (owner/manager/seller), is_active, created_at |
| `vehicles` | id, tenant_id, brand, model, version, year_fab, year_model, plate, color, fuel, transmission, mileage, doors, power, category, description, optionals (jsonb), purchase_price, expenses (jsonb), sale_price, max_discount, status, featured, photos (jsonb), marketplace_ids (jsonb), created_by, created_at, updated_at |
| `vehicle_status_log` | id, vehicle_id, old_status, new_status, changed_by, created_at |
| `leads` | id, tenant_id, vehicle_id, name, phone, email, type (proposal/whatsapp/phone), proposal_value, trade_vehicle, channel, status, lost_reason, assigned_to, utm_source, utm_medium, utm_campaign, device, created_at |
| `lead_interactions` | id, lead_id, user_id, type (note/call/visit/proposal), content, created_at |
| `sales` | id, tenant_id, vehicle_id, lead_id, seller_id, buyer_name, buyer_document, buyer_phone, buyer_email, final_price, payment_method, trade_value, commission_value, gross_margin, notes, sold_at, created_at |
| `cash_flow_entries` | id, tenant_id, type (income/expense), category, description, amount, reference_id, reference_type, entry_date, created_by, created_at |
| `marketplace_configs` | id, tenant_id, platform, credentials (jsonb encrypted), is_active, last_sync_at |
| `marketplace_logs` | id, vehicle_id, platform, action (publish/update/remove), status (success/error), error_detail, created_at |

---

## 5. Estrutura de Tasks por Prioridade

As tasks estão organizadas por prioridade (P0 = crítica/bloqueante, P1 = alta, P2 = média, P3 = baixa, P4 = nice-to-have). Não há cronograma definido, apenas a ordem de execução recomendada. Cada bloco deve ser concluído antes de iniciar o próximo, exceto quando tasks de blocos diferentes não possuem dependência.

---

### Bloco 0 — Infraestrutura e Setup (P0)

Setup inicial do projeto, sem o qual nada mais funciona.

| Prior. | Task | Descrição | Status |
|:---:|---|---|:---:|
| P0 | Setup Repositório | Criar monorepo (ou repos separados) com estrutura de pastas, ESLint, Prettier, tsconfig, husky para pre-commit hooks | Backlog |
| P0 | Setup Supabase | Criar projeto Supabase, configurar banco PostgreSQL, habilitar Auth, Storage, Realtime. Criar migrations iniciais | Backlog |
| P0 | Setup Backend Express | Scaffold do servidor Express com TypeScript, middlewares base (cors, helmet, compression, error handler), health check endpoint | Backlog |
| P0 | Setup Frontend React | Scaffold com Vite + React + TypeScript + DaisyUI. Configurar tema base, rotas, layout shell com sidebar/header | Backlog |
| P0 | CI/CD Pipeline | GitHub Actions para lint, testes, build. Deploy automático para staging (Vercel/Railway ou equivalente) | Backlog |
| P0 | Variáveis de Ambiente | Configurar .env para dev/staging/prod. Secrets management para credenciais de marketplace | Backlog |

---

### Bloco 1 — Autenticação e Multi-Tenancy (P0)

Base de segurança e isolamento de dados.

| Prior. | Task | Descrição | Status |
|:---:|---|---|:---:|
| P0 | Tabela tenants + RLS | Criar tabela tenants com todas as policies de Row Level Security. Testar isolamento entre tenants | Backlog |
| P0 | Tabela users + Auth | Integrar Supabase Auth com tabela users. Trigger para criar user após signup. Roles: owner, manager, seller | Backlog |
| P0 | Tela de Cadastro/Login | Páginas de signup, login, forgot password. Integração com Supabase Auth no frontend | Backlog |
| P0 | Onboarding Flow | Wizard pós-cadastro: criar tenant (nome, slug, CNPJ, endereço, telefone). Validação de slug único | Backlog |
| P0 | Middleware de Auth Backend | Verificação de JWT em todas as rotas protegidas. Extrair tenant_id e user_id do token. Middleware de role check | Backlog |
| P0 | Context de Auth Frontend | Provider React com estado de auth, user, tenant. Proteção de rotas por role. Redirect para login se não autenticado | Backlog |

---

### Bloco 2 — Gestão de Estoque (P0)

Core da aplicação. Sem estoque, nada mais funciona.

| Prior. | Task | Descrição | Status |
|:---:|---|---|:---:|
| P0 | Tabela vehicles + RLS | Criar tabela com todos os campos, indexes, RLS policies. Migration com seed de dados de teste | Backlog |
| P0 | CRUD API Veículos | Endpoints REST: POST /vehicles, GET /vehicles, GET /vehicles/:id, PUT /vehicles/:id, PATCH /vehicles/:id/status | Backlog |
| P0 | Upload de Fotos | Endpoint de upload para Supabase Storage. Compressão server-side com Sharp. Bucket organizado por tenant/vehicle | Backlog |
| P0 | Formulário de Cadastro | Tela completa com todos os campos, upload de fotos com drag-and-drop e reordenação, preview de imagens, validação com Zod | Backlog |
| P0 | Listagem de Estoque | Tabela/grid com busca, filtros (status, marca, preço, ano), ordenação, paginação. Toggle view mode (grid/table) | Backlog |
| P0 | Detalhe do Veículo (Admin) | Tela interna de detalhe com todos os dados, galeria, dados financeiros, histórico de status, leads vinculados | Backlog |
| P0 | Mudança de Status | Ação de marcar como disponível/reservado/vendido/inativo. Log de mudança com timestamp e usuário | Backlog |
| P1 | Dados Financeiros do Veículo | Campos de custo, despesas adicionais (lista dinâmica), cálculo de margem automático. Visível apenas para owner/manager | Backlog |
| P1 | Export CSV/Excel | Botão para exportar listagem filtrada em CSV ou XLSX | Backlog |

---

### Bloco 3 — Landing Page Pública (P1)

Vitrine digital da loja e principal fonte de leads orgânicos.

| Prior. | Task | Descrição | Status |
|:---:|---|---|:---:|
| P1 | API Pública de Veículos | Endpoint público GET /public/:slug/vehicles com filtros. Retorna apenas veículos com status 'available'. Sem dados financeiros | Backlog |
| P1 | Template Clássico | Implementar template 1: header + grid + footer. Responsivo. Cores via CSS variables alimentadas pelo tenant | Backlog |
| P1 | Template Moderno | Implementar template 2: hero com busca, cards hover, destaques. Responsivo | Backlog |
| P1 | Template Premium | Implementar template 3: dark theme, carrossel, filtros laterais, parallax. Responsivo | Backlog |
| P1 | Seletor de Template | Tela no admin para preview e seleção de template. Salvar escolha no tenant | Backlog |
| P1 | Personalização de Cores | Color picker no admin para primária/secundária/accent. Preview ao vivo. Salvar no tenant e aplicar via CSS vars / DaisyUI theme | Backlog |
| P1 | Upload e Crop de Logo | Componente de upload com crop integrado (react-image-crop). Aspect ratios 1:1 e 16:9. Salvar versões no Storage | Backlog |
| P1 | Página de Detalhe Pública | Página pública do veículo com galeria, dados completos, formulário de proposta e botões de contato | Backlog |
| P1 | SEO e Meta Tags | Título, description, Open Graph dinâmicos por loja e por veículo. Sitemap básico | Backlog |
| P2 | Textos Editáveis | Admin: editar slogan, sobre a loja, texto do footer. Rich text básico | Backlog |

---

### Bloco 4 — Gestão de Leads (P1)

Captação e gerenciamento dos leads gerados pela landing page e marketplaces.

| Prior. | Task | Descrição | Status |
|:---:|---|---|:---:|
| P1 | Tabela leads + RLS | Criar tabela com todos os campos, indexes, policies. Trigger para notificação realtime | Backlog |
| P1 | API de Criação de Lead | Endpoint público POST /public/:slug/leads. Rate limiting, validação, honeypot anti-spam | Backlog |
| P1 | Formulário de Proposta | Componente na página de detalhe: nome, tel, email, valor proposta, mensagem, veículo de troca. Integrado com API | Backlog |
| P1 | Botão WhatsApp | Gera link wa.me com mensagem pré-formatada. Registra lead tipo 'whatsapp' antes de redirecionar | Backlog |
| P1 | Listagem de Leads (Admin) | Tabela com filtros: vendedor, status, veículo, canal, período. Ordenação por data. Badge de status | Backlog |
| P1 | Detalhe do Lead | Tela com dados completos, veículo de interesse, timeline de interações, campo para notas | Backlog |
| P1 | Mudança de Status do Lead | Dropdown para mudar status. Campo obrigatório de motivo ao marcar como 'Perdido' | Backlog |
| P1 | Atribuição a Vendedor | Selecionar vendedor manualmente. Toggle para round-robin automático nas configurações | Backlog |
| P1 | Notificação Realtime | Supabase Realtime: novo lead gera toast/notificação no dashboard do vendedor atribuído | Backlog |
| P2 | Timeline de Interações | Adicionar notas, registrar ligações e visitas no lead. Histórico cronológico completo | Backlog |
| P2 | Cadastro Manual de Lead | Formulário no admin para adicionar lead manualmente (ex: cliente que ligou ou veio presencialmente) | Backlog |

---

### Bloco 5 — Gestão de Vendedores (P1)

| Prior. | Task | Descrição | Status |
|:---:|---|---|:---:|
| P1 | CRUD Vendedores | Endpoints e tela para cadastrar, editar, ativar/desativar vendedores. Convite por e-mail via Supabase Auth | Backlog |
| P1 | Perfis de Acesso (RBAC) | Implementar middleware + frontend guards para owner, manager, seller. Seller vê apenas seus leads | Backlog |
| P2 | Dashboard do Vendedor | Visão personalizada: meus leads, minhas vendas, minha comissão do mês | Backlog |
| P2 | Configuração de Comissão | Admin: definir % de comissão por vendedor ou global. Cálculo automático ao registrar venda | Backlog |
| P3 | Relatório de Performance | Leads atendidos, convertidos, perdidos, tempo médio de resposta. Ranking de vendedores | Backlog |

---

### Bloco 6 — Registro de Vendas (P1)

| Prior. | Task | Descrição | Status |
|:---:|---|---|:---:|
| P1 | Tabela sales + RLS | Criar tabela com todos os campos e policies | Backlog |
| P1 | Formulário de Venda | Modal/tela ao marcar veículo como vendido: dados do comprador, valor final, forma pagto, vendedor, lead de origem | Backlog |
| P1 | Automações Pós-Venda | Trigger: atualizar status veículo, atualizar status lead, calcular margem e comissão, gerar entry no fluxo de caixa | Backlog |
| P1 | Listagem de Vendas | Tabela com todas as vendas: veículo, valor, margem, vendedor, data. Filtros por período e vendedor | Backlog |
| P2 | Detalhe da Venda | Tela com todos os dados da transação, margem calculada, comissão, link para veículo e lead | Backlog |

---

### Bloco 7 — Financeiro e Fluxo de Caixa (P2)

| Prior. | Task | Descrição | Status |
|:---:|---|---|:---:|
| P2 | Tabela cash_flow + RLS | Tabela de lançamentos com tipo (entrada/saída), categoria, valor, referência | Backlog |
| P2 | Lançamentos Automáticos | Venda gera entrada. Compra de veículo gera saída. Despesas do veículo geram saídas | Backlog |
| P2 | Lançamentos Manuais | Formulário para lançar despesas fixas: aluguel, salários, marketing, etc. | Backlog |
| P2 | Dashboard Financeiro | Cards KPI: faturamento, margem total, estoque, vendas do mês. Gráfico de evolução 12 meses | Backlog |
| P2 | Relatório de Margem | Margem por veículo, média, melhor e pior. Percentual sobre custo | Backlog |
| P2 | Relatório de Giro | Tempo médio de permanência no estoque. Alerta de veículos parados > X dias | Backlog |
| P3 | Relatório de Comissões | Comissões a pagar por vendedor no período selecionado | Backlog |
| P3 | Export de Relatórios | Exportar relatórios financeiros em PDF e Excel | Backlog |

---

### Bloco 8 — Integrações com Marketplaces (P2)

Módulo mais complexo por depender de APIs externas. Implementar uma integração por vez.

| Prior. | Task | Descrição | Status |
|:---:|---|---|:---:|
| P2 | Arquitetura de Integrações | Criar adapter pattern: interface base com publish, update, remove, receiveLeads. Cada marketplace implementa a interface | Backlog |
| P2 | Tela de Configuração | Admin: configurar credenciais de cada marketplace, ativar/desativar, testar conexão | Backlog |
| P2 | UI de Seleção no Veículo | Checkboxes no formulário do veículo para selecionar marketplaces. Preview do mapeamento de campos | Backlog |
| P2 | Integração Webmotors | Implementar adapter Webmotors: publicação, atualização, remoção, recepção de leads | Backlog |
| P2 | Integração OLX | Implementar adapter OLX/Autoline: publicação via feed ou API, recepção de leads | Backlog |
| P3 | Integração iCarros | Implementar adapter iCarros: publicação via XML feed, recepção de leads | Backlog |
| P3 | Integração Mercado Livre | Implementar adapter ML: OAuth, publicação via API, recepção de leads via webhook | Backlog |
| P2 | Tabela marketplace_logs | Log de todas as ações com cada marketplace. Tela admin para visualizar erros e re-tentar | Backlog |
| P2 | Sincronização de Status | Ao mudar status do veículo, propagar alteração para todos os marketplaces ativos | Backlog |
| P3 | Recepção de Leads | Webhooks/e-mail parsing para cada marketplace. Criar lead com canal de origem correto | Backlog |

---

### Bloco 9 — Polimento e Features Extras (P3/P4)

| Prior. | Task | Descrição | Status |
|:---:|---|---|:---:|
| P3 | Notificações por E-mail | E-mail ao owner/vendedor quando novo lead chega. Template HTML bonito com dados do veículo e lead | Backlog |
| P3 | Consulta FIPE | Integração com tabela FIPE para auto-preenchimento de marca/modelo/versão e referência de preço | Backlog |
| P3 | Simulador de Financiamento | Widget na página pública: valor, entrada, parcelas, taxa. Gera lead tipo 'simulação' | Backlog |
| P3 | Analytics da Landing | Google Analytics 4 integrado. Eventos: visualização de veículo, clique em contato, envio de proposta | Backlog |
| P3 | PWA Mobile | Transformar o admin em PWA para acesso rápido pelo celular. Push notifications para novos leads | Backlog |
| P4 | Multi-idioma | i18n para PT-BR (padrão) e ES (para lojas de fronteira) | Backlog |
| P4 | Modo Escuro Admin | Toggle dark/light mode no painel administrativo | Backlog |
| P4 | Comparador de Veículos | Funcionalidade pública para comparar até 3 veículos lado a lado | Backlog |
| P4 | Agendamento de Visita | Formulário público para agendar test-drive. Integra com Google Calendar | Backlog |
| P4 | Chat ao Vivo | Widget de chat na landing page com notificação para o vendedor | Backlog |

---

## 6. Estratégia de Testes

O projeto utiliza Jest como framework de testes tanto no backend quanto no frontend, com foco em garantir a confiabilidade das funcionalidades core.

**Backend (Jest + Supertest):**

- → Testes unitários para cada service (VehicleService, LeadService, SaleService, etc.)
- → Testes de integração para cada endpoint da API com Supertest
- → Testes de RLS: verificar que tenant A não acessa dados do tenant B
- → Testes de middleware: auth, role check, rate limiting
- → Mocks do Supabase Client para testes unitários isolados
- → Testes E2E dos fluxos críticos: cadastro > login > criar veículo > receber lead > registrar venda

**Frontend (Jest + React Testing Library):**

- → Testes unitários de componentes atoms e molecules
- → Testes de integração de organisms (formulários, tabelas com filtros)
- → Testes de fluxo: login, cadastro de veículo, gestão de lead
- → Snapshot tests para os 3 templates de landing page
- → Testes de responsividade com diferentes viewports

**Cobertura Mínima Recomendada:**

- → Services do backend: 80%+
- → Endpoints da API: 90%+ (todos os happy paths e principais error paths)
- → Componentes core do frontend: 70%+
- → Fluxos críticos E2E: 100% dos fluxos de receita (cadastro, lead, venda)

---

## 7. Considerações Finais

Este documento serve como guia base para o desenvolvimento da plataforma Estoque.autos SaaS. As prioridades foram definidas com base em dependências técnicas e valor de negócio, seguindo a lógica de que o sistema precisa primeiro existir (infra), depois ser seguro (auth), depois ter conteúdo (estoque), depois gerar valor (landing page + leads + vendas), e finalmente expandir (integrações + extras).

Recomenda-se revisão periódica das prioridades conforme feedback dos primeiros usuários e evolução do produto. As integrações com marketplaces devem ser implementadas uma por vez, começando pela de maior demanda do público-alvo (normalmente Webmotors ou OLX).

O design atômico garante reusabilidade e consistência de UI. A escolha por DaisyUI sobre o Tailwind puro acelera o desenvolvimento enquanto mantém a customização necessária para os templates de landing page. O Supabase como BaaS reduz drasticamente o time-to-market ao oferecer auth, storage, realtime e banco de dados em um único serviço.