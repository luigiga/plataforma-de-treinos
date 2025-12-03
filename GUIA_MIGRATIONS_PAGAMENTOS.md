# Guia de Migrations - Sistema de Pagamentos

## 📋 Migrations que Precisam ser Executadas

Você precisa executar **2 migrations** no Supabase para o sistema de pagamentos funcionar:

### 1. `20251202000000_create_payment_tables.sql`
**O que faz:**
- Cria 5 tabelas de pagamento:
  - `payment_products` - Produtos/Planos
  - `payment_subscriptions` - Assinaturas
  - `payment_transactions` - Transações
  - `payment_splits` - Divisões de receita
  - `payment_payouts` - Histórico de payouts
- Cria índices para performance
- Configura RLS Policies
- Cria triggers para `updated_at`

### 2. `20251202000001_add_price_to_workouts.sql`
**O que faz:**
- Adiciona campos na tabela `workouts`:
  - `price` - Preço do treino
  - `is_paid` - Se requer pagamento
  - `purchase_type` - Tipo de compra (subscription/one_time/free)
- Cria índices para busca

## 🚀 Como Executar as Migrations

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Abra o arquivo `supabase/migrations/20251202000000_create_payment_tables.sql`
5. Copie todo o conteúdo e cole no editor
6. Clique em **Run** (ou pressione `Ctrl+Enter`)
7. Repita o processo para `20251202000001_add_price_to_workouts.sql`

### Opção 2: Via Supabase CLI

```bash
# Se você tem o Supabase CLI instalado
supabase db push
```

Isso executará todas as migrations pendentes automaticamente.

### Opção 3: Via SQL direto

1. No Supabase Dashboard, vá em **SQL Editor**
2. Execute cada migration uma por vez na ordem:
   - Primeiro: `20251202000000_create_payment_tables.sql`
   - Depois: `20251202000001_add_price_to_workouts.sql`

## ⚠️ Ordem de Execução

**IMPORTANTE:** Execute as migrations nesta ordem:

1. ✅ `20251202000000_create_payment_tables.sql` (primeiro)
2. ✅ `20251202000001_add_price_to_workouts.sql` (depois)

A segunda migration depende da primeira estar completa.

## 🔄 Quando Regenerar os Tipos TypeScript

### **Regenerar os tipos DEPOIS de executar as migrations**

Os tipos do Supabase precisam ser regenerados para incluir as novas tabelas de pagamento. Caso contrário, você verá erros de tipo no TypeScript.

### Como Regenerar:

#### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Certifique-se de estar no diretório do projeto
cd C:\fitPlatform\plataforma-de-treinos

# 2. Gere os tipos
npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/lib/supabase/database.types.ts
```

**Onde encontrar o Project ID:**
- No Supabase Dashboard, vá em **Settings** > **API**
- O **Project ID** está na seção "Project URL"

#### Opção 2: Via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **Settings** > **API**
3. Role até a seção **Database Types**
4. Selecione **TypeScript**
5. Copie o conteúdo gerado
6. Cole em `src/lib/supabase/database.types.ts` (ou crie o arquivo se não existir)

#### Opção 3: Usando a URL do projeto

```bash
# Substitua YOUR_PROJECT_REF pela referência do seu projeto
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/lib/supabase/database.types.ts
```

### ⚠️ Importante sobre os Tipos

**Atualmente, o código usa `as any` temporariamente** porque os tipos ainda não incluem as novas tabelas. Depois de regenerar os tipos, você pode remover os `as any` dos arquivos:

- `src/services/payments/products.ts`
- `src/services/payments/subscriptions.ts`
- `src/services/payments/transactions.ts`
- `src/services/payments/splits.ts`
- `src/services/payments/stripe.ts`

## ✅ Checklist de Execução

- [ ] Executar `20251202000000_create_payment_tables.sql` no Supabase
- [ ] Verificar se as tabelas foram criadas (SQL Editor > Table Editor)
- [ ] Executar `20251202000001_add_price_to_workouts.sql` no Supabase
- [ ] Verificar se os campos foram adicionados à tabela `workouts`
- [ ] Regenerar os tipos TypeScript
- [ ] Remover `as any` dos serviços (opcional, mas recomendado)
- [ ] Testar se não há erros de compilação

## 🔍 Verificando se Funcionou

### Verificar Tabelas Criadas:

No Supabase Dashboard:
1. Vá em **Table Editor**
2. Você deve ver as novas tabelas:
   - `payment_products`
   - `payment_subscriptions`
   - `payment_transactions`
   - `payment_splits`
   - `payment_payouts`

### Verificar Campos Adicionados:

1. Vá em **Table Editor** > `workouts`
2. Verifique se existem as colunas:
   - `price`
   - `is_paid`
   - `purchase_type`

## 🐛 Problemas Comuns

### Erro: "relation already exists"
- Significa que a tabela já existe
- Use `CREATE TABLE IF NOT EXISTS` (já está no código)
- Ou delete a tabela manualmente e execute novamente

### Erro: "column already exists"
- Significa que o campo já existe
- Use `ADD COLUMN IF NOT EXISTS` (já está no código)
- Ou ignore o erro se o campo já existe

### Tipos não atualizados
- Certifique-se de regenerar os tipos após executar as migrations
- Limpe o cache do TypeScript: `npm run build` ou reinicie o servidor de desenvolvimento

## 📝 Notas Finais

- As migrations são **idempotentes** (podem ser executadas múltiplas vezes sem problemas)
- Use `IF NOT EXISTS` para evitar erros se já existir
- Sempre execute as migrations na ordem correta
- Regenerar os tipos é **essencial** para o TypeScript funcionar corretamente

