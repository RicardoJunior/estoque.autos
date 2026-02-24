# Estrutura do Crawler

## Visão Geral

```
crawler/
├── src/
│   ├── crawlers/          # Scripts principais de crawling
│   │   ├── brands.ts      # Crawl de marcas
│   │   ├── models.ts      # Crawl de modelos
│   │   ├── versions.ts    # Crawl de versões
│   │   └── all.ts         # Orquestrador (executa tudo)
│   │
│   ├── utils/             # Utilitários
│   │   ├── logger.ts      # Sistema de logging
│   │   ├── delay.ts       # Funções de delay/backoff
│   │   ├── file-handler.ts # Gerenciamento de arquivos
│   │   └── validate-data.ts # Validação de dados
│   │
│   ├── scripts/           # Scripts auxiliares
│   │   ├── test-connection.ts # Testa conexão com API
│   │   ├── import-to-db.ts    # Template para importar no banco
│   │   └── export-to-sql.ts   # Exporta para SQL
│   │
│   ├── types/             # Definições TypeScript
│   │   └── vehicle.ts     # Tipos de veículos
│   │
│   └── index.ts           # Entry point principal
│
├── data/                  # Dados coletados (JSON)
│   ├── brands.json
│   ├── models.json
│   ├── versions.json
│   └── import-vehicles.sql
│
├── logs/                  # Logs de execução
│   ├── brands-*.log
│   ├── models-*.log
│   └── versions-*.log
│
├── package.json           # Dependências e scripts
├── tsconfig.json          # Configuração TypeScript
├── .gitignore            # Arquivos ignorados
├── README.md             # Documentação principal
├── USAGE.md              # Guia de uso
├── EXAMPLES.md           # Exemplos práticos
└── STRUCTURE.md          # Este arquivo
```

## Arquivos Principais

### Crawlers

#### `src/crawlers/brands.ts`
- Coleta todas as marcas de veículos
- Tenta acessar a API do Webmotors
- Fallback para lista estática se API falhar
- Salva em `data/brands.json`

#### `src/crawlers/models.ts`
- Coleta modelos para cada marca
- Usa dados de `brands.json`
- Paralelismo limitado (3 marcas simultâneas)
- Salva em `data/models.json`

#### `src/crawlers/versions.ts`
- Coleta versões para cada modelo
- Usa dados de `models.json`
- Paralelismo limitado (2 modelos simultâneos)
- Salva em `data/versions.json`

#### `src/crawlers/all.ts`
- Orquestra execução completa
- Executa: brands → models → versions
- Gera relatório final
- Logs consolidados

### Utilitários

#### `src/utils/logger.ts`
- Sistema de logging colorido
- Salva logs em arquivos
- Níveis: info, success, error, warn, progress
- Formato: `[timestamp] [level] message`

#### `src/utils/delay.ts`
- `randomDelay()`: Delay aleatório (evita rate limiting)
- `delay()`: Delay fixo
- `exponentialBackoff()`: Backoff exponencial para retry

#### `src/utils/file-handler.ts`
- Gerencia leitura/escrita de JSON
- Criação automática de diretórios
- Backup de arquivos
- Validação de existência

#### `src/utils/validate-data.ts`
- Valida integridade dos dados
- Verifica campos obrigatórios
- Detecta duplicatas
- Valida referências entre entidades
- Gera estatísticas

### Scripts Auxiliares

#### `src/scripts/test-connection.ts`
- Testa conexão com Webmotors
- Verifica disponibilidade da API
- Mostra exemplo de dados retornados
- Diagnóstico de erros de rede

#### `src/scripts/import-to-db.ts`
- Template para importação no banco
- Comentários com exemplos Prisma
- Base para customização

#### `src/scripts/export-to-sql.ts`
- Gera arquivo SQL com INSERTs
- Formato: PostgreSQL
- ON CONFLICT para evitar duplicatas
- Pronto para executar

### Tipos

#### `src/types/vehicle.ts`
```typescript
Brand {
  id: string
  name: string
  slug: string
  logo?: string
}

Model {
  id: string
  name: string
  slug: string
  brandId: string
  brandName: string
}

Version {
  id: string
  name: string
  slug: string
  modelId: string
  modelName: string
  brandId: string
  brandName: string
  year?: string
  fuelType?: string
  transmission?: string
}

CrawlResult<T> {
  success: boolean
  data: T[]
  errors: string[]
  timestamp: string
  totalItems: number
}
```

## Fluxo de Dados

```
1. Crawl Marcas
   ↓
   brands.json
   ↓
2. Crawl Modelos (usa brands.json)
   ↓
   models.json
   ↓
3. Crawl Versões (usa models.json)
   ↓
   versions.json
   ↓
4. Validação
   ↓
5. Exportação (SQL ou DB)
```

## Estrutura de Dados

### brands.json
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Chevrolet",
      "slug": "chevrolet"
    }
  ],
  "errors": [],
  "timestamp": "2024-02-13T10:00:00.000Z",
  "totalItems": 30
}
```

### models.json
```json
{
  "success": true,
  "data": [
    {
      "id": "101",
      "name": "Onix",
      "slug": "onix",
      "brandId": "1",
      "brandName": "Chevrolet"
    }
  ],
  "errors": [],
  "timestamp": "2024-02-13T10:05:00.000Z",
  "totalItems": 500
}
```

### versions.json
```json
{
  "success": true,
  "data": [
    {
      "id": "1001",
      "name": "1.0 Turbo LT",
      "slug": "10-turbo-lt",
      "modelId": "101",
      "modelName": "Onix",
      "brandId": "1",
      "brandName": "Chevrolet",
      "year": "2024",
      "fuelType": "Flex",
      "transmission": "Automático"
    }
  ],
  "errors": [],
  "timestamp": "2024-02-13T10:15:00.000Z",
  "totalItems": 3000
}
```

## Scripts NPM

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Mostra informações sobre o crawler |
| `npm test` | Testa conexão com Webmotors |
| `npm run crawl:brands` | Crawl de marcas |
| `npm run crawl:models` | Crawl de modelos |
| `npm run crawl:versions` | Crawl de versões |
| `npm run crawl:all` | Crawl completo |
| `npm run validate` | Valida dados coletados |
| `npm run export:sql` | Exporta para SQL |
| `npm run import:db` | Template para importar no banco |

## Logs

### Formato
```
[2024-02-13T10:00:00.000Z] [INFO] Iniciando crawl de marcas...
[2024-02-13T10:00:01.234Z] [SUCCESS] Total de marcas coletadas: 30
[2024-02-13T10:00:01.234Z] [ERROR] Erro ao processar marca: timeout
```

### Localização
```
logs/
├── brands-2024-02-13T10-00-00.log
├── models-2024-02-13T10-05-00.log
├── versions-2024-02-13T10-10-00.log
└── all-2024-02-13T10-00-00.log
```

## Performance

### Rate Limiting
- Delay aleatório: 500-1500ms entre requisições
- Paralelismo limitado: 3 marcas, 2 modelos
- Timeout: 10 segundos por requisição

### Tempo Estimado
- Marcas: ~5 segundos (API única)
- Modelos: ~2-5 minutos (30 marcas × 3s)
- Versões: ~10-30 minutos (500 modelos × 2s)
- **Total: ~15-35 minutos**

## Dependências

### Produção
- `axios`: Cliente HTTP
- `cheerio`: Parser HTML
- `p-limit`: Controle de paralelismo
- `puppeteer`: Browser automation (opcional)

### Desenvolvimento
- `tsx`: Executor TypeScript
- `typescript`: Compilador
- `@types/node`: Types do Node.js

## Segurança e Ética

### Boas Práticas
✓ Delays entre requisições
✓ Rate limiting
✓ User-Agent apropriado
✓ Respeito ao robots.txt
✓ Logs de erro detalhados

### Evitar
✗ Requests massivos
✗ Sobrecarga de servidores
✗ Bypass de limitações
✗ Uso comercial dos dados sem autorização
