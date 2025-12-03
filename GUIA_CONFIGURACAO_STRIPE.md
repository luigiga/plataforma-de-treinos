# 🔐 Guia de Configuração do Stripe

Este guia explica como configurar o Stripe para o sistema de pagamentos da plataforma.

## 📋 Pré-requisitos

1. Conta no Stripe (criar em https://stripe.com)
2. Acesso ao dashboard do Supabase
3. Variáveis de ambiente configuradas

---

## 🔑 Passo 1: Criar Conta no Stripe

1. Acesse https://stripe.com e crie uma conta
2. Complete o processo de verificação (pode usar modo de teste inicialmente)
3. Acesse o Dashboard do Stripe

---

## 🔑 Passo 2: Obter Chaves da API

### 2.1 Modo de Teste (Recomendado para desenvolvimento)

1. No Dashboard do Stripe, vá em **Developers** > **API keys**
2. Certifique-se de estar no modo **Test mode** (toggle no topo)
3. Copie as seguintes chaves:
   - **Publishable key** (começa com `pk_test_...`)
   - **Secret key** (começa com `sk_test_...`) - Clique em "Reveal test key"

### 2.2 Modo de Produção

1. Altere para **Live mode** no toggle
2. Copie as chaves de produção:
   - **Publishable key** (começa com `pk_live_...`)
   - **Secret key** (começa com `sk_live_...`)

---

## 🔑 Passo 3: Configurar Variáveis de Ambiente

### 3.1 Variáveis do Frontend (`.env`)

Adicione ao arquivo `.env` na raiz do projeto:

```env
# Stripe (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**⚠️ IMPORTANTE:** A chave secreta (`sk_...`) NUNCA deve ser adicionada ao frontend!

### 3.2 Variáveis do Backend (Supabase Edge Functions)

As variáveis de ambiente do backend são configuradas no Supabase Dashboard:

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** > **Edge Functions**
4. Adicione as seguintes variáveis:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Nota:** O `STRIPE_WEBHOOK_SECRET` será obtido no próximo passo.

---

## 🔗 Passo 4: Configurar Webhook do Stripe

### 4.1 Criar Endpoint do Webhook

1. No Dashboard do Stripe, vá em **Developers** > **Webhooks**
2. Clique em **Add endpoint**
3. Configure:
   - **Endpoint URL:** `https://[seu-projeto].supabase.co/functions/v1/stripe-webhook`
   - **Description:** "Supabase Stripe Webhook"
   - **Events to send:** Selecione os seguintes eventos:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `invoice.payment_succeeded`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`

4. Clique em **Add endpoint**

### 4.2 Obter Webhook Secret

1. Após criar o endpoint, clique nele
2. Na seção **Signing secret**, clique em **Reveal**
3. Copie o secret (começa com `whsec_...`)
4. Adicione ao Supabase como `STRIPE_WEBHOOK_SECRET` (Passo 3.2)

---

## 📦 Passo 5: Criar Produtos no Stripe

### 5.1 Criar Produtos de Assinatura

1. No Dashboard do Stripe, vá em **Products**
2. Clique em **Add product**
3. Configure:
   - **Name:** "Assinatura Mensal" (ou "Assinatura Anual")
   - **Description:** Descrição do plano
   - **Pricing model:** Recurring
   - **Price:** Valor em centavos (ex: R$ 99,00 = 9900)
   - **Billing period:** Monthly ou Yearly
   - **Currency:** BRL

4. Clique em **Save product**
5. Copie o **Price ID** (começa com `price_...`)

### 5.2 Criar Produtos no Banco de Dados

Após criar os produtos no Stripe, você precisa criar registros correspondentes na tabela `payment_products`:

```sql
-- Exemplo: Assinatura Mensal
INSERT INTO payment_products (
  name,
  description,
  type,
  price,
  currency,
  billing_period,
  stripe_product_id,
  stripe_price_id,
  is_active
) VALUES (
  'Assinatura Mensal',
  'Acesso completo a todos os treinos',
  'subscription',
  99.00,
  'BRL',
  'month',
  'prod_...',  -- Product ID do Stripe
  'price_...', -- Price ID do Stripe
  true
);

-- Exemplo: Assinatura Anual
INSERT INTO payment_products (
  name,
  description,
  type,
  price,
  currency,
  billing_period,
  stripe_product_id,
  stripe_price_id,
  is_active
) VALUES (
  'Assinatura Anual',
  'Acesso completo a todos os treinos (12 meses)',
  'subscription',
  990.00,
  'BRL',
  'year',
  'prod_...',  -- Product ID do Stripe
  'price_...', -- Price ID do Stripe
  true
);
```

---

## 🚀 Passo 6: Deploy das Edge Functions

### 6.1 Instalar Supabase CLI (se ainda não tiver)

```bash
npm install -g supabase
```

### 6.2 Fazer Login

```bash
npx supabase login
```

### 6.3 Deploy das Functions

```bash
# Deploy individual
npx supabase functions deploy create-payment-intent
npx supabase functions deploy create-subscription
npx supabase functions deploy cancel-subscription
npx supabase functions deploy stripe-webhook

# Ou deploy de todas de uma vez
npx supabase functions deploy
```

---

## ✅ Verificação

### Checklist:

- [ ] Conta no Stripe criada
- [ ] Chaves de API obtidas (teste e/ou produção)
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` adicionado ao `.env`
- [ ] `STRIPE_SECRET_KEY` configurado no Supabase
- [ ] Webhook criado no Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` configurado no Supabase
- [ ] Produtos criados no Stripe
- [ ] Produtos sincronizados no banco de dados
- [ ] Edge Functions deployadas

---

## 🧪 Testar o Sistema

### 1. Testar Payment Intent (Pagamento Único)

Use os cartões de teste do Stripe:
- **Sucesso:** `4242 4242 4242 4242`
- **Falha:** `4000 0000 0000 0002`

### 2. Testar Subscription (Assinatura)

Use o mesmo cartão de teste para criar assinaturas.

### 3. Verificar Webhooks

1. No Dashboard do Stripe, vá em **Developers** > **Webhooks**
2. Clique no seu endpoint
3. Verifique os eventos recebidos na aba **Events**

---

## 🔒 Segurança

### ⚠️ IMPORTANTE:

1. **NUNCA** commite chaves secretas no Git
2. Use variáveis de ambiente para todas as chaves
3. Em produção, use sempre HTTPS
4. Valide webhooks usando o `STRIPE_WEBHOOK_SECRET`
5. Use modo de teste durante desenvolvimento

---

## 📚 Recursos Adicionais

- [Documentação do Stripe](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## 🐛 Troubleshooting

### Erro: "Missing environment variables"
- Verifique se todas as variáveis estão configuradas no Supabase
- Certifique-se de que as variáveis começam com o prefixo correto

### Erro: "Webhook signature verification failed"
- Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
- Certifique-se de que o webhook está apontando para a URL correta

### Erro: "Product not found"
- Verifique se os produtos foram criados no Stripe
- Verifique se os `stripe_product_id` e `stripe_price_id` estão corretos no banco

