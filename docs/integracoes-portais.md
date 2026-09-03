# Integração com portais de anúncios — plano e especificação técnica

**Data:** 3 de setembro de 2026 · **Status:** proposta (nada implementado) · **Escopo:** publicar o estoque das lojas nos portais e trazer os leads de volta para o painel.

Este documento tem três partes: (1) o que cada portal oferece hoje e a dificuldade real de integrar, com fontes; (2) o que a plataforma tem hoje; (3) a arquitetura e as mudanças técnicas necessárias, com roadmap e estimativas.

---

## 1. Resumo executivo

**Ordem recomendada:** Mercado Livre → OLX → Webmotors → feeds baratos (Meta Automotive Inventory Ads, Chaves na Mão, Usadosbr). iCarros sai do plano.

- **iCarros foi descontinuado para lojistas.** O Itaú anunciou em 1º/06/2026 o fim da vertical PJ (concessionárias, multimarcas, locadoras, montadoras), com encerramento em 2/08/2026. Só o segmento pessoa física (C2C) foi vendido à ConectCar, ainda sujeito a Cade e Banco Central. O antigo Portal Revenda hoje redireciona para a home (verificado em 3/09/2026). Não há o que integrar.
- **Os três grandes ativos têm o mesmo obstáculo:** a API só funciona depois que a loja contratou um plano ou pacote pago diretamente com o portal (Mercado Livre: pacote de veículos via time comercial; OLX: plano Empresa; Webmotors: Cockpit + Plano Controle/Performance). A plataforma não consegue fazer onboarding 100% self-service. A interface precisa guiar o lojista nessa contratação e diagnosticar "sem plano" como um estado, não como um erro genérico.
- **Mercado Livre é o melhor ponto de partida:** API REST pública, OAuth 2.0, documentação completa com payloads reais, leads de veículos por webhook (`vis_leads`) com nome, e-mail e telefone do interessado. Nenhuma homologação manual é exigida para desenvolver.
- **Webmotors é o mais burocrático:** cadastro no portal de desenvolvedores, ticket com CNPJ e termos LGPD, homologação em ambiente de testes com prazo de 90 dias e horário comercial, além de taxonomia própria de marca/modelo/versão (não aceita FIPE). Vale começar o processo comercial em paralelo à engenharia do Mercado Livre, porque o tempo de espera é o gargalo.
- **Esforço total estimado:** 11 a 16 semanas de um desenvolvedor sênior para fundação + Mercado Livre + OLX + Webmotors + feeds, sem contar os tempos de espera das homologações (que podem somar 1 a 3 meses no caso da Webmotors).
- **Maior mudança na plataforma:** hoje não existe fila, cron no Worker, armazenamento de credenciais de terceiros, nem origem de lead. A fundação (tabelas de conexão/anúncio/jobs, worker por Cron Trigger, cofre de credenciais, adapters) é pré-requisito de qualquer portal e leva 2 a 3 semanas.

---

## 2. Matriz de dificuldade

Escala de 1 (trivial) a 5 (inviável ou muito custoso). "Técnica" mede o trabalho de código; "Burocracia" mede acesso, homologação e dependência comercial.

| Canal | Modelo de integração | Técnica | Burocracia | Nota final | Recomendação |
|---|---|---|---|---|---|
| **Mercado Livre** | API REST pública + OAuth 2.0; anúncio classificado | 3 | 3 | **3,5** | Fase 1 |
| **OLX** | "Autoupload" (PUT JSON em lote) + OAuth; integrador homologado por e-mail | 3 | 4 | **4** | Fase 2 |
| **Webmotors** | Portal de desenvolvedores (Sensedia) + credencial "Estoque Terceiro" no Cockpit | 3 | 5 | **4** | Fase 3 (iniciar processo comercial já) |
| **iCarros** | Vertical PJ encerrada em ago/2026 | — | — | **inviável** | Remover |
| **Chaves na Mão** | API REST com Swagger público; aceita código FIPE; webhook de leads | 2 | 2 | **2** | Fase 4 |
| **Usadosbr** | XML de catálogo ou login de integração (e-mail para suporte) | 1 | 2 | **2** | Fase 4 |
| **Meta Automotive Inventory Ads** | Feed CSV/XML por URL (catálogo de veículos); anúncio pago | 2 | 2 | **2** | Fase 4 (validar disponibilidade BR) |
| **Mobiauto** (Banco Pan) | API fechada, liberação comercial; sem doc pública | ? | 4 | **4** | Depois, via contato comercial |
| **NaPista** (Banco BV; absorveu Meu Carro Novo) | Só lojistas credenciados pelo BV | ? | 5 | **5** | Ignorar por ora |
| **Autoline** (Bradesco) | Via hubs terceiros; instável | ? | 4 | **4** | Ignorar por ora |
| **Seminovos.com.br** | Cadastro comercial; via hub | ? | 4 | **3,5** | Depois |
| **WhatsApp catálogo** (Cloud API) | Catálogo genérico, sem campos automotivos | 2 | 2 | **2** (valor baixo) | Complementar |
| **Facebook Marketplace** (orgânico) | Exige "Inventory Partner" homologado pela Meta; nenhum no Brasil confirmado | — | 5 | **5** | Ignorar |
| **Google Vehicle Ads** | Brasil não suportado (AU, CA, JP, US + beta Europa) | — | — | **indisponível** | Monitorar |
| Só Carrão, Autoscar, Comprecar | Regionais, sem API | — | 4 | — | Ignorar |

---

## 3. Fichas por portal

### 3.1 Webmotors (Santander + Carsales) — ativo, prioridade 3

**Modelo.** A Webmotors centraliza tudo no **Cockpit** (gestão de estoque + CRM da própria Webmotors). Um sistema de gestão de estoque terceiro (nosso caso) publica no estoque do Cockpit do lojista, e o Cockpit publica no site. Existe um portal de desenvolvedores (Sensedia) com as seguintes documentações: Autenticação; Códigos de Erro; API Browser (Swagger); **Integração com Gestores de Estoque Terceiros** (a que nos interessa); Consulta de Estoque (passiva, para classificados lerem o estoque do Cockpit); Consulta de Leads; Inclusão de Leads; API de Estoque Site; API MarketPlace. Coexiste um web service SOAP legado (`integracao.webmotors.com.br/wsEstoqueRevendedorWebMotors.asmx`) com operações `IncluirCarro`, `AlterarCarro`, `ExcluirCarro`, `IncluirFoto`, `IncluirFotoUrl`, `IncluirVideoUrl`, `ObterEstoqueAtualPaginado` e as tabelas `ObterMarca`, `ObterModelo`, `ObterVersao`, `ObterCor`, `ObterCambio`, `ObterCombustivel`, `ObterOpcionais`.

**Como obter acesso (plataforma, uma vez).**
1. Registrar em `portal-webmotors.sensedia.com/api-portal/usuario/registrar`.
2. Criar um APP e obter `client_id` e `client_secret`. Informar a "CALLBACK URL LEADS".
3. Abrir ticket de suporte informando razão social, CNPJ, site e forma de consentimento LGPD.
4. Homologação em ambiente de testes (segunda a sexta, 8h às 20h). Credenciais de teste expiram em 90 dias corridos.
5. Pedir promoção a produção.

**Como o lojista conecta (por loja).** No Cockpit: **Integrador (Novo) → Estoque Terceiro → Adicionar credencial**, escolhe o integrador (estoque.autos, depois de homologado) e cria um **Login API + Senha API**. O integrador pede ao lojista: login do Cockpit, senha do Cockpit, login API, senha API e CNPJ (é exatamente o que o Revenda Mais pede). Regra do Cockpit: só ficam publicados os carros marcados no gestor; anúncios feitos por fora são removidos.

**Auth.** Header `Authorization: Basic base64(client_id:client_secret)` para obter um access token com o usuário e senha de integração; cada requisição leva `client_id` e `access_token` nos headers. Token de homologação em `https://hlg-webmotors.sensedia.com/oauth/v1/access-token`; produção em `api-webmotors.sensedia.com`. Detalhes de expiração e refresh não estão na página pública de autenticação (só no API Browser, atrás de login).

**Taxonomia.** Códigos próprios `CodigoMarca`, `CodigoModelo`, `CodigoVersao` (decimal), além de cor, câmbio, combustível e opcionais com códigos próprios. Não aceita código FIPE. Exige tabela de mapeamento mantida e ressincronizada.

**Fotos.** Via Cockpit ou web service: recomendado **1920×1440** (fotos menores perdem qualidade ao serem redimensionadas); até **20 fotos**. Placas são borradas automaticamente.

**Leads.** Callback (webhook) por lead na URL cadastrada no APP, para anúncios com "Integração de CRM Terceiro" ativada no Cockpit, mais a API de Consulta de Leads (pull). Exige usuário "Integrador de API" ativo no Cockpit e lojista com **Plano Controle**, **Plano Performance** ou **Assinatura Motos**.

**Custos.** Do lojista: Plano Controle (mensalidade + franquia de leads) ou Performance (mensalidade + cobrança por lead, variável pelo preço do carro). Não há custo documentado para o integrador de estoque. A "API Site" (estoque do Cockpit para o site da loja) é produto comercial à parte e não é o nosso caso.

**Dificuldade: 4/5.** Técnica média (REST/JSON, mas com legado SOAP e taxonomia própria). Burocracia alta (ticket, LGPD, homologação com prazo e horário, dependência de o lojista ter Cockpit e plano ativo). Lista de gestores já homologados: Byus, ALM, RevendaPro, Boom, BNDV, Revenda Mais, Altimus, Disal, Click Garage, AutoGestor, EasyCar, Localiza, BRDealer, Batcar, Simples Veículo, DuSeller.

**Fontes.** portal-webmotors.sensedia.com/api-portal/content/api-marketplace · /api-portal/documentacao · /api-portal/documentacao/autenticacao · /api-portal/documentacao/consultar-estoque · /api-portal/documentacao/insercao-de-leads · ajuda.revendamais.com.br (artigo "Integrador – Adicionar Webmotors") · ajuda.cockpit.com.br (artigos 5028134683284 canais homologados, 36511174033556 fotos, 360057304252 Plano Controle) · comercialwebmotors.zendesk.com (artigo 360056563072 "O que é o Cockpit").

### 3.2 iCarros (Itaú) — descontinuado para lojistas

- 1º/06/2026: Itaú comunica o fim da operação voltada a pessoas jurídicas; concessionárias, lojas multimarcas, locadoras e montadoras deixam de ser atendidas. Equipes com prazo até 2/08/2026.
- 11/06/2026: ConectCar (Rede/Itaú + Porto) compra o iCarros. "A aquisição abrange apenas o segmento C2C do iCarros [...] A parte que atendia lojistas, concessionárias e montadoras está sendo descontinuada pelo Itaú." Sujeito a Cade e Banco Central.
- Verificado em 3/09/2026: `portalrevenda.icarros.com.br` e `icarros.com.br/portalrevenda/adesao.jsp` respondem 301 para a home pública. O domínio de documentação citado por SDKs antigos (`paginasegura.icarros.com.br/apidocs`) não resolve.
- Mesmo antes, nunca houve portal de desenvolvedores público: ERPs integravam com login e senha do Portal Revenda do lojista.

**Dificuldade: inviável.** Ação única: um contato com a ConectCar para saber se haverá canal PJ no futuro. Retirar iCarros de qualquer material de marketing que prometa integração.

**Fontes.** spbancarios.com.br (06/2026) · feebpr.org.br · investnews.com.br/negocios/conectcar-compra-icarros-itau · capitalaberto.com.br (06/2026).

### 3.3 Mercado Livre — ativo, prioridade 1

**Modelo.** API REST pública (`api.mercadolibre.com`) com OAuth 2.0. A plataforma registra **um app** no DevCenter; **cada loja autoriza** o app via OAuth. Veículos são anúncios **classificados** (`buying_mode: "classified"`): sem checkout, o comprador entra em contato.

**Como obter acesso.**
1. DevCenter → "Criar uma aplicação": nome, descrição, logo, **redirect URIs em HTTPS** (raiz de domínio, sem parte variável), escopos `read`, `write`, `offline_access`, PKCE (opcional, recomendado), tópicos de notificação e URL de callback. Recebe `client_id` e `client_secret`. No Brasil só é permitida 1 aplicação por titular de conta após validação dos dados.
2. **A loja precisa ter um pacote de publicação de veículos contratado com o time comercial do Mercado Livre.** Sem pacote alocado, o `POST /items` na categoria de veículos falha. Para testes, o suporte precisa ativar o usuário de teste como perfil `motors` e alocar um pacote de teste.
3. O Developer Partner Program (certificação) é opcional.

**Auth.** Authorization Code: `GET https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=...&redirect_uri=...&code_challenge=...&code_challenge_method=S256` → `POST https://api.mercadolibre.com/oauth/token` (`grant_type=authorization_code`, `code_verifier`). Resposta: `access_token` com **`expires_in: 21600` (6 h)**, `refresh_token` de **uso único, válido por 6 meses**, que gera um novo refresh a cada renovação. O token também cai após troca de senha, renovação do secret, revogação ou 4 meses sem chamadas.

**Taxonomia.** Categoria pai `MLB1743` → `MLB1744` Carros e Caminhonetes (`vertical: motors`, `catalog_domain: MLB-CARS_AND_VANS`, `max_pictures_per_item: 15`, título ≤ 60, descrição ≤ 50.000), `MLB1763` Motos, `MLB5839` Caminhões, `MLB1745` Carros Antigos, `MLB47400` Ônibus, `MLB76421` Veículos Pesados. `GET /categories/MLB1744/attributes` traz `BRAND`, `MODEL`, `TRIM` e `VEHICLE_YEAR` como obrigatórios, com `value_id` próprios (ex.: Kia = 374002). O `catalog_product_id` é preenchido automaticamente quando o veículo casa com o catálogo deles; não é obrigatório enviar.

**Publicação.** `POST /items` com `category_id`, `title`, `price`, `currency_id: "BRL"`, `available_quantity: 1`, `buying_mode: "classified"`, `listing_type_id` (`silver` = pacote de publicação; `gold` e `gold_premium` = destaque), `condition` (`new`/`used`), `channels: ["marketplace"]`, `pictures: [{source: url}]`, `video_id` (YouTube), `seller_contact` (telefones, e-mail) e `location` (`address_line`, `zip_code`, `city.id` no formato `BR-SP-56`), `attributes` (`BRAND`, `MODEL`, `TRIM`, `VEHICLE_YEAR`, `KILOMETERS` "92000 km", `FUEL_TYPE`, `TRANSMISSION`, `COLOR`, `DOORS`, `ARMORED`, `SINGLE_OWNER`, `LICENSE_PLATE`, `VIN_LAST_DIGITS` e dezenas de `HAS_*`). Descrição à parte em `POST /items/{id}/description` (`plain_text`, proibido telefone, site ou endereço no texto). Regras com data: desde 23/02/2026 pelo menos 1 foto é obrigatória (erro 173 `LTP_PICTURE_REQUIRED`); a partir de **1/10/2026** `seller_contact.country_code2` e `phone2` (WhatsApp) são obrigatórios para contas `car_dealer`. Ciclo de vida do anúncio de concessionária: **180 dias**, renovado enquanto o pacote estiver ativo; `closed` com `sub_status: expired` ao vencer.

**Fotos.** JPG/PNG (WebP não listado), até 10 MB, ideal 1200×1200 (mín. 500, máx. 1920), máximo 15. Upload por `POST /pictures/items/upload` (multipart) ou por URL em `pictures[].source` (sem redirect, resposta rápida; IPs do ML para allowlist: 216.33.196.4, 216.33.196.25, 54.88.218.97, 18.215.140.160, 18.213.114.129, 18.206.34.84).

**Leads.** Tópico de notificação **`vis_leads`** (ações `whatsapp`, `call`, `question`, `visit_request`, `contact_request`, `reservation`, `quotations`). Ao receber a notificação, `GET /vis/leads/{id}`, ou em lote `GET /vis/users/{user_id}/leads/buyers?date_from&date_to&contact_types=...`. Retorna nome, e-mail, telefone e documento do comprador logado, mais `channel`, `contact_type`, `created_at`, `status`; `include_guest=true` agrega cliques de não logados. Perguntas públicas usam o tópico `questions`; a doc recomenda não ativar os dois ao mesmo tempo. Tópicos `payments` e `messages` não se aplicam a veículos. A notificação exige resposta 200 rápida (o ML reenvia).

**Custos.** Pacote de publicação negociado comercialmente (mensal a anual, renovação automática, cancelamento só pela UI). Preço não público.

**Dificuldade: 3,5/5.** Técnica clássica e bem documentada; o peso está no gate comercial por loja, nas regras que mudam por data, nos 40+ atributos e no refresh token de uso único (exige lock).

**Fontes.** developers.mercadolivre.com.br: crie-uma-aplicacao-no-mercado-livre · autenticacao-e-autorizacao · categorias-e-atributos-veiculos · publicacao-de-automoveis · automovel-gerenciamento-de-pacotes · trabalhar-com-imagens · pessoas-interessadas · produto-receba-notificacoes · rate-limit-erro-429 · developer-partner-program.

### 3.4 OLX Brasil — ativo, prioridade 2

**Modelo.** **Autoupload**: importação de anúncios em lote por `PUT https://apps.olx.com.br/autoupload/import` (JSON, UTF-8, **máx. 1 MB por chamada**), com OAuth 2.0 por loja, API de Leads (webhook push) e API de Chat separadas. A plataforma precisa ser cadastrada como **integrador** pela OLX.

**Como obter acesso.**
1. Cadastro do integrador por e-mail `suporteintegrador@olxbr.com` ou WhatsApp (21) 3199-8540 (seg-sex 9h-18h): nome, app, descrição, site, telefone, e-mail e 1 a 3 redirect URIs. A OLX devolve `client_id`/`client_secret`. Prazo não divulgado.
2. **Cada loja precisa de plano de empresa**: desde jan/2025 a API é vedada aos planos de autônomo (Essencial, Plus); só **Essencial Empresa, Plus Empresa, Premium Empresa** liberam. Contratação pelo 0800 022 9800. Preço não público.

**Auth.** `GET https://auth.olx.com.br/oauth?client_id&redirect_uri&response_type=code&scope=autoupload autoservice&state` (código expira em 10 min) → `POST https://auth.olx.com.br/oauth/token` (`grant_type=authorization_code`). Escopos: `basic_user_info`, `autoupload` (anúncios), `autoservice` (leads/webhooks), `chat`. **A doc não documenta `expires_in` nem refresh token**: duração e renovação não confirmadas (tratar como token longo e monitorar 401).

**Payload (categoria 2020 = carros, vans e utilitários; 2060 motos; 2040 caminhões).** `ad_list[]` com `id` (único, `[A-Za-z0-9_{}-]{1,19}`), `operation` (`insert`/`delete`), `category`, `subject` (2-90), `body` (2-6000), `phone` (DDD+número), `type: "s"`, `price` (sem centavos, obrigatório desde 5/08/2025), `zipcode`, `images[]` (URLs, **máx. 20**, primeira é a capa, obrigatório desde 5/08/2025), `videos[]` (1 YouTube) e `params`: `regdate`, `mileage`, `gearbox` (1 Manual, 2 Automático, 3 Semi-automático), `fuel` (1 Gasolina, 2 Álcool, 3 Flex, 4 GNV **deprecated**, 5 Diesel, 6 Híbrido, 7 Elétrico), `vehicle_brand`, `vehicle_model`, `vehicle_version` (IDs da OLX), `vehicle_tag` (placa, validada), `doors` (1 = 2 portas, 2 = 4 portas), `cartype` (1 Passeio, 2 Conversível, 3 Pick-up, 4 Antigo, 5 SUV, 6 Buggy, 7 Van/Utilitário, 8 Sedã, 9 Hatch), `carcolor` (1..10), `car_steering` (1 Hidráulica, 2 Elétrica, 3 Mecânica, 4 Assistida), `motorpower`, `exchange`, `financial[]` (1 Financiado, 2 IPVA pago, 3 Com multas, 4 De leilão), `owner`, `car_features[]` (1 Ar, 2 Direção hidráulica, 3 Vidro elétrico, 4 Trava, 5 Airbag, 6 Alarme, 7 Som, 8 Sensor de ré, 9 Câmera de ré, 10 Blindado), `gnv_kit`, `warranty`, `owner_manual`, `dealership_review`, `extra_key`. Retorno síncrono: `statusCode 0` (validado, processamento assíncrono), `-2` bloqueio por excesso, `-4` validação (`NO_IMAGE`, `ERROR_VEHICLE_BRAND_MODEL_VERSION_INVALID`, `INVALID_PLATE`...), `-6` sem permissão (sem plano). Status: `POST /autoupload/import/{token}` e `GET /autoupload/ads/{list_id}`.

**Taxonomia.** Catálogo próprio: `POST /autoupload/car_info` (marcas) → `/car_info/{marca}` (modelos) → `/car_info/{marca}/{modelo}` (versões); `moto_info` para motos. Os IDs foram **reequalizados em 25/09/2025** e anúncios com IDs antigos são rejeitados: ressincronizar periodicamente. A placa é validada contra o catálogo; se não bater, o lote pode ser bloqueado.

**Leads.** `POST https://apps.olx.com.br/autoservice/v1/lead` registra a URL de webhook. A OLX faz `POST` por lead: `source` (`whatsapp`, `telefone`, `chat`, `financing`, `olx`), `listId`, `linkAd`, `name`, `email`, `phone`, `message`, `createdAt`, `adId` (nosso id), `adsInfo` (enriquecido, só Autos). Leads de chat só avisam que há conversa; responder exige a Chat API (escopo `chat`). Existe webhook genérico de mudança de status do anúncio.

**Dificuldade: 4/5.** Técnica simples (JSON em lote), mas homologação manual sem prazo, plano pago por loja, taxonomia própria que muda, página oficial de campos de autos marcada como "em breve" (dicionário inferido da doc de leads `adsInfo`) e expiração de token não documentada.

**Fontes.** developers.olx.com.br: anuncio/api/oauth.html · anuncio/api/import.html · anuncio/api/autos/car_models.html · anuncio/api/publishing_status.html · anuncio/api/published_ads_status.html · lead/how_to.html · lead/leads.html · lead/descriptions/autos/sub_auto.html · chat/home.html · webhooks/home.html · ajuda.olx.com.br (como-cadastrar-integrador; integradores-e-importacao-de-anuncios).

### 3.5 Chaves na Mão — ativo, o mais aberto

API REST pública com Swagger (`api.chavesnamao.com.br/integration/vehicles/swagger/static/index.html`), base `https://api.chavesnamao.com.br/integration/v1/`, ambiente de homologação próprio, manual em PDF (2022). **Aceita código FIPE** para padronizar marca/modelo (temos `fipe_code`). Leads por **webhook**. HTTP 429 documentado. Alternativa: XML lido em janelas fixas (7h, 13h, 19h, 1h). Contato técnico: ws@chavesnamao.com.br. **Dificuldade: 2/5.** Ideal como segundo adapter "barato" depois do Mercado Livre, para provar a abstração.

### 3.6 Usadosbr — ativo

E-mail para suporte@usadosbr.com com CNPJ e nome do integrador; devolvem login/senha de integração. Aceita XML completo de catálogo e é compatível com os principais hubs. **Dificuldade: 2/5.** Entra como feed XML por loja.

### 3.7 Meta: Automotive Inventory Ads, Marketplace e WhatsApp

- **Automotive Inventory Ads (AIA).** Catálogo de veículos alimentado por feed (CSV/TSV/XML) buscado por URL pelo menos a cada 24 h. Campos usuais: `vehicle_id`, `title`, `description`, `url`, `image[0].url`, `make`, `model`, `year`, `mileage.value/unit`, `price`, `state_of_vehicle` (NEW/USED), `exterior_color`, `transmission`, `fuel_type`, `body_style`, `vin`, `condition`, `address`, `dealer_id`, `availability`. É produto de anúncio pago (Ads Manager), não listagem orgânica. Disponibilidade explícita para o Brasil não confirmada em página oficial; validar criando um catálogo do tipo "Veículos" no Commerce Manager. **Dificuldade: 2/5.** Custa uma rota de feed por loja; combina com os pixels Meta que o plano Pro já injeta na vitrine.
- **Marketplace orgânico.** Desde 2023 contas comerciais só listam via "Marketplace-approved Inventory Partner". Nenhum parceiro brasileiro confirmado. **Ignorar.**
- **WhatsApp catálogo (Cloud API).** Permitido pela política de comércio, mas sem campos automotivos (nome, preço, descrição, foto, link). **Dificuldade 2/5, valor baixo.** Complemento futuro.

### 3.8 Mobiauto, NaPista, Autoline, Seminovos.com.br

- **Mobiauto** (Banco Pan): integração de estoque existe, mas a revenda precisa ser "liberada pela Mobiauto"; sem documentação pública. Caminho: contato comercial pedindo o mesmo status de integrador dos hubs. **4/5.**
- **NaPista** (Banco BV; `ext.meucarronovo.com.br` já exibe marca NaPista): só lojistas credenciados pelo BV. **5/5.**
- **Autoline** (Bradesco): ativo, integrações via hubs, reclamações recentes de instabilidade. **4/5.**
- **Seminovos.com.br**: exige CNPJ com CNAE de revenda; sem API pública; via hub. **3,5/5.**

### 3.9 Descartados

Google Vehicle Ads (Brasil não suportado; rich result "Vehicle listing" descontinuado em jun/2025 e era só EUA; manter o JSON-LD `Car` + `Offer` genérico que a vitrine já emite), Carros na Web (catálogo editorial), Kavak (compra carros, não anuncia terceiros), plataformas de repasse (B2B loja-a-loja, fora do escopo), Só Carrão (PR/SC), Autoscar (MG), Comprecar (interior SP).

### 3.10 Alternativa: integrar via hub

Quase todos os hubs (Revenda Mais, Altimus, AutoGestor, Simples Veículo, Boom) são concorrentes diretos e não expõem API para terceiros. A exceção é a **Autoconf** (API REST pública, feed JSON/XML, webhooks de lead em `api.autoconf.com.br/doc`). Usar um hub trocaria burocracia por dependência e custo por loja; só faz sentido como atalho tático para portais fechados (Mobiauto, Autoline, Seminovos). Para os três grandes, integração direta é o caminho.

---

## 4. O que a plataforma tem hoje

Fatos do código, relevantes para o desenho:

- **Runtime.** Next 16 (App Router) em Cloudflare Workers via OpenNext. `wrangler.jsonc` tem só os bindings `ASSETS` e `IMAGES`; **não há Cron Triggers, Queues, KV, R2 nem Durable Objects configurados.** O Worker gerado (`.open-next/worker.js`) exporta apenas `fetch`.
- **Jobs periódicos** rodam fora do Worker, em GitHub Actions (`.github/workflows/fipe-sync.yml`, `fipe-full-import.yml`, `fipe-historical.yml`), com scripts `tsx` usando `SUPABASE_SECRET_KEY`.
- **Banco.** Supabase Postgres com RLS. `vehicles` tem brand, model, version, year_fab, year_model, plate (opcional, nunca exposto), color (texto livre com lista sugerida de 17 cores), fuel (`flex, gasolina, etanol, diesel, hibrido, eletrico, gnv`), transmission (`manual, automatico, cvt, automatizado`), mileage, doors (2-6), category (`carro, moto, utilitario, caminhao`), price, description, optionals `text[]` (lista de ~60 strings, grafia Webmotors), photos `jsonb [{id, path, url}]` (primeira é capa; máx. 30), featured, status (`available, reserved, sold, archived`), sold_at, consigned, condition_flags (`unico_dono, ipva_pago, licenciado, blindado, leilao, cautelar_aprovada, garantia_fabrica, revisoes_concessionaria, revisoes_agenda, aceita_troca, alienado, adaptado_pcd`) e snapshot FIPE (`fipe_code`, `fipe_year_id`, `fipe_price`, `fipe_reference`). Obrigatórios no cadastro: só brand, model e price (`src/lib/validation.ts:178`).
- **Faltam no modelo** campos que os portais pedem: carroceria (hatch/sedã/SUV/picape...), motor (1.0, 2.0 turbo), direção, final do chassi (ML `VIN_LAST_DIGITS`), vídeo (YouTube), condição 0 km, CNPJ da loja, telefone de WhatsApp no formato do ML.
- **Loja (`tenants`).** name, phone, whatsapp, email, address `{cep, street, number, complement, neighborhood, city, state}`, plan (`basico` 20 veículos ativos, `pro` 60), custom_domain. **Não há CNPJ.**
- **Leads.** `type` (`proposal, whatsapp, phone`), name, phone, email, message, proposal_value, trade_vehicle, status, notes, utm, device. **Não há origem nem id externo.** A constraint `proposal_requires_contact` exige nome e telefone quando `type = 'proposal'`. Criação pública via RPC `create_lead` (security definer). Notificação por e-mail via Resend (`src/lib/email.ts`) e realtime no admin (`LeadsRealtime`).
- **Fotos.** Processadas no upload pelo binding Cloudflare Images para **WebP 1600×1200 q80** (`src/lib/images.ts:51`) e gravadas no bucket público `vehicle-photos` do Supabase em `{tenantId}/...`. Não há variante JPEG nem 1920×1440.
- **Catálogo FIPE** próprio (`fipe_brands/models/years/prices`, ids do parallelum, código FIPE "001234-5"), sincronizado mensalmente. Serve de âncora para o mapeamento de taxonomia dos portais.
- **Admin.** Rotas `/admin`, `/admin/veiculos` (+`novo`, `[id]`), `/admin/leads`, `/admin/site`, `/admin/equipe`, `/admin/configuracoes`. Padrão: server actions com `requireStaff()` + zod + `revalidatePath`; componentes `PageHeader`, `FormBanner`, `CheckboxGrid`, `ChipPicker`, `StatusBadge`. Papéis `owner`, `admin`, `vendedor`.
- **Vitrine.** `/{slug}/carros/{id}` com URL canônica por `storefrontUrl()` (domínio próprio no Pro), sitemap por loja e JSON-LD `Car` + `Offer`.
- **Rotas de API existentes:** `/api/fipe/[resource]` e `/api/stripe/webhook`. Segredos entram como secrets do Worker (`SUPABASE_SECRET_KEY`, `STRIPE_*`, `RESEND_API_KEY`, `CLOUDFLARE_*`).
- **Testes:** vitest em `src/lib/__tests__` e `src/lib/fipe/__tests__`.
- O documento de produto da v1 (`legacy/project.md`, seção 3.9) já previa exatamente este módulo: adapter por marketplace com `publish/update/remove/receiveLeads`, canal de origem no lead e log de publicação.

---

## 5. Arquitetura proposta

### 5.1 Princípios

1. **estoque.autos é a fonte da verdade.** O lojista edita aqui; os portais recebem cópias. Nunca importamos alterações feitas no portal (exceto status de "removido pela moderação").
2. **Um adapter por portal, um contrato comum.** Toda diferença de payload, taxonomia e auth fica dentro do adapter. O resto da plataforma só conhece `PortalAdapter`.
3. **Sincronização assíncrona, idempotente e observável.** Nenhuma chamada a portal acontece dentro de uma server action. A action grava a intenção e enfileira; um worker executa com retry, backoff e registro de erro por anúncio.
4. **Estado explícito por (veículo, portal).** O lojista vê, para cada carro, em quais portais está, com link, e por que falhou.
5. **Gate comercial como estado de produto.** "Sem plano no portal" e "credencial inválida" são estados da conexão, com instrução de como resolver, não erros de log.
6. **Credenciais de terceiros nunca em texto puro** e nunca acessíveis pelo cliente (RLS deny-all, leitura só no servidor).

### 5.2 Visão geral

```mermaid
flowchart LR
  subgraph Admin["Painel (Next, server actions)"]
    VF[Formulário do veículo\n"Publicar em: ☐ ML ☐ OLX ☐ Webmotors"]
    IC[/admin/integracoes\nconectar · status · pendências/]
  end
  subgraph DB["Supabase Postgres"]
    PC[(portal_connections)]
    PL[(portal_listings)]
    PJ[(portal_sync_jobs)]
    PE[(portal_events)]
    PT[(portal_taxonomy + _map)]
    LE[(leads + source)]
  end
  subgraph Worker["Cloudflare Worker"]
    CRON[[Cron Trigger */2 min\n→ /api/integrations/worker]]
    ADP{{Adapters\nmercadolivre · olx · webmotors · chavesnamao}}
    WH[/api/integrations/{portal}/webhook/]
    OA[/api/integrations/{portal}/oauth/*/]
    FEED[/api/feeds/{token}/*.csv|xml/]
  end
  VF -->|upsert desired + enqueue| PL & PJ
  IC --> PC
  CRON --> PJ --> ADP --> PL
  ADP <-->|HTTPS| Portais[(Mercado Livre · OLX · Webmotors · Chaves na Mão)]
  Portais -->|leads / notificações| WH --> PE --> PJ
  PJ -->|process_event| LE
  OA <--> Portais
  Portais -->|Meta AIA / Usadosbr buscam| FEED
```

### 5.3 Modelo de dados (nova migration `2026xxxx_portais.sql`)

```sql
-- catálogo de portais suportados (enum via check, como o resto do schema)
-- 'mercadolivre','olx','webmotors','chavesnamao','usadosbr','meta_catalog'

create table public.portal_connections (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  portal              text not null,
  status              text not null default 'pending'
                      check (status in ('pending','active','needs_plan','error','disconnected')),
  external_account_id text,            -- ML user_id · OLX account · Webmotors CNPJ
  credentials         bytea,           -- AES-GCM (ver 5.10); nunca sai do servidor
  credentials_iv      bytea,
  token_expires_at    timestamptz,     -- ML: 6h; agenda refresh_token
  settings            jsonb not null default '{}'::jsonb,
                      -- {auto_publish:boolean, listing_type:'silver', phone_override, feed_token}
  last_error          text,
  last_ok_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (tenant_id, portal)
);

create table public.portal_listings (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  vehicle_id       uuid not null references public.vehicles(id) on delete cascade,
  portal           text not null,
  desired          boolean not null default true,   -- lojista quer este carro neste portal
  status           text not null default 'queued'
                   check (status in ('queued','publishing','active','paused','error','removed','rejected')),
  external_id      text,            -- MLB123 · OLX list_id · Webmotors código
  external_url     text,
  content_hash     text,            -- hash do payload canônico; evita sync sem mudança
  payload_snapshot jsonb,           -- último payload enviado (debug/suporte)
  expires_at       timestamptz,     -- ML: 180 dias
  last_error       text,
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (vehicle_id, portal)
);

create table public.portal_sync_jobs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  portal      text not null,
  vehicle_id  uuid references public.vehicles(id) on delete cascade,
  kind        text not null check (kind in
              ('publish','update','unpublish','sync_tenant','refresh_token',
               'sync_taxonomy','process_event','fetch_leads','renew')),
  payload     jsonb not null default '{}'::jsonb,
  status      text not null default 'pending'
              check (status in ('pending','running','done','failed','dead')),
  attempts    int not null default 0,
  run_after   timestamptz not null default now(),
  locked_at   timestamptz,
  locked_by   text,
  last_error  text,
  created_at  timestamptz not null default now()
);
create index portal_sync_jobs_due_idx on public.portal_sync_jobs (run_after)
  where status = 'pending';
-- coalesce: no máximo um job pendente por (veículo, portal, tipo)
create unique index portal_sync_jobs_dedupe_idx
  on public.portal_sync_jobs (portal, vehicle_id, kind) where status = 'pending';

create table public.portal_events (          -- webhooks crus, sempre aceitos com 200
  id           uuid primary key default gen_random_uuid(),
  portal       text not null,
  tenant_id    uuid,                          -- resolvido depois (user_id/CNPJ/token)
  external_key text,                          -- idempotência (id do evento/lead no portal)
  headers      jsonb,
  body         jsonb not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  status       text not null default 'pending' check (status in ('pending','done','ignored','failed')),
  error        text,
  unique (portal, external_key)
);

create table public.portal_taxonomy (         -- catálogos dos portais (global, como fipe_*)
  portal       text not null,
  kind         text not null,                  -- brand|model|version|color|fuel|transmission|feature|body|city
  external_id  text not null,
  parent_id    text,
  name         text not null,
  meta         jsonb,
  synced_at    timestamptz not null default now(),
  primary key (portal, kind, external_id)
);

create table public.portal_taxonomy_map (     -- nosso valor → id do portal
  portal      text not null,
  kind        text not null,
  local_key   text not null,                   -- fipe brand/model id, ou valor normalizado (cor, combustível…)
  external_id text not null,
  confidence  numeric(3,2) not null default 1, -- 1 = exato/manual; <1 = fuzzy
  source      text not null default 'auto' check (source in ('auto','manual')),
  tenant_id   uuid,                            -- null = global; preenchido = override da loja
  primary key (portal, kind, local_key, coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'))
);

-- veículos: campos que os portais exigem
alter table public.vehicles
  add column body_type   text check (body_type in
    ('hatch','sedan','suv','picape','perua','minivan','cupe','conversivel','van','utilitario','outro')),
  add column engine      text,                         -- "1.0", "2.0 turbo", "1.6 16V"
  add column steering    text check (steering in ('hidraulica','eletrica','mecanica','assistida')),
  add column vin_last6   text check (vin_last6 ~ '^[A-Z0-9]{6}$'),
  add column video_url   text,                         -- YouTube
  add column zero_km     boolean not null default false;

-- loja: exigido por Webmotors (credencial) e Mercado Livre (seller)
alter table public.tenants add column cnpj text check (cnpj ~ '^\d{14}$');

-- leads vindos de portais
alter table public.leads
  add column source      text not null default 'site'
             check (source in ('site','mercadolivre','olx','webmotors','chavesnamao','usadosbr','meta')),
  add column channel     text,                         -- contact_type cru do portal (whatsapp, call, question, chat…)
  add column external_id text,
  add column external_url text,
  add column raw         jsonb;
alter table public.leads drop constraint leads_type_check;
alter table public.leads add constraint leads_type_check
  check (type in ('proposal','whatsapp','phone','portal'));
-- 'portal' fica fora de proposal_requires_contact (portal pode mandar só e-mail)
create unique index leads_external_idx on public.leads (tenant_id, source, external_id)
  where external_id is not null;
```

RLS: `portal_connections`, `portal_sync_jobs`, `portal_events` e `portal_taxonomy*` **sem policy para `anon`/`authenticated`** (acesso só pelo service role no servidor). `portal_listings` com `select` para membros do tenant (a UI lê status e link); escrita só no servidor. A view `vehicles_public` não projeta os novos campos internos (`vin_last6`, `engine` pode ser público).

### 5.4 Contrato dos adapters

```ts
// src/lib/integrations/types.ts
export type PortalId = 'mercadolivre' | 'olx' | 'webmotors' | 'chavesnamao' | 'usadosbr' | 'meta_catalog';

/** Veículo + loja já resolvidos e normalizados; única entrada dos adapters. */
export interface CanonicalVehicle {
  vehicle: Vehicle & { body_type; engine; steering; vin_last6; video_url; zero_km };
  tenant: Tenant & { cnpj: string | null };
  photos: { url_jpeg: string; url_webp: string; width: number; height: number }[]; // já em 1920×1440
  storefrontUrl: string;           // VDP canônica (domínio próprio ou /{slug}/carros/{id})
  fipe?: { brandId; modelId; yearId; code };
}

export interface PortalAdapter {
  id: PortalId;
  capabilities: { perItem: boolean; batch: boolean; leadsWebhook: boolean; oauth: boolean; feed: boolean };
  /** OAuth (ML/OLX) ou validação de credenciais (Webmotors/Chaves na Mão). */
  connect(input: ConnectInput): Promise<ConnectResult>;
  refreshCredentials?(conn: Connection): Promise<Credentials>;
  /** Traduz o canônico para o payload do portal; lança MappingError com campos faltantes. */
  mapVehicle(v: CanonicalVehicle, conn: Connection): Promise<PortalPayload>;
  publish(conn: Connection, payload: PortalPayload): Promise<{ externalId: string; url?: string; expiresAt?: Date }>;
  update(conn: Connection, externalId: string, payload: PortalPayload): Promise<void>;
  unpublish(conn: Connection, externalId: string): Promise<void>;
  /** OLX: um lote por loja; ML/Webmotors: no-op ou renovação. */
  syncTenant?(conn: Connection, desired: CanonicalVehicle[]): Promise<TenantSyncResult>;
  syncTaxonomy(): Promise<void>;                          // enche portal_taxonomy
  /** Webhook → lead canônico (ou null para eventos que não são lead). */
  parseEvent(event: PortalEvent, conn?: Connection): Promise<InboundLead | ListingStatusChange | null>;
  /** Classifica erro do portal: 'needs_plan' | 'auth' | 'validation' | 'rate_limit' | 'transient' */
  classifyError(err: unknown): PortalErrorKind;
}
```

Layout de pastas:

```
src/lib/integrations/
  types.ts  registry.ts  canonical.ts  crypto.ts  queue.ts  worker.ts  taxonomy.ts  errors.ts
  mercadolivre/  adapter.ts  oauth.ts  client.ts  mapping.ts  leads.ts
  olx/           adapter.ts  oauth.ts  client.ts  mapping.ts  leads.ts
  webmotors/     adapter.ts  client.ts  mapping.ts  leads.ts
  chavesnamao/   adapter.ts  client.ts  mapping.ts
  feeds/         meta-aia.ts  usadosbr-xml.ts
  __tests__/     mapping.*.test.ts  queue.test.ts  webhook.*.test.ts
```

### 5.5 Fila e execução

**Decisão:** fila em tabela Postgres (`portal_sync_jobs`, claim com `for update skip locked` via RPC) + **Cron Trigger** do Cloudflare a cada 2 minutos + disparo imediato best-effort após cada server action. Sem Cloudflare Queues (exige plano pago e outro binding) e sem GitHub Actions (latência de minutos e sem garantia de horário).

- **Worker custom.** O Worker do OpenNext exporta só `fetch`. Criar `worker.ts` na raiz que reexporta o handler gerado e adiciona `scheduled`:

  ```ts
  // worker.ts — apontado por wrangler.jsonc "main"
  import openNext from './.open-next/worker.js';
  export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js';
  export default {
    fetch: openNext.fetch,
    async scheduled(_event, env, ctx) {
      ctx.waitUntil(fetch(`${env.NEXT_PUBLIC_APP_URL}/api/integrations/worker`, {
        method: 'POST', headers: { 'x-cron-secret': env.INTEGRATIONS_CRON_SECRET },
      }));
    },
  };
  ```
  e em `wrangler.jsonc`: `"main": "worker.ts"`, `"triggers": { "crons": ["*/2 * * * *"] }`. Validar com `wrangler dev --test-scheduled` (`curl "http://localhost:8787/__scheduled"`). Conferir a versão do adapter OpenNext no momento da implementação (1.19.x hoje) quanto ao how-to "custom worker".
- **Rota do worker** (`/api/integrations/worker`): exige `x-cron-secret`; reclama até N jobs (`claim_portal_jobs(n, worker_id)`), respeita um orçamento de tempo (~25 s) e processa em série por portal para respeitar rate limit. Retry com backoff exponencial (1, 5, 30 min, 2 h, 12 h); depois de 6 tentativas vira `dead` e o anúncio fica `error` com mensagem legível.
- **Disparo imediato.** Nas actions de veículo (`createVehicleAction`, `updateVehicleAction`, mudança de status), depois de enfileirar, `after(() => runWorker({ tenantId }))` processa os jobs daquela loja sem esperar o cron.
- **Gatilhos que enfileiram:**
  - veículo criado/editado com `desired = true` → `publish` ou `update` (só se `content_hash` mudou);
  - status → `sold`/`archived`/`reserved` (configurável) → `unpublish`;
  - fotos alteradas → `update`;
  - desmarcar portal → `unpublish`;
  - conexão criada → `sync_tenant` (publica todos os marcados) e `sync_taxonomy` se o catálogo global tiver mais de 7 dias;
  - ML: `refresh_token` 30 min antes de `token_expires_at`; `renew` 7 dias antes de `expires_at` do anúncio;
  - OLX: `sync_tenant` agrega insert/delete de todos os carros da loja num único `PUT` (limite 1 MB → fatiar).
- **Concorrência.** `refresh_token` do ML é de uso único: um job por conexão, lock por `locked_by`, e a troca grava o novo refresh antes de liberar. Qualquer 401 durante o refresh marca a conexão `error` e notifica a loja.

### 5.6 Rotas HTTP novas

| Rota | Método | Função |
|---|---|---|
| `/api/integrations/[portal]/oauth/start` | GET | Gera `state` assinado (HMAC com tenant_id, nonce, expiração) + PKCE e redireciona para o portal. Requer sessão `owner`/`admin`. |
| `/api/integrations/[portal]/oauth/callback` | GET | Valida `state`, troca `code` por tokens, resolve `external_account_id` (ML: `user_id`; OLX: `basic_user_info`), grava conexão cifrada, enfileira `sync_tenant`, redireciona para `/admin/integracoes/[portal]`. Redirect URIs cadastradas: `https://estoque.autos/api/integrations/mercadolivre/oauth/callback` e idem OLX (HTTPS obrigatório nos dois). |
| `/api/integrations/[portal]/webhook` | POST | Aceita, valida o que der (OLX: token na URL; Webmotors: segredo por conexão na URL; ML: sem assinatura, validar buscando o recurso com o token da loja), grava em `portal_events` com `external_key` e responde **200 em < 500 ms**. Enfileira `process_event`. |
| `/api/integrations/worker` | POST | Processador de jobs (cron + `after`). |
| `/api/feeds/[token]/meta-vehicles.csv` | GET | Feed AIA da loja (token aleatório em `settings.feed_token`; cache 1 h). |
| `/api/feeds/[token]/usadosbr.xml` | GET | Feed XML da loja. |

O `middleware.ts` já isenta `/api` da reescrita de domínio próprio; manter.

### 5.7 Taxonomia e mapeamento

O problema central dos três grandes: cada um tem IDs próprios de marca, modelo e versão (ML `BRAND/MODEL/TRIM` com `value_id`; OLX `vehicle_brand/model/version` com reequalização em 25/09/2025; Webmotors `CodigoMarca/Modelo/Versao`). Só Chaves na Mão aceita FIPE.

Estratégia em camadas, executada em `mapVehicle`:

1. **Chave local.** Se o veículo tem snapshot FIPE, a chave é `(fipe brand id, fipe model id, fipe year id)`; senão, nome normalizado (`unaccent`, minúsculas, sem pontuação, `1.0 turbo` → tokens).
2. **Cache de mapeamento** (`portal_taxonomy_map`): acerto direto → usa.
3. **Match automático** contra `portal_taxonomy`: marca por nome exato normalizado; modelo por nome exato dentro da marca, depois por similaridade trigram (`pg_trgm`, extensão disponível no Supabase) com limiar 0,6 e ano compatível; versão idem. Gravar com `confidence < 1`.
4. **Pendência.** Sem match com confiança ≥ 0,8, o anúncio vai para `status = 'error'` com `last_error = 'mapeamento pendente: versão'` e aparece em **Integrações → Pendências**, onde o lojista (ou o suporte) escolhe o valor do portal numa busca; a escolha grava `source = 'manual'` e reenfileira. Overrides por loja quando o mesmo modelo precisar de valor diferente.
5. **Listas fixas** (combustível, câmbio, cor, portas, carroceria, opcionais, flags) ficam em código em `mapping.ts` de cada adapter, com teste unitário cobrindo todos os valores dos nossos enums.

Tabela de correspondência das listas fixas (os valores do ML são `value_name` a resolver por `/categories/MLB1744/attributes`):

| Nosso campo | Mercado Livre | OLX | Webmotors |
|---|---|---|---|
| fuel `flex` | FUEL_TYPE "Flex" | `fuel: 3` | `ObterCombustivel` |
| fuel `gasolina` / `etanol` / `diesel` | "Gasolina" / "Álcool" / "Diesel" | 1 / 2 / 5 | idem |
| fuel `hibrido` / `eletrico` | "Híbrido" / "Elétrico" | 6 / 7 | idem |
| fuel `gnv` | "GNV" ou "Gasolina" + `HAS_GNV` | `fuel` deprecado (4): usar 1 ou 3 + `gnv_kit: 1` | idem |
| transmission `manual` / `automatico` / `cvt` / `automatizado` | TRANSMISSION "Manual" / "Automática" / "CVT" / "Automatizada" | 1 / 2 / 2 / 3 | `ObterCambio` |
| doors 2,3 / 4,5,6 | DOORS "2"… | `doors: 1` / `2` | Portas |
| body_type | VEHICLE_BODY_TYPE | `cartype` 9 hatch, 8 sedã, 5 SUV, 3 pick-up, 7 van, 2 conversível, 4 antigo, 1 passeio | Carroceria |
| color | COLOR (lista) | `carcolor` 1..10 (10 = outra) | `ObterCor` |
| condition_flags `blindado` / `unico_dono` / `ipva_pago` / `leilao` / `alienado` / `aceita_troca` / `garantia_fabrica` / `revisoes_*` | ARMORED / SINGLE_OWNER / — / — / — / — / — / — | `car_features: 10` / `owner: 1` / `financial: 2` / `financial: 4` / `financial: 1` / `exchange: 1` / `warranty: 1` / `dealership_review: 1` | flags do Cockpit |
| optionals (~60) | `HAS_AIR_CONDITIONING`, `HAS_ABS_BRAKES`, … (mapa string → atributo) | `car_features` 1..9 (só 9 recursos; resto vai para `body`) | `ObterOpcionais` |
| steering | POWER_STEERING? (verificar lista) | `car_steering` 1 hidráulica, 2 elétrica, 3 mecânica, 4 assistida | — |
| engine | ENGINE | `motorpower` (tabela) | Motor |
| vin_last6 / plate | VIN_LAST_DIGITS / LICENSE_PLATE | — / `vehicle_tag` | Placa |
| zero_km | `condition: "new"` | `regdate` + categoria | 0 km |

Jobs `sync_taxonomy` semanais por portal (e sob demanda no admin da plataforma), com poda de ids removidos e alerta se o volume cair mais de 20% (sinal de reequalização como a da OLX).

### 5.8 Fotos

- **Novo pipeline no upload** (`src/lib/images.ts`): gerar duas variantes com o binding Images: `webp` 1600×1200 (vitrine, como hoje) e **`jpeg` 1920×1440 q85** (portais; Webmotors recomenda 1920×1440, ML aceita só JPG/PNG até 1920). Guardar no mesmo objeto de foto: `{id, path, url, jpeg_path, jpeg_url, w, h}`.
- **Backfill** das fotos existentes por script (`scripts/photos-backfill-jpeg.ts`), lendo o WebP e reprocessando; o adapter usa `jpeg_url ?? url` para não bloquear.
- **Ordem** = ordem do array (capa primeiro), igual em todos os portais. Limites por portal aplicados no adapter: ML 15, OLX 20, Webmotors 20, Chaves na Mão (ver Swagger).
- **URLs** públicas do Supabase Storage funcionam para "portal baixa a URL" (ML e OLX fazem isso). Sem redirects, resposta rápida; se o Supabase impuser proteção, alternativa é uma rota `/p/{tenant}/{foto}.jpg` no Worker.
- Manter o limite de 30 no cadastro; o excedente simplesmente não vai para portais que aceitam menos.

### 5.9 Leads dos portais

- Todo lead externo entra por `portal_events` → job `process_event` → `adapter.parseEvent` → insert em `leads` com `type = 'portal'`, `source`, `channel`, `external_id`, `external_url`, `raw`, e `vehicle_id` resolvido por `portal_listings.external_id`. Dedupe por `(tenant_id, source, external_id)`.
- **Mercado Livre:** notificação `vis_leads` traz só o `resource`; o job faz `GET /vis/leads/{id}` com o token da loja (isso também autentica a origem, já que a notificação não é assinada). Tenant resolvido por `user_id` → `portal_connections.external_account_id`. Perguntas públicas (`questions`) viram lead `channel = 'question'` com a pergunta em `message` (responder pelo ML, fora do escopo inicial).
- **OLX:** o webhook já traz nome, e-mail, telefone, mensagem, `source` e `adId` (nosso id). Registrar a URL com token por loja em `/autoservice/v1/lead`. Chat exige a Chat API (fase posterior).
- **Webmotors:** callback na URL do APP; resolver a loja pelo CNPJ/código do lojista no payload (confirmar campos no API Browser durante a homologação). Complementar com `fetch_leads` (Consulta de Leads) a cada hora como rede de segurança.
- **Chaves na Mão:** webhook documentado no manual; mesmo fluxo.
- Reaproveitar `sendLeadNotificationEmail` e o realtime do admin (`LeadsRealtime` já reage a inserts). Ajustar `metrics.ts` e os gráficos do dashboard para contar `type = 'portal'` e agrupar por `source`.
- Adicionar `source` como filtro em `/admin/leads` (`LeadFilters`) e badge de origem na lista e no detalhe.

### 5.10 Segurança e LGPD

- **Cifra de credenciais:** AES-256-GCM com WebCrypto no Worker, chave em secret `INTEGRATIONS_KMS_KEY` (32 bytes base64); IV por registro; helpers `encryptCredentials`/`decryptCredentials` em `src/lib/integrations/crypto.ts`. Rotação: coluna `key_version`.
- **Acesso:** leitura de `portal_connections` só via `createAdminClient()` dentro de server actions protegidas por `requireStaff()` (owner/admin) e no worker. O client do browser nunca vê credenciais, nem cifradas. A UI recebe só `status`, `external_account_id`, `last_error`, `last_ok_at`.
- **Webhooks:** segredo por rota (OLX token, Webmotors segredo por conexão, cron secret); rate limit simples por IP na rota de webhook; corpo limitado a 256 KB; sempre 200 depois de persistir para evitar reenvios em tempestade.
- **`state` OAuth:** HMAC-SHA256 com `INTEGRATIONS_KMS_KEY`, validade 10 min, nonce armazenado em cookie `httpOnly` para checar CSRF.
- **LGPD:** os portais entregam dados pessoais do interessado. Registrar em Termos/Privacidade que leads de portais são tratados na plataforma; a Webmotors pergunta no ticket qual é a forma de consentimento. Guardar `raw` do lead por 90 dias e então limpar (job de retenção).
- **Secrets novos no Worker:** `INTEGRATIONS_KMS_KEY`, `INTEGRATIONS_CRON_SECRET`, `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `OLX_CLIENT_ID`, `OLX_CLIENT_SECRET`, `WEBMOTORS_CLIENT_ID`, `WEBMOTORS_CLIENT_SECRET`. Atualizar `.env.example` e `cloudflare-env.d.ts` (`npm run cf-typegen`).

### 5.11 Planos e cobrança

- Portais são recurso do **plano Pro** (ou de um add-on "Portais" a definir; o Stripe já suporta `price` adicional). Gate em `src/lib/billing.ts` (`PLAN_LIMITS.pro.portals = true`) e checagem em `requireStaff()` + nas actions de integração.
- Quando a assinatura cai para `canceled`, job `unpublish` de todos os anúncios da loja (a vitrine já sai do ar hoje; os portais precisam acompanhar, senão ficam anúncios órfãos apontando para uma VDP 404).
- Limite de veículos ativos (20/60) continua o teto do que pode ser publicado.

### 5.12 Admin UI

- **Sidebar:** item "Integrações" (`staffOnly`), ícone `Plug`.
- **`/admin/integracoes`:** cards por portal com estado (`Não conectado` / `Conectar` / `Ativo desde` / `Aguardando plano no portal` / `Erro: …`), contagem de anúncios ativos, botão de sincronizar tudo e link para pendências. Texto de pré-requisito por portal ("Você precisa ter um pacote de veículos contratado com o Mercado Livre. Ligue para …").
- **`/admin/integracoes/[portal]`:** conexão (OAuth para ML/OLX; formulário de credenciais para Webmotors: login Cockpit, senha, login API, senha API, CNPJ; token para Chaves na Mão; URL do feed para Meta/Usadosbr com botão copiar), opções (`auto_publish` para carros novos, telefone/WhatsApp de contato, `listing_type` no ML), **pendências de mapeamento** com busca no catálogo do portal, e **log** (últimos 50 jobs com erro legível).
- **Formulário do veículo (`VehicleForm.tsx`):** seção "Publicar em" com `CheckboxGrid` dos portais conectados (pré-marcados conforme `auto_publish`) e os novos campos (carroceria, motor, direção, final do chassi, vídeo, 0 km). Validação "para publicar no ML falta: placa, final do chassi, foto" mostrada como `FormBanner` de aviso, sem bloquear o cadastro.
- **Detalhe do veículo (`/admin/veiculos/[id]`):** painel "Anúncios nos portais" com status, link externo, data, erro e botão "Reenviar". `VehicleQuickActions` ganha "Publicar/Remover dos portais".
- **Leads:** filtro e badge de origem; no detalhe, link para o anúncio de origem e `channel`.
- **Configurações da loja (`ContactForm.tsx`):** campo CNPJ (máscara já existe em `masked-inputs.tsx`) e WhatsApp em formato E.164.
- Ajuda: novos artigos em `content/ajuda` (um por portal) e registro em `AJUDA_SLUGS`.

### 5.13 Observabilidade

- Painel interno da plataforma (rota `/admin/integracoes` já cobre por loja). Para a operação: query de jobs `dead`/`failed` por portal nas últimas 24 h e conexões em `error` (pode ser um relatório diário por e-mail via Resend enquanto não houver painel de plataforma).
- `console.log` estruturado (`{portal, tenant, job, kind, ms, outcome}`) no worker; o `observability.enabled` do wrangler já coleta.
- Métrica de produto: leads por `source` no dashboard (novo gráfico ou série no `LeadsChart`).

### 5.14 Testes

- **Unitários (vitest):** `mapping.*.test.ts` cobrindo todos os valores dos enums locais para cada portal, títulos ≤ 60 (ML) e ≤ 90 (OLX), descrição sem telefone/URL (ML), truncamento de fotos por limite, `content_hash` estável; `queue.test.ts` (dedupe, backoff, dead letter); `crypto.test.ts`; `parseEvent` com payloads reais gravados de cada portal (fixtures em `__tests__/fixtures`).
- **Contrato:** scripts `scripts/portal-smoke.ts --portal=mercadolivre` contra usuário de teste do ML (`/users/test_user`, com pacote de teste alocado pelo suporte) e homologação da Webmotors/Chaves na Mão; não rodam no CI.
- **E2E manual** por portal antes de liberar: publicar, editar preço, trocar foto, marcar vendido, receber lead.

---

## 6. Mudanças técnicas — auditoria e checklist

### 6.1 Auditoria do plano contra o código (3/09/2026)

Revisão linha a linha dos pontos de contato. Cada item abaixo é algo que a primeira versão do plano não cobria ou deixava implícito.

**Fluxos de veículo (`src/app/admin/veiculos/actions.ts`, `staging-actions.ts`)**

1. **Excluir veículo deixa anúncio órfão.** `deleteVehicleAction` apaga a linha; com `on delete cascade` as `portal_listings` somem junto e o anúncio continua no portal. O job `unpublish` precisa carregar `external_id` e `portal` no `payload` e ter `vehicle_id` nulo, para sobreviver à exclusão. Enfileirar antes do `delete` e só apagar as fotos do storage depois que o portal confirmar (ML e OLX baixam por URL; se a foto sumir antes, o `update` final falha). Alternativa mais simples: bloquear a exclusão enquanto houver anúncio `active` e pedir "remover dos portais" primeiro.
2. **Status `reserved` não existe nos portais.** Decidir por loja se reservado pausa ou mantém o anúncio (`settings.unpublish_on_reserved`, padrão manter). `sold` e `archived` sempre removem.
3. **`setVehicleConsignedAction` não enfileira nada** (marcação interna). Documentar para não virar sync desnecessário.
4. **`uploadPhotosAction`, `removePhotoAction` e `reorderPhotosAction`** enfileiram `update`. Remoção e exclusão apagam também o `jpeg_path` do storage (hoje só apagam `path`).
5. **Fotos do cadastro novo ficam em `{tenant}/novo/`** para sempre (`stagePhotosAction` grava ali e `parseStagedPhotos` filtra por esse prefixo). A variante JPEG precisa ser gerada em `stagePhotosAction`, aceita no filtro de `parseStagedPhotos` (`jpeg_path` com o mesmo prefixo) e apagada em `unstagePhotoAction`. O backfill cobre os dois prefixos.
6. **Hero da vitrine (`site/actions.ts`) reutiliza o shape `{id, path, url}`.** Os campos novos da foto ficam opcionais (`jpeg_path?`, `jpeg_url?`) para não tocar no hero nem nos 6 templates.

**Leads**

7. **O gráfico de leads quebra com o tipo novo.** `metrics.ts` define `LeadsDayPoint {proposal, whatsapp, phone}` e faz `bucket[r.type] += 1` (linha 304): `type = 'portal'` vira `NaN`. Adicionar a série `portal` em `LeadsDayPoint`, no somatório (linhas 300 e 464) e em `LeadsChart.tsx` (`SERIES`, linhas 29-31 e 140). A paleta `--chart-*` foi validada para daltonismo; a cor da série nova precisa passar pela mesma checagem, sem reordenar os slots existentes.
8. **`LEAD_TYPE_LABELS` precisa de `portal`** (usado em `leads/page.tsx:136` e no detalhe). Sugestão de rótulo: "Portal" com o `source` ao lado ("Mercado Livre").
9. **`sendLeadNotificationEmail` exige `lead.name: string`.** Leads de portal podem chegar sem nome (cliques de WhatsApp no ML, `include_guest`). Fallback: "Interessado via Mercado Livre".
10. **Leads de portal não passam por `create_lead` nem pela tabela de rate limit** (`20260603000003_lead_rate_limit.sql`): entram por service role no worker. A RPC e o honeypot ficam intocados.

**Loja e cobrança**

11. **Não há hook de cancelamento.** `syncStripeSubscription` em `src/lib/billing-sync.ts` é o único ponto onde `subscriptions.status` muda. Ali: status `canceled`, `unpaid` ou `incomplete_expired` → enfileirar `unpublish` de todas as listings da loja; `past_due` mantém (mesma tolerância da vitrine). Downgrade `pro → basico` (se portais forem só Pro) → mesmo tratamento + conexões `disconnected`.
12. **A loja `demo`** (`reserved_slugs`) fica fora das integrações: ocultar a página e recusar conexão.
13. **Onboarding não coleta CNPJ.** `src/app/onboarding/actions.ts` chama a RPC `create_tenant` com slug, nome, telefone, WhatsApp e e-mail. Decisão: pedir CNPJ só em Configurações (menor atrito no cadastro) e exigir na hora de conectar Webmotors/ML. Se for para o onboarding, a RPC ganha parâmetro novo.
14. **`ContactForm` + `tenantSchema`** (`validation.ts:150-164`): CNPJ com máscara (`masked-inputs.tsx` já tem base) e WhatsApp normalizado para E.164 (o ML exige DDD e número separados; guardar E.164 e derivar).

**Tipos, projeções e fixtures**

15. **`PublicVehicle`** (`src/lib/public.ts:35`) usa `Omit` explícito: incluir `vin_last6` na lista de internos. A view `vehicles_public` recriada projeta `body_type`, `engine`, `steering`, `video_url`, `zero_km`.
16. **`DEMO_VEHICLES`** (`src/lib/demo-store.ts:182`, tipado `PublicVehicle[]`) e o helper da linha 165 precisam de defaults para os campos novos, senão o typecheck quebra. `supabase/seed.sql` não muda (colunas novas são nulas ou default).
17. **`vehicleTitle`** (`src/lib/format.ts:55`) concatena marca, modelo, versão e ano sem limite. Criar `portalTitle(v, max)` com truncamento por palavra (ML 60, OLX 90).
18. **Não existem testes de `vehicleSchema`** em `validation.test.ts`. Criar junto com os campos novos.

**Rotas e infraestrutura**

19. **Middleware** (`src/middleware.ts`, matcher na linha 146) roda em `/api/*` mas só redireciona `/admin` e `/onboarding`: webhooks funcionam sem sessão. A rota `oauth/start` autentica com `createClient()` de `lib/supabase/server` e confere `memberships.role` (owner/admin) da loja ativa (cookie `ea_loja`, `ACTIVE_TENANT_COOKIE` em `auth.ts:13`).
20. **URL canônica sem request.** `storefrontUrl(host, slug, path)` (`site-url.ts`) depende do host da requisição; no cron não há request. Criar `canonicalStorefrontUrl(tenant, path)` que usa `custom_domain` quando `custom_domain_status = 'active'` e `SITE_URL/{slug}` caso contrário. Anúncios nos portais apontam para essa URL.
21. **Limites do Worker.** Plano pago: 1.000 subrequests por invocação e 30 s de CPU por padrão (`limits.cpu_ms` sobe até 300.000). O tick do cron processa 10 a 20 jobs; publicar um carro no ML custa 2 a 4 chamadas (item, descrição, eventualmente fotos), na OLX 1 chamada por lote de loja. Fotos por URL não gastam CPU nosso.
22. **`scripts/deploy-prod.sh` tem lista fixa `SECRETS=(...)`** (linha 60): incluir `INTEGRATIONS_KMS_KEY`, `INTEGRATIONS_CRON_SECRET`, `ML_*`, `OLX_*`, `WEBMOTORS_*`. Conferir que `opennextjs-cloudflare build` respeita `main: worker.ts` no `wrangler.jsonc` (how-to "custom worker" do adapter).
23. **Sincronização completa de taxonomia não cabe no Worker.** No ML, `TRIM` depende de marca e modelo (`known_attributes`); na OLX, `car_info` exige access token de uma conta conectada (escopo `autoupload`); na Webmotors, `ObterVersao` é por modelo. São milhares de requisições: rodar em GitHub Actions semanal (`scripts/portal-taxonomy-sync.ts` + `.github/workflows/portal-taxonomy.yml`, mesmo padrão do FIPE, secrets já existentes) e deixar no Worker só a resolução sob demanda de um veículo. A OLX precisa de um token "da plataforma" (conta OLX da estoque.autos conectada) para o sync global.
24. **`tsconfig.json` inclui `**/*.ts`**: `worker.ts` na raiz entra no typecheck; os tipos de `ScheduledController` já vêm de `cloudflare-env.d.ts`. Adicionar ao ignore do ESLint se a config `next` reclamar de arquivo fora de `src`.
25. **`after()` já é usado** em `lead-actions.ts` e funciona no OpenNext (`waitUntil`); o disparo imediato do worker pode reutilizar.

**Conteúdo e legal**

26. **Blog cita iCarros como marketplace ativo**: `blog/src/content/posts/site-proprio-ou-marketplace-loja-de-carros.md` (linha 27) e o `answer` da linha 4. Atualizar. `content/social/posts.json:273` só usa Webmotors como exemplo; ok.
27. **Política de privacidade §3** (`src/app/privacidade/page.tsx:78-100`) descreve leads captados "no site da loja". Acrescentar leads recebidos de portais (mesmos papéis: lojista controlador, plataforma operadora) e citar os portais como origem dos dados.
28. **Ajuda:** existe `integracoes-de-marketing.mdx`; criar `integracoes-com-portais.mdx` (um por portal ou um geral com seções) e ajustar `como-funcionam-os-leads.mdx` para explicar a origem. Registrar em `AJUDA_SLUGS` (`src/lib/content.ts:42`).

### 6.2 Checklist

**Banco (`supabase/migrations/`)**
- [ ] Migration `portais`: `portal_connections`, `portal_listings`, `portal_sync_jobs`, `portal_events`, `portal_taxonomy`, `portal_taxonomy_map`; RLS; RPC `claim_portal_jobs(n, worker_id)` com `skip locked`; extensão `pg_trgm`.
- [ ] `vehicles`: `body_type`, `engine`, `steering`, `vin_last6`, `video_url`, `zero_km`; recriar `vehicles_public` com os públicos.
- [ ] `tenants.cnpj`; `leads.source/channel/external_id/external_url/raw`; `type` aceita `portal` (fora de `proposal_requires_contact`); índice único externo.
- [ ] Job de retenção (90 dias) para `leads.raw` e `portal_events`.

**Infra (`wrangler.jsonc`, raiz, scripts, CI)**
- [ ] `worker.ts` custom com `scheduled`; `"main": "worker.ts"`; `"triggers": { "crons": ["*/2 * * * *"] }`; `limits.cpu_ms` se necessário; testar com `--test-scheduled`.
- [ ] Secrets novos no Worker + `SECRETS=(...)` do `deploy-prod.sh` + `.env.example` + `cf-typegen`.
- [ ] `.github/workflows/portal-taxonomy.yml` semanal + `scripts/portal-taxonomy-sync.ts`.
- [ ] `scripts/photos-backfill-jpeg.ts` (prefixos `{tenant}/novo/` e `{tenant}/{vehicle}/`), `scripts/portal-smoke.ts`.

**Domínio (`src/lib/`)**
- [ ] `types.ts`: `BODY_TYPES`, `STEERINGS`, `PORTAL_IDS`, `LEAD_SOURCES`, labels; `LEAD_TYPE_LABELS.portal`; `VehiclePhoto` com `jpeg_path?`/`jpeg_url?`.
- [ ] `validation.ts`: `vehicleSchema` com campos novos; `tenantSchema` com `cnpj`; `portalConnectionSchema` por portal; `publishRequirements(portal, vehicle)`.
- [ ] `images.ts`/`storage.ts`: variante JPEG 1920×1440; remoção apaga as duas variantes.
- [ ] `public.ts`: `PublicVehicle` omite `vin_last6`. `demo-store.ts`: defaults nos fixtures.
- [ ] `format.ts`: `portalTitle(v, max)`. `site-url.ts`: `canonicalStorefrontUrl(tenant, path)`.
- [ ] `billing.ts`: gate de portais. `billing-sync.ts`: hook de cancelamento/downgrade → `unpublish` + `disconnected`.
- [ ] `metrics.ts`: série `portal` em `LeadsDayPoint` e somatórios; `charts/LeadsChart.tsx`: série e cor validada.
- [ ] `email.ts`: fallback de nome; e-mails "conexão precisa de atenção" e "anúncio rejeitado".
- [ ] `integrations/` (5.4): fundação + adapters por fase.

**App (`src/app/`)**
- [ ] `api/integrations/[portal]/oauth/{start,callback}` (start autentica via `createClient()` + role), `api/integrations/[portal]/webhook`, `api/integrations/worker`, `api/feeds/[token]/*`.
- [ ] `admin/integracoes/` (página, `[portal]`, actions: conectar, desconectar, opções, resolver pendência, reenviar, sincronizar tudo); oculta para `demo`.
- [ ] `admin/veiculos/actions.ts`: enfileirar em create/update/status/fotos/reorder; `deleteVehicleAction` com `unpublish` antes (ou bloqueio); `staging-actions.ts` com JPEG.
- [ ] `admin/veiculos/VehicleForm.tsx`: seção "Publicar em" + campos novos + aviso de requisitos; `[id]/page.tsx`: painel de anúncios; `VehicleQuickActions`: publicar/remover.
- [ ] `admin/leads`: filtro e badge de origem; detalhe com link externo e `channel`.
- [ ] `admin/configuracoes/ContactForm.tsx`: CNPJ e WhatsApp E.164.
- [ ] `components/admin/Sidebar.tsx`: item Integrações (`staffOnly`).
- [ ] `privacidade/page.tsx` §3: leads de portais. `termos/page.tsx`: menção ao módulo.
- [ ] `content/ajuda`: `integracoes-com-portais.mdx` + ajuste em `como-funcionam-os-leads.mdx` + `AJUDA_SLUGS`.

**Marketing**
- [ ] Blog `site-proprio-ou-marketplace-loja-de-carros.md`: remover iCarros da lista de marketplaces ativos.
- [ ] Citar cada portal na landing e na ajuda só quando estiver em produção.

**Testes**
- [ ] `vehicleSchema` (novo), `mapping.*` por portal cobrindo todos os enums, `portalTitle`, `queue`, `crypto`, `parseEvent` com fixtures reais, `metrics` com `type = 'portal'`.

---

## 7. Roadmap e estimativas

Estimativas para um desenvolvedor sênior dedicado, sem os tempos de espera externos.

| Fase | Entrega | Esforço | Espera externa |
|---|---|---|---|
| **0. Fundação** | Migrations, cofre de credenciais, fila + cron worker, contrato de adapters, canônico + fotos JPEG (com backfill), página Integrações vazia, lead com origem | 2-3 semanas | Nenhuma |
| **1. Mercado Livre** | App no DevCenter, OAuth + refresh com lock, publish/update/unpublish, mapeamento BRAND/MODEL/TRIM + listas fixas, pendências de mapeamento, webhook `vis_leads`, renovação de 180 dias, UI no veículo | 3-4 semanas | Criar app (dias); usuário de teste `motors` com pacote via suporte (dias a semanas); cada loja contrata pacote comercial |
| **2. OLX** | Cadastro de integrador, OAuth, `sync_tenant` em lote (fatiado em 1 MB), catálogo `car_info` + ressincronização, status polling, webhook de leads, UI | 2-3 semanas | Homologação do integrador (prazo não público); cada loja precisa de plano Empresa |
| **3. Webmotors** | Registro Sensedia + ticket LGPD + homologação, credencial "Estoque Terceiro" por loja, cliente REST (e fallback SOAP se a homologação exigir), taxonomia própria, fotos 1920×1440, callback de leads + consulta, UI | 3-4 semanas | Homologação até 90 dias, em horário comercial; cada loja precisa de Cockpit + Plano Controle/Performance |
| **4. Feeds e Chaves na Mão** | Feed Meta AIA por loja (validar elegibilidade BR), XML Usadosbr, adapter Chaves na Mão (FIPE direto, webhook) | 1-2 semanas | Chaves na Mão: token de homologação por e-mail |
| **Total** | | **11-16 semanas** | Iniciar os cadastros de Webmotors, OLX e ML na semana 1 da Fase 0 |

Marco de "beta fechado": Fase 0 + Fase 1 com 3 a 5 lojas que já tenham pacote no Mercado Livre. Só então abrir OLX e Webmotors.

---

## 8. Riscos e decisões em aberto

1. **Gate comercial por loja em todos os grandes.** Mitigação: estado `needs_plan` com instrução e telefone do portal; conteúdo de ajuda; possivelmente parceria comercial com ML/OLX para indicação de lojas.
2. **Webmotors: qual API a homologação vai liberar (REST nova ou SOAP legado).** Decidir no primeiro contato com o suporte Sensedia; o adapter isola a escolha.
3. **OLX: expiração do token não documentada e IDs de taxonomia que mudam.** Mitigação: tratar 401 como `refresh/reconnect`, ressincronizar catálogo semanalmente e alertar em queda brusca.
4. **Custo de CPU no Worker** para lotes grandes (OLX 1 MB; ML com 15 fotos por URL não custa CPU nosso). Orçamento de tempo por invocação e processamento incremental resolvem; se crescer, mover o worker para um Worker separado com Queues.
5. **Fotos WebP.** ML não lista WebP; gerar JPEG evita rejeição silenciosa. Backfill em lojas grandes leva tempo de Images (custo por transformação).
6. **Meta AIA no Brasil** não confirmado oficialmente. Testar antes de prometer.
7. **Título/descrição por portal.** ML proíbe contato na descrição; OLX limita 6000. Gerar textos derivados (não pedir ao lojista que escreva três vezes) e permitir override por portal só se houver demanda.
8. **Placa obrigatória** na prática para ML e OLX (validação) enquanto hoje é opcional e oculta. A UI precisa deixar claro que a placa é usada para publicar, não para exibir.

---

## 9. Ações não técnicas para começar já

1. **Mercado Livre:** criar a aplicação no DevCenter (conta PJ da estoque.autos, 1 app por titular), cadastrar redirect URI HTTPS, abrir chamado pedindo usuário de teste perfil `motors` com pacote de teste.
2. **OLX:** e-mail para `suporteintegrador@olxbr.com` (ou WhatsApp (21) 3199-8540) com nome, app, descrição, site, telefone, e-mail e as redirect URIs; pedir a lista atual de campos de autos e a política de expiração de token.
3. **Webmotors:** registrar em `portal-webmotors.sensedia.com`, criar o APP com "CALLBACK URL LEADS", abrir ticket com razão social, CNPJ, site e texto de consentimento LGPD; pedir explicitamente a documentação "Integração com Gestores de Estoque Terceiros" e o Swagger.
4. **Chaves na Mão:** e-mail para `ws@chavesnamao.com.br` pedindo token de homologação e o manual atualizado.
5. **Usadosbr:** e-mail para `suporte@usadosbr.com` com CNPJ pedindo login de integração e o layout do XML.
6. **Meta:** criar um catálogo "Veículos" de teste no Commerce Manager para confirmar disponibilidade no Brasil.
7. **ConectCar/iCarros:** um e-mail perguntando se haverá canal para lojistas. Sem engenharia.

---

## 10. Fontes principais

- Webmotors: https://portal-webmotors.sensedia.com/api-portal/ (content/api-marketplace, documentacao, documentacao/autenticacao, documentacao/consultar-estoque, documentacao/insercao-de-leads) · https://ajuda.cockpit.com.br/hc/pt-br/categories/5018147000084-API-Webmotors · https://ajuda.revendamais.com.br/hc/rmais-ajuda/articles/1755179303 · https://integracao.webmotors.com.br/wsEstoqueRevendedorWebMotors.asmx
- iCarros: https://spbancarios.com.br/06/2026/itau-encerra-icarros-pj-e-da-prazo-de-60-dias-para-trabalhadores-se-realocarem · https://investnews.com.br/negocios/conectcar-compra-icarros-itau/ · https://capitalaberto.com.br/negocios/conectcar-compra-icarros-do-itau-e-entra-na-venda-de-automoveis/
- Mercado Livre: https://developers.mercadolivre.com.br/pt_br/publicacao-de-automoveis · /pt_br/categorias-e-atributos-veiculos · /pt_br/automovel-gerenciamento-de-pacotes · /pt_br/pessoas-interessadas · /pt_br/autenticacao-e-autorizacao · /pt_br/trabalhar-com-imagens · /produto-receba-notificacoes
- OLX: https://developers.olx.com.br/anuncio/api/import.html · /anuncio/api/oauth.html · /anuncio/api/autos/car_models.html · /lead/how_to.html · /lead/leads.html · /lead/descriptions/autos/sub_auto.html · https://ajuda.olx.com.br/s/article/como-cadastrar-integrador
- Chaves na Mão: https://cdn.chavesnamao.com.br/documents/manual_integracao_API_REST_veiculos_2022_chaves_na_mao.pdf · https://api.chavesnamao.com.br/integration/vehicles/swagger/static/index.html
- Usadosbr: https://ajuda.usadosbr.com/dt_articles/integrar-meu-estoque-com-a-usadosbr/
- Google Vehicle Ads (países): https://support.google.com/merchants/answer/11189169
- Meta AIA: https://www.facebook.com/business/help/1510143265745613 · Marketplace: https://www.facebook.com/business/help/276493033013109
- Mobiauto: https://www.mobiauto.com.br/atendimento/mobigestor · NaPista: https://napista.com.br/vender · Autoconf API: https://autoconf.com.br/api/ · Followize webhooks: https://www.followize.com.br/webhooks-doc/
