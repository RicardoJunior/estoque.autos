# Estoque.autos SaaS

Plataforma completa de gestão para lojas de veículos (carros, motos e utilitários) que unifica gestão de estoque, captação de leads, controle financeiro e presença digital em um único sistema.

## Stack Tecnológica

- **Backend**: Node.js + TypeScript + Express
- **Banco de Dados**: Supabase (PostgreSQL)
- **Frontend**: React + DaisyUI (Tailwind)
- **Testes**: Jest

## Estrutura do Projeto

```
.
├── backend/          # API REST com Express + TypeScript
├── frontend/         # Interface React + DaisyUI
├── shared/           # Tipos e utilitários compartilhados
└── docs/             # Documentação adicional
```

## Começando

### Pré-requisitos

- Node.js >= 20.0.0
- npm >= 10.0.0
- Conta Supabase

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Iniciar desenvolvimento
npm run dev
```

### Scripts Disponíveis

- `npm run dev` - Inicia backend e frontend em modo de desenvolvimento
- `npm run build` - Build de produção
- `npm run test` - Executa testes
- `npm run lint` - Verifica qualidade do código
- `npm run format` - Formata código com Prettier

## Documentação

Para documentação completa do projeto, veja [project.md](./project.md).

## Licença

Proprietary - © 2026 Estoque.autos
