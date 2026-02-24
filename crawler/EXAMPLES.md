# Exemplos de Uso do Crawler

## Exemplo 1: Crawl Completo Básico

```bash
# 1. Instalar dependências
cd crawler
npm install

# 2. Testar conexão
npm test

# 3. Executar crawl completo
npm run crawl:all

# 4. Validar dados
npm run validate

# 5. Exportar para SQL
npm run export:sql
```

## Exemplo 2: Crawl Incremental

Se você já tem marcas e quer atualizar apenas os modelos:

```bash
# Crawl apenas modelos (usando brands.json existente)
npm run crawl:models

# Validar
npm run validate
```

## Exemplo 3: Integração com Backend

### Opção 1: Importar via Prisma

```typescript
// backend/prisma/seeds/import-vehicles.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importVehicles() {
  // Ler dados do crawler
  const brandsData = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../crawler/data/brands.json'),
      'utf-8'
    )
  );

  const modelsData = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../crawler/data/models.json'),
      'utf-8'
    )
  );

  console.log('Importando marcas...');

  for (const brand of brandsData.data) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
      },
      create: {
        name: brand.name,
        slug: brand.slug,
      },
    });
  }

  console.log('Importando modelos...');

  for (const model of modelsData.data) {
    const brand = await prisma.brand.findUnique({
      where: { slug: model.brandName.toLowerCase() },
    });

    if (brand) {
      await prisma.model.upsert({
        where: { slug: model.slug },
        update: {
          name: model.name,
          brandId: brand.id,
        },
        create: {
          name: model.name,
          slug: model.slug,
          brandId: brand.id,
        },
      });
    }
  }

  console.log('Importação concluída!');
}

importVehicles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Opção 2: Via SQL Direto

```bash
# 1. Exportar dados para SQL
cd crawler
npm run export:sql

# 2. Importar no PostgreSQL
psql -d estoque_autos -f data/import-vehicles.sql

# Ou com Docker:
docker exec -i postgres_container psql -U postgres -d estoque_autos < crawler/data/import-vehicles.sql
```

## Exemplo 4: Uso Programático

```typescript
// script-customizado.ts
import { crawlBrands } from './src/crawlers/brands.js';
import { crawlModels } from './src/crawlers/models.js';
import { Logger } from './src/utils/logger.js';

const logger = new Logger('custom');

async function customCrawl() {
  // Crawl apenas marcas populares
  const brandsResult = await crawlBrands();

  if (!brandsResult.success) {
    logger.error('Erro ao coletar marcas');
    return;
  }

  // Filtrar apenas marcas específicas
  const popularBrands = brandsResult.data.filter(brand =>
    ['Chevrolet', 'Volkswagen', 'Fiat', 'Toyota', 'Honda'].includes(brand.name)
  );

  logger.info(`Coletando modelos para ${popularBrands.length} marcas populares`);

  // Crawl modelos apenas para essas marcas
  // ... implementar lógica customizada
}

customCrawl();
```

## Exemplo 5: Agendamento com Cron

### Linux/Mac

```bash
# Editar crontab
crontab -e

# Executar toda segunda-feira às 3h
0 3 * * 1 cd /path/to/project/crawler && npm run crawl:all && npm run export:sql

# Executar todo dia 1 do mês às 2h
0 2 1 * * cd /path/to/project/crawler && npm run crawl:all
```

### Com Node.js (node-cron)

```typescript
import cron from 'node-cron';
import { crawlAll } from './src/crawlers/all.js';

// Executar toda segunda-feira às 3h
cron.schedule('0 3 * * 1', async () => {
  console.log('Iniciando crawl agendado...');
  await crawlAll();
  console.log('Crawl concluído!');
});
```

## Exemplo 6: Análise de Dados

```typescript
// analyze-data.ts
import { FileHandler } from './src/utils/file-handler.js';
import type { Brand, Model, CrawlResult } from './src/types/vehicle.js';

const fileHandler = new FileHandler();

const brandsResult = fileHandler.load<CrawlResult<Brand>>('brands.json');
const modelsResult = fileHandler.load<CrawlResult<Model>>('models.json');

if (brandsResult && modelsResult) {
  // Top 10 marcas com mais modelos
  const modelsByBrand = new Map<string, number>();

  modelsResult.data.forEach(model => {
    modelsByBrand.set(
      model.brandName,
      (modelsByBrand.get(model.brandName) || 0) + 1
    );
  });

  const top10 = Array.from(modelsByBrand.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('Top 10 marcas com mais modelos:');
  top10.forEach(([brand, count], index) => {
    console.log(`${index + 1}. ${brand}: ${count} modelos`);
  });
}
```

## Exemplo 7: API para Busca de Veículos

```typescript
// api/vehicles/route.ts
import { FileHandler } from '../../../crawler/src/utils/file-handler.js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  const fileHandler = new FileHandler();
  const brandsResult = fileHandler.load('brands.json');
  const modelsResult = fileHandler.load('models.json');

  // Buscar em marcas
  const matchingBrands = brandsResult.data.filter(brand =>
    brand.name.toLowerCase().includes(query)
  );

  // Buscar em modelos
  const matchingModels = modelsResult.data.filter(
    model =>
      model.name.toLowerCase().includes(query) ||
      model.brandName.toLowerCase().includes(query)
  );

  return Response.json({
    brands: matchingBrands.slice(0, 10),
    models: matchingModels.slice(0, 20),
  });
}
```

## Exemplo 8: Autocomplete no Frontend

```typescript
// components/VehicleSearch.tsx
import { useState, useEffect } from 'react';

export function VehicleSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ brands: [], models: [] });

  useEffect(() => {
    if (query.length < 2) return;

    const searchVehicles = async () => {
      const response = await fetch(`/api/vehicles?q=${query}`);
      const data = await response.json();
      setResults(data);
    };

    const debounce = setTimeout(searchVehicles, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar marca ou modelo..."
      />

      {results.brands.length > 0 && (
        <div>
          <h3>Marcas</h3>
          {results.brands.map(brand => (
            <div key={brand.id}>{brand.name}</div>
          ))}
        </div>
      )}

      {results.models.length > 0 && (
        <div>
          <h3>Modelos</h3>
          {results.models.map(model => (
            <div key={model.id}>
              {model.brandName} {model.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Dicas de Performance

### Cache em Memória

```typescript
let cachedData = null;
let cacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

export function getVehicleData() {
  const now = Date.now();

  if (cachedData && (now - cacheTime) < CACHE_DURATION) {
    return cachedData;
  }

  cachedData = {
    brands: fileHandler.load('brands.json'),
    models: fileHandler.load('models.json'),
  };

  cacheTime = now;

  return cachedData;
}
```

### Índice de Busca

```typescript
// Criar índice para busca rápida
const searchIndex = new Map();

modelsResult.data.forEach(model => {
  const key = `${model.brandName} ${model.name}`.toLowerCase();
  searchIndex.set(key, model);
});

// Busca O(1)
const found = searchIndex.get('chevrolet onix');
```
