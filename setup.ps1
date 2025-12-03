# Script de Setup para Windows PowerShell
# Execute: .\setup.ps1

Write-Host "🚀 Setup FitPlatform - Iniciando..." -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js não encontrado. Instale Node.js 18+ primeiro." -ForegroundColor Red
    exit 1
}

# Verificar npm
Write-Host "📦 Verificando npm..." -ForegroundColor Yellow
$npmVersion = npm --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ npm instalado: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm não encontrado." -ForegroundColor Red
    exit 1
}

# Verificar se .env existe
Write-Host ""
Write-Host "🔑 Verificando arquivo .env..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "✅ Arquivo .env existe" -ForegroundColor Green
} else {
    Write-Host "⚠️  Arquivo .env não encontrado" -ForegroundColor Yellow
    Write-Host "📝 Criando arquivo .env.example..." -ForegroundColor Cyan
    
    $envContent = @"
# Supabase Configuration
# Obtenha essas informações no dashboard do Supabase: https://app.supabase.com
# Vá em Settings > API

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
"@
    
    Set-Content -Path .env.example -Value $envContent
    Write-Host "✅ Arquivo .env.example criado" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Crie um arquivo .env com suas credenciais do Supabase!" -ForegroundColor Red
    Write-Host "   Copie .env.example para .env e preencha com suas credenciais" -ForegroundColor Yellow
    Write-Host ""
}

# Instalar dependências
Write-Host ""
Write-Host "📥 Instalando dependências..." -ForegroundColor Yellow
if (Test-Path node_modules) {
    Write-Host "⚠️  node_modules já existe. Pulando instalação." -ForegroundColor Yellow
    Write-Host "   Para reinstalar, delete node_modules e execute: npm install" -ForegroundColor Gray
} else {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Configure o arquivo .env com suas credenciais do Supabase" -ForegroundColor White
Write-Host "   2. Aplique as migrations no Supabase (veja SETUP_LOCAL.md)" -ForegroundColor White
Write-Host "   3. Execute: npm start" -ForegroundColor White
Write-Host ""

