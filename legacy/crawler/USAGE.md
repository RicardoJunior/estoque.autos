# Guia de Uso do Crawler

## Instalação

```bash
cd crawler
npm install
```

## Execução

### 1. Crawl Completo (Recomendado)

Execute todas as etapas de uma vez:

```bash
npm run crawl:all
```

Este comando irá:
1. Coletar todas as marcas de veículos
2. Coletar todos os modelos para cada marca
3. Coletar todas as versões para cada modelo

### 2. Crawl por Etapas

Se preferir executar etapa por etapa:

```bash
# 1. Coletar marcas
npm run crawl:brands

# 2. Coletar modelos (requer marcas)
npm run crawl:models

# 3. Coletar versões (requer modelos)
npm run crawl:versions
```

### 3. Validar Dados

Após o crawl, valide os dados coletados:

```bash
npm run validate
```

Este comando verifica:
- Integridade dos dados
- Campos obrigatórios
- Referências entre marcas/modelos/versões
- Duplicatas

## Exportação de Dados

### Exportar para SQL

Gera um arquivo SQL com INSERT statements:

```bash
npm run export:sql
```

O arquivo será salvo em `data/import-vehicles.sql` e pode ser importado diretamente no PostgreSQL:

```bash
psql -d seu_banco -f crawler/data/import-vehicles.sql
```

### Importar para o Banco de Dados

Script base para importar via código (usando Prisma ou outro ORM):

```bash
npm run import:db
```

**Nota:** Este script precisa ser customizado para seu banco de dados.

## Estrutura de Dados

### brands.json

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Chevrolet",
      "slug": "chevrolet",
      "logo": "https://..."
    }
  ],
  "errors": [],
  "timestamp": "2024-02-13T10:30:00.000Z",
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
  "timestamp": "2024-02-13T10:35:00.000Z",
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
  "timestamp": "2024-02-13T10:40:00.000Z",
  "totalItems": 3000
}
```

## Logs

Os logs são salvos automaticamente em `logs/` com timestamp:

- `brands-YYYY-MM-DDTHH-mm-ss.log`
- `models-YYYY-MM-DDTHH-mm-ss.log`
- `versions-YYYY-MM-DDTHH-mm-ss.log`
- `all-YYYY-MM-DDTHH-mm-ss.log`

## Troubleshooting

### Rate Limiting

Se você receber erros de rate limiting, o crawler já implementa:
- Delays aleatórios entre requisições (1-3 segundos)
- Limite de paralelismo (3 marcas simultâneas, 2 modelos simultâneos)

Você pode ajustar esses valores em:
- `src/crawlers/models.ts` - linha `const limit = pLimit(3)`
- `src/crawlers/versions.ts` - linha `const limit = pLimit(2)`

### Timeout

Se as requisições estão dando timeout, aumente o timeout em:
```typescript
axios.get(url, {
  timeout: 10000, // Aumentar este valor
})
```

### Dados Incompletos

Algumas versões podem não estar disponíveis na API do Webmotors. Isso é esperado.

O crawler coleta o que está disponível publicamente.

## Boas Práticas

1. **Execute o crawl fora do horário de pico** para evitar sobrecarga nos servidores
2. **Valide sempre os dados** após o crawl
3. **Faça backup** dos dados coletados antes de re-executar
4. **Não execute o crawl repetidamente** - os dados não mudam com frequência
5. **Respeite o robots.txt** e os termos de serviço

## Agendamento Automático

Para executar o crawler periodicamente, você pode usar cron:

```bash
# Editar crontab
crontab -e

# Adicionar linha para executar toda segunda-feira às 3h da manhã
0 3 * * 1 cd /caminho/para/projeto/crawler && npm run crawl:all
```

## Próximos Passos

Após coletar e validar os dados:

1. Importe para o banco de dados do backend
2. Crie seeds no Prisma para popular o banco em development
3. Configure o sistema de busca de veículos no frontend
4. Implemente autocomplete de marcas/modelos
