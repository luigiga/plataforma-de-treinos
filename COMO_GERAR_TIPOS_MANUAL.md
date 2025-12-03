# Como Gerar os Tipos TypeScript Manualmente

## Método Manual (Recomendado - Mais Simples)

### Passo 1: Acesse o Supabase Dashboard
1. Vá para: https://app.supabase.com/project/gjowylzjfowmtnhtsprx
2. Faça login se necessário

### Passo 2: Acesse as Configurações de API
1. No menu lateral, clique em **Settings** (⚙️)
2. Clique em **API** no submenu

### Passo 3: Gere os Tipos TypeScript
1. Role a página até encontrar a seção **"Database Types"**
2. Você verá um seletor com opções: `TypeScript`, `Flow`, etc.
3. Selecione **TypeScript**
4. Copie **TODO** o código gerado (Ctrl+A, Ctrl+C)

### Passo 4: Cole no Arquivo
1. Abra o arquivo `src/lib/supabase/database.types.ts` no VS Code
2. Selecione todo o conteúdo (Ctrl+A)
3. Cole o código copiado (Ctrl+V)
4. Salve o arquivo (Ctrl+S)

## Método Alternativo: Via CLI (Requer Login)

Se preferir usar o CLI:

### 1. Fazer Login no Supabase CLI
```powershell
npx supabase login
```

Isso abrirá o navegador para autenticação.

### 2. Depois de logado, gerar os tipos
```powershell
npx supabase gen types typescript --project-id gjowylzjfowmtnhtsprx > src/lib/supabase/database.types.ts
```

## Verificação

Após gerar os tipos, verifique se o arquivo contém as tabelas de pagamento:

- Procure por `payment_products`
- Procure por `payment_subscriptions`
- Procure por `payment_transactions`
- Procure por `payment_splits`
- Procure por `payment_payouts`

Se encontrar essas tabelas, os tipos foram gerados corretamente! ✅

