# 🏋️ FitPlatform - Plataforma de Treinos Fitness

Plataforma que conecta personal trainers e alunos, oferecendo treinos personalizados, acompanhamento de progresso, sistema de pagamentos e recursos sociais.

## 🚀 Stack Tecnológica

### Frontend
- **React 19**
- **Vite**
- **TypeScript**
- **Shadcn UI**
- **Tailwind CSS**
- **React Router**
- **React Hook Form**
- **Zod**
- **Recharts**
- **React Query**
- **Stripe Elements**

### Backend
- **Supabase** (PostgreSQL, Auth, Storage, Edge Functions)
- **Stripe**
- **Deno** para Edge Functions

### Gerenciador de Pacotes
- **pnpm**

## 📋 Pré-requisitos

- **Node.js 18+**
- **pnpm**
- **Conta no Supabase**
- **Conta no Stripe** (se pagamentos estiverem habilitados)

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

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_do_supabase

# Stripe (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Configurar Banco de Dados

**Importante:** não aplique apenas migrations isoladas. O projeto depende do conjunto completo de migrations para funcionar corretamente.

Use um destes caminhos:

```bash
npx supabase db push
```

ou siga o passo a passo completo em [`SETUP_LOCAL.md`](./SETUP_LOCAL.md).

### 5. Configurar Stripe e Edge Functions

Se pagamentos estiverem habilitados, siga o guia completo em [`GUIA_CONFIGURACAO_STRIPE.md`](./GUIA_CONFIGURACAO_STRIPE.md).

Além das variáveis do frontend, as Edge Functions precisam de:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ALLOWED_ORIGIN`

## 💻 Scripts Disponíveis

### Desenvolvimento

```bash
pnpm start
# ou
pnpm dev
```

A aplicação sobe em `http://localhost:8080`.

### Qualidade

```bash
pnpm run lint
pnpm run lint:fix
pnpm run format
pnpm run test
pnpm run test:watch
```

### Build

```bash
pnpm run build
pnpm run build:dev
pnpm run preview
```

## 📁 Estrutura do Projeto

```
.
├── src/
│   ├── components/
│   │   ├── payments/
│   │   ├── ui/
│   │   └── ...
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   │   ├── stripe/
│   │   └── supabase/
│   ├── pages/
│   ├── services/
│   │   └── payments/
│   └── test/
├── supabase/
│   ├── functions/
│   └── migrations/
├── public/
├── dist/
├── CHECKLIST_PRODUCAO.md
└── package.json
```

## ✨ Funcionalidades Principais

### 👥 Gestão de Usuários
- autenticação com Supabase Auth
- perfis de usuário (`subscriber`, `trainer`, `admin`)
- perfis públicos e privados
- sistema social

### 🏋️ Treinos
- criação e edição de treinos
- categorização por dificuldade e tipo
- progresso e histórico
- dashboards por perfil

### 💳 Pagamentos
- pagamento único por treino
- assinaturas
- integração com Stripe
- split de receita
- histórico de transações

## 📝 Qualidade de Código

- TypeScript
- Oxlint
- Prettier
- React Query
- Zod
- Vitest + Testing Library

## 🔄 Workflow Recomendado

1. `pnpm install`
2. configurar `.env`
3. aplicar migrations
4. configurar Stripe/Edge Functions se necessário
5. `pnpm dev`
6. `pnpm run lint`
7. `pnpm run test`
8. `pnpm run build`

## 📦 Deploy

### Frontend
```bash
pnpm run build
```

### Edge Functions
```bash
npx supabase login
npx supabase functions deploy create-payment-intent
npx supabase functions deploy create-subscription
npx supabase functions deploy cancel-subscription
npx supabase functions deploy stripe-webhook
```

Antes de colocar em produção, valide o checklist em [`CHECKLIST_PRODUCAO.md`](./CHECKLIST_PRODUCAO.md).

## 📚 Documentação Adicional

- [`SETUP_LOCAL.md`](./SETUP_LOCAL.md)
- [`GUIA_CONFIGURACAO_STRIPE.md`](./GUIA_CONFIGURACAO_STRIPE.md)
- [`GUIA_MIGRATIONS_PAGAMENTOS.md`](./GUIA_MIGRATIONS_PAGAMENTOS.md)
- [`IMPLEMENTACAO_PAGAMENTOS.md`](./IMPLEMENTACAO_PAGAMENTOS.md)
- [`CHECKLIST_PRODUCAO.md`](./CHECKLIST_PRODUCAO.md)

## 🔒 Segurança

- autenticação via Supabase Auth
- RLS no banco
- validação de permissões em rotas protegidas
- secrets fora do frontend
- verificação de webhook Stripe no backend

## 🤝 Contribuindo

1. crie uma branch
2. faça suas alterações
3. rode lint, testes e build
4. abra um PR

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Autor

- Luigi Garcia

---

**Desenvolvido para conectar trainers e alunos com foco em evolução técnica e operacional.**
