# 🚀 Guia de Setup Local - FitPlatform

## 📋 Pré-requisitos

- **Node.js 18+**
- **pnpm** (recomendado)
- **Conta no Supabase**
- **Conta no Stripe** (se quiser validar pagamentos)

---

## 🔧 Passo 1: Instalar Dependências

### Opção A: npm
```bash
npm install
```

### Opção B: pnpm (recomendado)
```bash
npm install -g pnpm
pnpm install
```

---

## 🔑 Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_do_supabase
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Obter credenciais do Supabase
1. acesse https://app.supabase.com
2. vá em **Settings > API**
3. copie:
   - **Project URL**
   - **anon public key**

### Obter credenciais do Stripe
1. acesse o dashboard do Stripe
2. copie a **Publishable key** de teste
3. adicione ao `.env` se for validar fluxos de pagamento

---

## 🗄️ Passo 3: Configurar Banco de Dados (Supabase)

No dashboard do Supabase:
1. vá em **SQL Editor**
2. aplique todas as migrations da pasta `supabase/migrations/`

Ou use a CLI:
```bash
supabase db push
```

### Observação importante
As migrations de índices e robustez de registro são parte do setup normal. Não trate apenas as migrations de pagamento como suficientes.

---

## ⚙️ Passo 4: Configurar Edge Functions (opcional, mas recomendado para validar pagamentos)

No Supabase, configure estas variáveis para as functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ALLOWED_ORIGIN`

Depois, publique as functions:

```bash
supabase functions deploy create-payment-intent
supabase functions deploy create-subscription
supabase functions deploy cancel-subscription
supabase functions deploy stripe-webhook
```

---

## 🚀 Passo 5: Iniciar o Servidor

```bash
pnpm dev
```

A aplicação estará disponível em:
- `http://localhost:8080`

---

## ✅ Passo 6: Validar Qualidade Local

Antes de considerar o setup saudável, rode:

```bash
pnpm run lint
pnpm run test
pnpm run build
```

---

## ✅ Checklist Local

- [ ] Node.js 18+ instalado
- [ ] dependências instaladas
- [ ] `.env` criado
- [ ] migrations aplicadas
- [ ] servidor rodando sem erros
- [ ] `pnpm run lint`
- [ ] `pnpm run test`
- [ ] `pnpm run build`

---

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"
- verifique se `.env` está na raiz
- confirme o prefixo `VITE_`
- reinicie o servidor após alterar `.env`

### Erro: "Missing environment variables" nas Edge Functions
- verifique secrets das functions no Supabase
- confirme `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `ALLOWED_ORIGIN`

### Erro: "Table does not exist"
- aplique todas as migrations
- confira se o banco está no projeto correto do Supabase

### Erro: "Port 8080 already in use"
- altere a porta no `vite.config.ts`
- ou finalize o processo que já está usando a porta

---

## 📝 Próximos Passos

1. criar uma conta de teste
2. validar login/registro
3. validar confirmação de e-mail
4. validar fluxo social e treinos
5. se pagamentos estiverem ativos, validar compra única, assinatura e cancelamento

---

## 🔗 Links Úteis

- **Supabase Dashboard**: https://app.supabase.com
- **Documentação Supabase**: https://supabase.com/docs
- **Documentação Vite**: https://vite.dev
- **Checklist de Produção**: [`CHECKLIST_PRODUCAO.md`](./CHECKLIST_PRODUCAO.md)

---

## 💡 Dicas

- use **pnpm**
- não commite `.env`
- use staging antes de produção
- valide pagamentos somente com chaves de teste antes do go-live
