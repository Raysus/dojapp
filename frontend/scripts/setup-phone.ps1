$ErrorActionPreference = 'Stop'

function Get-LanIp {
  $ips = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
      $_.IPAddress -notlike '127.*' -and
      $_.IPAddress -notlike '169.254.*' -and
      $_.PrefixOrigin -ne 'WellKnown'
    } |
    Sort-Object InterfaceMetric

  $wifi = $ips | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } | Select-Object -First 1
  if ($wifi) { return $wifi.IPAddress }

  $ip = $ips | Select-Object -First 1 -ExpandProperty IPAddress
  if (-not $ip) {
    throw 'No se encontró una IP LAN. Conecta el PC a WiFi.'
  }

  return $ip
}

$frontendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $frontendRoot
$envFile = Join-Path $frontendRoot '.env'
$lanIp = Get-LanIp
$androidApi = "http://${lanIp}:3000"

Write-Host "IP detectada: $lanIp"
Write-Host "API Android:  $androidApi"

if (Test-Path $envFile) {
  $content = Get-Content $envFile -Raw
  if ($content -match '(?m)^VITE_API_URL_ANDROID=.*$') {
    $content = [regex]::Replace($content, '(?m)^VITE_API_URL_ANDROID=.*$', "VITE_API_URL_ANDROID=$androidApi")
  } else {
    $content += "`nVITE_API_URL_ANDROID=$androidApi`n"
  }
  Set-Content -Path $envFile -Value $content.TrimEnd() -Encoding UTF8
} else {
  @"
VITE_API_URL=http://localhost:3000
VITE_API_URL_ANDROID=$androidApi
"@ | Set-Content -Path $envFile -Encoding UTF8
}

Write-Host 'Abriendo firewall para puerto 3000 (backend)...'
try {
  $ruleName = 'Dojapp Backend 3000'
  $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
  if (-not $existing) {
    New-NetFirewallRule `
      -DisplayName $ruleName `
      -Direction Inbound `
      -Action Allow `
      -Protocol TCP `
      -LocalPort 3000 | Out-Null
    Write-Host 'Regla de firewall creada.'
  } else {
    Write-Host 'Regla de firewall ya existía.'
  }
} catch {
  Write-Warning "No se pudo crear la regla de firewall (ejecuta PowerShell como administrador): $_"
}

Write-Host ''
Write-Host '=== Prueba rápida desde el teléfono ==='
Write-Host "1) Backend: cd backend && npm run start:dev"
Write-Host "2) En el navegador del teléfono abre: $androidApi/health"
Write-Host '3) APK debug: cd frontend && npm run build:apk'
Write-Host '4) Instala: frontend/android/app/build/outputs/apk/debug/app-debug.apk'
Write-Host ''
Write-Host 'Usuarios demo: alumno@dojo.cl / sensei@dojo.cl (pass: 123456)'
