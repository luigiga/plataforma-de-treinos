# ✅ Checklist de Produção - FitPlatform

Este documento consolida o que precisa estar validado antes de colocar o projeto no ar com confiança.

## 1. Ambiente e Secrets

### Frontend
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` (se pagamentos estiverem habilitados)

### Supabase Edge Functions
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `ALLOWED_ORIGIN` configurado com a URL do frontend de produção

## 2. Banco de Dados
- [ ] todas as migrations foram aplicadas no ambiente final
- [ ] constraints e índices estão presentes no banco de produção
- [ ] tabelas críticas de pagamento existem e estão consistentes
- [ ] tabela `app_logs` existe
- [ ] políticas RLS foram revisadas

## 3. Autenticação
- [ ] fluxo de login funcionando
- [ ] fluxo de registro funcionando
- [ ] confirmação de e-mail redirecionando para `/auth/confirm`
- [ ] criação automática/manual de perfil funcionando
- [ ] redirect pós-login funcionando em rotas protegidas

## 4. Pagamentos
- [ ] produtos do Stripe criados e sincronizados no banco
- [ ] webhook Stripe apontando para a Edge Function correta
- [ ] `STRIPE_WEBHOOK_SECRET` configurado no Supabase
- [ ] pagamento único validado ponta a ponta
- [ ] assinatura validada ponta a ponta
- [ ] cancelamento de assinatura validado ponta a ponta
- [ ] reprocessamento de webhook não gera duplicidade de transação

## 5. Qualidade e Build
- [ ] `pnpm install`
- [ ] `pnpm run lint`
- [ ] `pnpm run test`
- [ ] `pnpm run build`
- [ ] smoke test manual executado em ambiente próximo de produção

## 6. Deploy
- [ ] frontend publicado com variáveis corretas
- [ ] Edge Functions publicadas
- [ ] domínio/frontend autorizado em `ALLOWED_ORIGIN`
- [ ] rotas públicas e protegidas validadas após deploy

## 7. Observabilidade
- [ ] logs de erro chegando em `app_logs`
- [ ] erros críticos também visíveis no console/monitoramento da plataforma
- [ ] fluxo de falha de pagamento gera trilha suficiente para diagnóstico

## 8. Processo de Release
- [ ] branch `main` protegida
- [ ] merge apenas via PR
- [ ] workflow de CI habilitado
- [ ] checklist de PR sendo usado

## Go-live recomendado

Antes de abrir publicamente:
1. validar tudo em um ambiente de staging
2. executar um teste completo de compra única
3. executar um teste completo de assinatura
4. validar cancelamento e webhook
5. só então habilitar tráfego real
