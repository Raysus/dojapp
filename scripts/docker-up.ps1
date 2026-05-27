# Levanta solo PostgreSQL en Docker (backend/frontend en local)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Wait-DockerReady {
    param([int]$TimeoutSec = 180)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            docker info *> $null
            return $true
        } catch {
            Start-Sleep -Seconds 3
        }
    }
    return $false
}

$dockerDesktop = @(
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not (Wait-DockerReady -TimeoutSec 5)) {
    if ($dockerDesktop) {
        Write-Host "Iniciando Docker Desktop..."
        Start-Process $dockerDesktop | Out-Null
        if (-not (Wait-DockerReady -TimeoutSec 180)) {
            throw 'Docker no respondió a tiempo. Abre Docker Desktop manualmente e intenta de nuevo.'
        }
    } else {
        throw 'Docker no está disponible. Instala Docker Desktop o inicia el daemon.'
    }
}

Write-Host 'Levantando PostgreSQL...' -ForegroundColor Cyan
Push-Location $root
try {
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { throw "docker compose falló con código $LASTEXITCODE" }

    Write-Host 'Esperando Postgres...' -ForegroundColor Cyan
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        $status = docker inspect -f '{{.State.Health.Status}}' dojapp-postgres 2>$null
        if ($status -eq 'healthy') {
            $ready = $true
            break
        }
        Start-Sleep -Seconds 2
    }

    if (-not $ready) {
        docker compose logs postgres --tail 40
        throw 'PostgreSQL no quedó healthy a tiempo'
    }

    Write-Host ''
    Write-Host 'PostgreSQL activo:' -ForegroundColor Green
    Write-Host '  Host: localhost:5432'
    Write-Host '  DB:   dojapp (user/pass: postgres/postgres)'
    Write-Host ''
    Write-Host 'Siguiente paso (en terminales locales):'
    Write-Host '  cd backend'
    Write-Host '  npx dotenv -e .env -- npx prisma migrate deploy'
    Write-Host '  npx dotenv -e .env -- npx prisma db seed'
    Write-Host '  npm run start:dev'
    Write-Host ''
    Write-Host '  cd frontend'
    Write-Host '  npm run dev'
} finally {
    Pop-Location
}
