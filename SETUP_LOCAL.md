# 🚀 Guia de Setup Local - FitPlatform

## 📋 Pré-requisitos

- **Node.js 18+** (verificar com `node --version`)
- **npm** ou **pnpm** (o projeto tem `pnpm-lock.yaml`, então pnpm é recomendado)
- **Conta no Supabase** (gratuita em https://supabase.com)

---

## 🔧 Passo 1: Instalar Dependências

### Opção A: Usando npm
```bash
npm install
```

### Opção B: Usando pnpm (recomendado)
```bash
# Instalar pnpm se não tiver
npm install -g pnpm

# Instalar dependências
pnpm install
```

---

## 🔑 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Criar arquivo `.env`

Na raiz do projeto, crie um arquivo `.env`:

```bash
# Windows (PowerShell)
New-Item .env

# Linux/Mac
touch .env
```

### 2.2 Adicionar variáveis do Supabase

Abra o arquivo `.env` e adicione:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_do_supabase
```

### 2.3 Obter credenciais do Supabase

1. Acesse https://app.supabase.com
2. Crie um novo projeto (ou use um existente)
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

**Exemplo:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🗄️ Passo 3: Configurar Banco de Dados (Supabase)

### 3.1 Aplicar Migrations

No dashboard do Supabase:

1. Vá em **SQL Editor**
2. Execute as migrations na ordem (pasta `supabase/migrations/`):
   - `20251123153000_create_profiles_table.sql`
   - `20251123160000_setup_storage_and_profile_updates.sql`
   - `20251123163000_ensure_public_profiles_access.sql`
   - `20251124120000_create_notifications_table.sql`
   - `20251124121000_create_core_tables.sql`
   - `20251125100000_add_status_to_follows.sql`
   - `20251126180000_create_app_logs_table.sql`
   - `20251126182000_add_status_to_profiles.sql`
   - `20251126230000_fix_handle_new_user_trigger.sql`
   - `20251127100000_fix_registration_error.sql`
   - `20251127130000_verify_profiles_constraints.sql`
   - `20251127140000_robust_user_creation.sql`
   - `20251127150000_ensure_robust_registration.sql`
   - `20251128000000_add_performance_indexes.sql` ⚡ **IMPORTANTE para performance**

**OU** use a CLI do Supabase (se tiver instalada):
```bash
supabase db push
```

---

## 🚀 Passo 4: Iniciar o Servidor

### Opção A: Usando npm
```bash
npm start
# ou
npm run dev
```

### Opção B: Usando pnpm
```bash
pnpm start
# ou
pnpm dev
```

### Acessar a aplicação

A aplicação estará disponível em:
- **http://localhost:8080** (porta configurada no vite.config.ts)

---

## ✅ Verificação

### Checklist:

- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`node_modules` existe)
- [ ] Arquivo `.env` criado com variáveis do Supabase
- [ ] Migrations aplicadas no Supabase
- [ ] Servidor rodando sem erros
- [ ] Aplicação abre no navegador

---

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env` está na raiz do projeto
- Verifique se as variáveis começam com `VITE_`
- Reinicie o servidor após criar/editar `.env`

### Erro: "Cannot find module"
- Execute `npm install` ou `pnpm install` novamente
- Delete `node_modules` e `package-lock.json`/`pnpm-lock.yaml` e reinstale

### Erro: "Port 8080 already in use"
- Altere a porta no `vite.config.ts` (linha 10)
- Ou mate o processo usando a porta 8080

### Erro de conexão com Supabase
- Verifique se as credenciais no `.env` estão corretas
- Verifique se o projeto Supabase está ativo
- Verifique se as migrations foram aplicadas

### Erro: "Table does not exist"
- Aplique todas as migrations no Supabase
- Verifique a ordem das migrations

---

## 📝 Próximos Passos

1. **Criar uma conta de teste** na aplicação
2. **Testar funcionalidades principais**:
   - Login/Registro
   - Criar treino (como trainer)
   - Visualizar treinos (como subscriber)
   - Sistema social (seguir usuários)

---

## 🔗 Links Úteis

- **Supabase Dashboard**: https://app.supabase.com
- **Documentação Supabase**: https://supabase.com/docs
- **Documentação Vite**: https://vite.dev

---

## 💡 Dicas

- Use **pnpm** para instalação mais rápida
- Mantenha o `.env` no `.gitignore` (não commite credenciais)
- Use o **React Query DevTools** (aparece automaticamente em desenvolvimento)
- As migrations de índices (`20251128000000_add_performance_indexes.sql`) são críticas para performance

