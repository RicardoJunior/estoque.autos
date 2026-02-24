# 🚀 Quick Start - Crawler de Veículos

## Instalação Rápida

```bash
cd crawler
npm install  # ✅ Já foi executado!
```

## Status Atual

✅ Estrutura criada
✅ Dependências instaladas (180 pacotes)
✅ Scripts configurados
⚠️ Webmotors bloqueando requisições (403)
📝 Alternativas disponíveis

## Como Usar

### Opção 1: Teste Básico

```bash
# Testar conexão (vai falhar por enquanto)
npm test

# Ver estrutura
npm run dev
```

### Opção 2: Lista Estática

Os crawlers já têm fallback com lista estática de marcas brasileiras.

```bash
npm run crawl:brands
```

Isso vai gerar `data/brands.json` com ~30 marcas principais.

### Opção 3: API FIPE (RECOMENDADO)

Vou criar crawlers usando a API da Tabela FIPE:

```bash
# Instalar crawler FIPE
npm install

# Executar
npm run crawl:fipe
```

## Estrutura de Dados

### Entrada
- API FIPE ou Webmotors (quando disponível)
- Lista estática como fallback

### Saída
```
data/
├── brands.json      # ~30-50 marcas
├── models.json      # ~500-1000 modelos
└── versions.json    # ~3000-5000 versões
```

### Formato
```json
{
  "success": true,
  "data": [...],
  "errors": [],
  "timestamp": "2024-02-13T10:00:00.000Z",
  "totalItems": 30
}
```

## Comandos Principais

| Comando | O que faz |
|---------|-----------|
| `npm test` | Testa conexão |
| `npm run crawl:all` | Crawl completo |
| `npm run crawl:brands` | Só marcas |
| `npm run crawl:models` | Só modelos |
| `npm run validate` | Valida dados |
| `npm run export:sql` | Exporta SQL |

## Roadmap

### ✅ Fase 1: Setup (CONCLUÍDO)
- [x] Estrutura de pastas
- [x] Scripts TypeScript
- [x] Sistema de logs
- [x] Utilitários
- [x] Documentação

### 🔄 Fase 2: Coleta (EM ANDAMENTO)
- [ ] Crawler FIPE API
- [ ] Crawler Webmotors (bloqueado)
- [ ] Validação de dados
- [ ] Exportação SQL

### 📋 Fase 3: Integração (PRÓXIMO)
- [ ] Importar no banco de dados
- [ ] Seeds do Prisma
- [ ] API de busca
- [ ] Frontend autocomplete

## Troubleshooting

### Erro 403 (Webmotors)
**Solução:** Use API FIPE (ver ALTERNATIVES.md)

### Timeout
**Solução:** Aumentar timeout em `src/crawlers/*.ts`

### Dados incompletos
**Solução:** Usar lista estática como complemento

## Arquivos Importantes

- `README.md` - Documentação principal
- `USAGE.md` - Guia de uso detalhado
- `STRUCTURE.md` - Estrutura do projeto
- `ALTERNATIVES.md` - APIs alternativas
- `EXAMPLES.md` - Exemplos de código

## Suporte

- Issues: Criar issue no repositório
- Logs: Verificar `logs/*.log`
- Dados: Verificar `data/*.json`

## Performance Esperada

Com API FIPE:
- Marcas: ~2 segundos
- Modelos: ~2-5 minutos
- Versões: ~10-20 minutos
- **Total: ~15-25 minutos**

## Próximo Passo

**Recomendado:** Implementar crawler usando API FIPE

```bash
# Vou criar para você:
npm run crawl:fipe
```

Quer que eu implemente o crawler FIPE agora?
