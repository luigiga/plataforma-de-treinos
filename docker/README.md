# Docker — Deploy (Hostinger VPS)

Este repo entrega só o **frontend** em container (Nginx + SPA Vite).  
Auth/DB/Storage/Edge Functions ficam no **Supabase Cloud**; pagamentos no **Stripe**.

## Build local

1. Copie `.env.docker.example` → `.env.docker` e preencha as `VITE_*` de staging/prod.
2. Suba (não use o `.env` de mock do Vite):

```bash
docker compose --env-file .env.docker build
docker compose --env-file .env.docker up -d
```

Ou: `pnpm run docker:build` / `pnpm run docker:up`.

App em `http://localhost` (ou `PORT`). Health: `/healthz`.

## Hostinger + GitHub

1. VPS com template **Docker**.
2. No GitHub: Secrets `HOSTINGER_API_KEY`, `VITE_SUPABASE_URL`,  
   `VITE_SUPABASE_PUBLISHABLE_KEY`, (opcional) `VITE_STRIPE_PUBLISHABLE_KEY`  
   e Variable `HOSTINGER_VM_ID`.
3. Push em `main` dispara `.github/workflows/deploy-hostinger.yml`.

Alternativa: no hPanel → Docker Manager → Compose from URL apontando para  
`docker-compose.yml` deste repositório (configure as env/build args no painel).

## Importante

Variáveis `VITE_*` entram no **build** da imagem. Mudou env → rebuild obrigatório.
