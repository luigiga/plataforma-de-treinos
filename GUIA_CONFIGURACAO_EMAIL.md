# Guia de Configuração de Email - FitPlatform

## Para Desenvolvimento (Confirmação de Email DESABILITADA)

### Passo 1: Desabilitar Confirmação de Email no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** → **Settings** → **Email Auth**
3. Desabilite a opção **"Enable email confirmations"**
4. Salve as alterações

### Resultado:
- Após cadastro, o usuário será autenticado automaticamente
- Não será enviado email de confirmação
- Redirecionamento automático para dashboard após cadastro

---

## Para Produção (Confirmação de Email HABILITADA)

### Passo 1: Habilitar Confirmação de Email

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** → **Settings** → **Email Auth**
3. **Habilite** a opção **"Enable email confirmations"**
4. Salve as alterações

### Passo 2: Configurar Redirect URLs

1. Acesse **Authentication** → **URL Configuration**
2. Configure as seguintes URLs:

#### Site URL:
```
https://seudominio.com
```

#### Redirect URLs (adicione todas):
```
https://seudominio.com/auth/confirm
https://seudominio.com/auth/confirm?*
http://localhost:5173/auth/confirm
http://localhost:5173/auth/confirm?*
```

### Passo 3: Personalizar Email de Confirmação (Opcional)

1. Vá em **Authentication** → **Email Templates**
2. Selecione **"Confirm signup"**
3. Personalize o template HTML
4. **Importante**: Use `{{ .ConfirmationURL }}` no template para o link de confirmação

### Resultado:
- Após cadastro, email de confirmação será enviado
- Usuário clica no link → redireciona para `/auth/confirm`
- Email é confirmado → login automático → redireciona para dashboard

---

## Fluxo Implementado

### Desenvolvimento (Confirmação Desabilitada):
1. Usuário faz cadastro
2. ✅ Conta criada + Login automático
3. ✅ Redirecionamento para dashboard

### Produção (Confirmação Habilitada):
1. Usuário faz cadastro
2. 📧 Email de confirmação enviado
3. 🔄 Redirecionamento para aba de login com mensagem
4. Usuário clica no link do email
5. ✅ Redireciona para `/auth/confirm`
6. ✅ Email confirmado + Login automático
7. ✅ Redirecionamento para dashboard

---

## Notas Importantes

- A página `/auth/confirm` já está implementada e pronta para uso
- O código detecta automaticamente se há sessão ou não
- Em desenvolvimento, você pode testar sem confirmação de email
- Em produção, sempre mantenha a confirmação habilitada por segurança

