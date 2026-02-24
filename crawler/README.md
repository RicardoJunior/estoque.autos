# Crawler de Veículos

Sistema de crawling para coletar dados de marcas, modelos e versões de veículos do Webmotors.

## Estrutura

```
crawler/
├── src/
│   ├── crawlers/       # Scripts de crawling
│   │   ├── brands.ts   # Crawl de marcas
│   │   ├── models.ts   # Crawl de modelos
│   │   ├── versions.ts # Crawl de versões
│   │   └── all.ts      # Crawl completo
│   ├── utils/          # Utilitários
│   │   ├── logger.ts   # Sistema de logs
│   │   ├── delay.ts    # Delay entre requisições
│   │   └── validate-data.ts # Validação de dados
│   └── types/          # Tipos TypeScript
│       └── vehicle.ts  # Tipos de veículos
├── data/               # Dados coletados
│   ├── brands.json
│   ├── models.json
│   └── versions.json
└── logs/              # Logs de execução
```

## Instalação

```bash
cd crawler
npm install
```

## Uso

### Crawl de marcas
```bash
npm run crawl:brands
```

### Crawl de modelos
```bash
npm run crawl:models
```

### Crawl de versões
```bash
npm run crawl:versions
```

### Crawl completo (marcas + modelos + versões)
```bash
npm run crawl:all
```

## Dados Coletados

Os dados são salvos em formato JSON na pasta `data/`:

- `brands.json`: Lista de marcas
- `models.json`: Modelos por marca
- `versions.json`: Versões por modelo

## Observações

- O crawler respeita rate limits para não sobrecarregar o servidor
- Logs detalhados são salvos em `logs/`
- Os dados podem ser validados com `npm run validate`
