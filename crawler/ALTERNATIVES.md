# Alternativas para Coleta de Dados de Veículos

## Problema Atual

O Webmotors está retornando 403 Forbidden, o que indica proteção contra bots/crawlers.

## Soluções Alternativas

### 1. ✅ API da Tabela FIPE (RECOMENDADO)

A API pública mais confiável para dados de veículos no Brasil.

**Vantagens:**
- Gratuita e oficial
- Dados atualizados mensalmente
- Sem rate limiting agressivo
- JSON bem estruturado

**API:** https://deapi.com.br/docs/fipe/

```bash
# Exemplo de uso:
curl https://fipe.parallelum.com.br/api/v2/cars/brands
```

**Implementação:**
```typescript
// src/crawlers/fipe-brands.ts
import axios from 'axios';

const FIPE_API = 'https://fipe.parallelum.com.br/api/v2';

async function getFipeBrands() {
  const response = await axios.get(`${FIPE_API}/cars/brands`);
  return response.data;
}

async function getFipeModels(brandId: number) {
  const response = await axios.get(`${FIPE_API}/cars/brands/${brandId}/models`);
  return response.data;
}

async function getFipeYears(brandId: number, modelId: number) {
  const response = await axios.get(`${FIPE_API}/cars/brands/${brandId}/models/${modelId}/years`);
  return response.data;
}
```

### 2. 🎭 Puppeteer com Navegador Real

Usar um navegador real para simular comportamento humano.

**Vantagens:**
- Contorna bloqueios básicos
- Executa JavaScript da página
- Acessa dados dinâmicos

**Desvantagens:**
- Muito mais lento
- Consome mais recursos
- Ainda pode ser bloqueado

**Implementação:**
```typescript
import puppeteer from 'puppeteer';

async function crawlWithBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Configurar user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  );

  // Configurar viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Navegar
  await page.goto('https://www.webmotors.com.br/carros/estoque', {
    waitUntil: 'networkidle2',
  });

  // Extrair dados
  const brands = await page.evaluate(() => {
    // Lógica para extrair marcas do DOM
    return [];
  });

  await browser.close();
  return brands;
}
```

### 3. 📊 API do MercadoLivre

MercadoLivre tem API pública com dados de veículos.

**API:** https://developers.mercadolivre.com.br/

```bash
# Exemplo:
curl https://api.mercadolibre.com/sites/MLB/categories/MLB1743
```

### 4. 🗄️ Lista Estática Completa

Manter uma lista curada das marcas e modelos mais comuns.

**Vantagens:**
- Funciona sempre
- Sem dependências externas
- Controle total

**Desvantagens:**
- Precisa atualização manual
- Pode ficar desatualizado

**Arquivo:** `src/data/static-vehicles.ts`

```typescript
export const BRANDS = [
  { id: '1', name: 'Chevrolet', slug: 'chevrolet' },
  { id: '2', name: 'Volkswagen', slug: 'volkswagen' },
  { id: '3', name: 'Fiat', slug: 'fiat' },
  // ... mais marcas
];

export const MODELS = {
  chevrolet: [
    { id: '1', name: 'Onix', slug: 'onix' },
    { id: '2', name: 'Tracker', slug: 'tracker' },
    // ... mais modelos
  ],
  // ... mais marcas
};
```

### 5. 🔌 API OLX/Webmotors Parceira

Tornar-se parceiro oficial para ter acesso à API.

**Como:**
- Contato comercial com Webmotors
- Planos pagos de acesso à API
- Documentação oficial

### 6. 🤝 Integração com Sistemas Existentes

Se você já usa algum sistema de gestão automotiva:

- **AutoForce**: API de dados de veículos
- **AutoAvaliar**: Base de dados FIPE
- **Mobiauto**: Integrações disponíveis

## Recomendação: API FIPE

Vou criar um crawler usando a API da Tabela FIPE, que é:
- ✅ Gratuita
- ✅ Oficial
- ✅ Confiável
- ✅ Sem bloqueios
- ✅ Dados brasileiros

## Implementação Recomendada

### Estrutura de dados FIPE:

```typescript
// Marcas
GET /cars/brands
[
  { code: "1", name: "Acura" },
  { code: "2", name: "Agrale" },
  ...
]

// Modelos
GET /cars/brands/{brandId}/models
[
  { code: "1", name: "Civic 1.8 LXS" },
  { code: "2", name: "Fit 1.5 LX" },
  ...
]

// Anos/Versões
GET /cars/brands/{brandId}/models/{modelId}/years
[
  { code: "2024-1", name: "2024 Gasolina" },
  { code: "2023-1", name: "2023 Gasolina" },
  ...
]
```

## Próximos Passos

1. Ajustar crawlers para usar API FIPE
2. Manter fallback para lista estática
3. Implementar cache de 24h
4. Adicionar validação de dados

Quer que eu implemente o crawler usando a API FIPE?
