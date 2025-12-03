# 🏋️ FitPlatform - Plataforma de Treinos Fitness

Plataforma completa que conecta personal trainers e alunos, oferecendo treinos personalizados, acompanhamento de progresso, sistema de pagamentos e muito mais.

## 🚀 Stack Tecnológica

### Frontend
- **React 19** - Biblioteca JavaScript para construção de interfaces
- **Vite** - Build tool extremamente rápida
- **TypeScript** - Superset tipado do JavaScript
- **Shadcn UI** - Componentes reutilizáveis e acessíveis
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Roteamento para aplicações React
- **React Hook Form** - Gerenciamento de formulários performático
- **Zod** - Validação de schemas TypeScript-first
- **Recharts** - Biblioteca de gráficos para React
- **React Query** - Gerenciamento de estado e cache de dados
- **Stripe Elements** - Integração de pagamentos

### Backend
- **Supabase** - Backend-as-a-Service (PostgreSQL, Auth, Storage, Edge Functions)
- **Stripe** - Processamento de pagamentos
- **Deno** - Runtime para Edge Functions

### Gerenciador de Pacotes
- **pnpm** - Gerenciador de pacotes rápido e eficiente

## 📋 Pré-requisitos

- **Node.js 18+** (verificar com `node --version`)
- **pnpm** (instalar com `npm install -g pnpm`)
- **Conta no Supabase** (gratuita em https://supabase.com)
- **Conta no Stripe** (para pagamentos - https://stripe.com)

## 🔧 Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/plataforma-de-treinos.git
cd plataforma-de-treinos
```

### 2. Instalar dependências

```bash
pnpm install
```

**Nota:** Este projeto usa `pnpm` como gerenciador de pacotes. O arquivo `.npmrc` está configurado para usar pnpm automaticamente.

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_do_supabase

# Stripe (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Obter credenciais:**
- **Supabase:** Acesse https://app.supabase.com > Settings > API
- **Stripe:** Acesse https://dashboard.stripe.com > Developers > API keys

### 4. Configurar Banco de Dados

Execute as migrations no Supabase Dashboard (SQL Editor):

1. `supabase/migrations/20251202000000_create_payment_tables.sql`
2. `supabase/migrations/20251202000001_add_price_to_workouts.sql`

Ou use a CLI do Supabase:

```bash
npx supabase db push
```

### 5. Configurar Stripe (Opcional - para pagamentos)

Siga o guia completo em [`GUIA_CONFIGURACAO_STRIPE.md`](./GUIA_CONFIGURACAO_STRIPE.md)

## 💻 Scripts Disponíveis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
pnpm start
# ou
pnpm run dev
```

Abre a aplicação em modo de desenvolvimento em [http://localhost:8080](http://localhost:8080).

### Build

```bash
# Build para produção
pnpm run build

# Build para desenvolvimento
pnpm run build:dev
```

Gera os arquivos otimizados para produção na pasta `dist/`.

### Preview

```bash
# Visualizar build de produção localmente
pnpm run preview
```

Permite visualizar a build de produção localmente antes do deploy.

### Linting e Formatação

```bash
# Executar linter
pnpm run lint

# Executar linter e corrigir problemas automaticamente
pnpm run lint:fix

# Formatar código com Prettier
pnpm run format
```

## 📁 Estrutura do Projeto

```
.
├── src/
│   ├── components/        # Componentes React reutilizáveis
│   │   ├── payments/     # Componentes de pagamento
│   │   ├── ui/           # Componentes Shadcn UI
│   │   └── ...
│   ├── context/          # Context API (Auth, Data)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Bibliotecas e utilitários
│   │   ├── stripe/       # Configuração Stripe
│   │   └── supabase/     # Cliente Supabase e tipos
│   ├── pages/            # Páginas da aplicação
│   ├── services/         # Serviços de API
│   │   └── payments/     # Serviços de pagamento
│   └── ...
├── supabase/
│   ├── functions/         # Edge Functions
│   │   ├── create-payment-intent/
│   │   ├── create-subscription/
│   │   ├── cancel-subscription/
│   │   └── stripe-webhook/
│   └── migrations/       # Migrations do banco de dados
├── public/               # Arquivos estáticos
├── dist/                 # Build de produção (gerado)
└── package.json          # Configurações e dependências
```

## ✨ Funcionalidades Principais

### 👥 Gestão de Usuários
- Sistema de autenticação completo (Supabase Auth)
- Perfis de usuário (Aluno, Personal Trainer, Admin)
- Sistema de follow/seguir
- Perfis públicos e privados

### 🏋️ Treinos
- Criação e edição de treinos
- Categorização por dificuldade e tipo
- Exercícios com vídeos e instruções
- Sistema de avaliações e comentários
- Acompanhamento de progresso

### 💳 Sistema de Pagamentos
- Assinaturas mensais e anuais
- Pagamento único por treino
- Integração com Stripe
- Divisão de receita automática (80/20 ou 90/10 com referral)
- Histórico de transações
- Dashboard de ganhos para trainers

### 🔗 Sistema de Referência
- Links de referência personalizados
- Split ajustado (90/10) para referrals
- Rastreamento de conversões

### 📊 Dashboards
- Dashboard do Aluno (treinos atribuídos, progresso)
- Dashboard do Trainer (treinos criados, clientes, ganhos)
- Dashboard do Admin (gestão de usuários, estatísticas)

### 🔔 Notificações
- Sistema de notificações em tempo real
- Notificações de follow, comentários, atribuições

### 📱 Outras Funcionalidades
- Paginação visual em todas as listas
- Busca global
- Modo claro/escuro
- Tratamento de erros e offline
- Otimização de imagens
- Validação de permissões

## 🎨 Componentes UI

Este projeto inclui uma biblioteca completa de componentes Shadcn UI baseados em Radix UI:

- Accordion, Alert Dialog, Avatar, Button, Checkbox
- Dialog, Dropdown Menu, Form, Input, Label
- Select, Switch, Tabs, Toast, Tooltip
- E muito mais...

## 📝 Ferramentas de Qualidade de Código

- **TypeScript**: Tipagem estática completa
- **Oxlint**: Linter extremamente rápido
- **Prettier**: Formatação automática de código
- **React Query**: Cache e sincronização de dados
- **Zod**: Validação de schemas

## 🔄 Workflow de Desenvolvimento

1. Instale as dependências: `pnpm install`
2. Configure as variáveis de ambiente (`.env`)
3. Execute as migrations no Supabase
4. Inicie o servidor de desenvolvimento: `pnpm start`
5. Faça suas alterações
6. Verifique o código: `pnpm run lint`
7. Formate o código: `pnpm run format`
8. Crie a build: `pnpm run build`
9. Visualize a build: `pnpm run preview`

## 📦 Deploy

### Build para Produção

```bash
pnpm run build
```

Os arquivos otimizados serão gerados na pasta `dist/` e estarão prontos para deploy.

### Deploy das Edge Functions

```bash
# Fazer login no Supabase CLI
npx supabase login

# Deploy das functions
npx supabase functions deploy create-payment-intent
npx supabase functions deploy create-subscription
npx supabase functions deploy cancel-subscription
npx supabase functions deploy stripe-webhook
```

## 📚 Documentação Adicional

- [`SETUP_LOCAL.md`](./SETUP_LOCAL.md) - Guia completo de setup local
- [`GUIA_CONFIGURACAO_STRIPE.md`](./GUIA_CONFIGURACAO_STRIPE.md) - Configuração do Stripe
- [`GUIA_MIGRATIONS_PAGAMENTOS.md`](./GUIA_MIGRATIONS_PAGAMENTOS.md) - Migrations de pagamento
- [`RESUMO_IMPLEMENTACAO_STRIPE.md`](./RESUMO_IMPLEMENTACAO_STRIPE.md) - Resumo da implementação
- [`IMPLEMENTACAO_PAGAMENTOS.md`](./IMPLEMENTACAO_PAGAMENTOS.md) - Documentação técnica

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) no banco de dados
- Validação de permissões em todas as ações críticas
- Chaves secretas nunca expostas no frontend
- Validação de dados em todas as camadas

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Autores

- Luigi Garcia - Desenvolvimento inicial

## 🙏 Agradecimentos

- Supabase pela infraestrutura backend
- Stripe pelo processamento de pagamentos
- Shadcn pela biblioteca de componentes
- Comunidade open source

---

**Desenvolvido com ❤️ para conectar trainers e alunos**
