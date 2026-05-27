$ErrorActionPreference = 'Stop'

$frontendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$androidDir = Join-Path $frontendRoot 'android'

function Find-JavaHome {
  $candidates = @(
    $env:JAVA_HOME,
    'C:\Program Files\Android\Android Studio\jbr',
    'C:\Program Files\Microsoft\jdk-17*',
    'C:\Program Files\Eclipse Adoptium\jdk-17*',
    'C:\Program Files\Java\jdk-17*'
  )

  foreach ($candidate in $candidates) {
    if ([string]::IsNullOrWhiteSpace($candidate)) { continue }
    $resolved = Resolve-Path $candidate -ErrorAction SilentlyContinue
    if ($resolved) {
      $javaExe = Join-Path $resolved.Path 'bin\java.exe'
      if (Test-Path $javaExe) { return $resolved.Path }
    }
  }

  $javaCmd = Get-Command java -ErrorAction SilentlyContinue
  if ($javaCmd) {
    $javaBin = Split-Path $javaCmd.Source -Parent
    return (Resolve-Path (Join-Path $javaBin '..')).Path
  }

  throw 'Java no encontrado. Instala OpenJDK 17 o Android Studio y vuelve a intentar.'
}

Push-Location $frontendRoot
try {
  Write-Host 'Build web + sync Capacitor...'
  npm run build:mobile

  $javaHome = Find-JavaHome
  $env:JAVA_HOME = $javaHome
  $env:PATH = "$javaHome\bin;$env:PATH"
  Write-Host "JAVA_HOME=$javaHome"

  $sdkPath = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
  if (-not (Test-Path $sdkPath)) {
    $sdkPath = Join-Path $env:USERPROFILE 'AppData\Local\Android\Sdk'
  }
  if (Test-Path $sdkPath) {
    $sdkEscaped = ($sdkPath -replace '\\', '/')
    "sdk.dir=$sdkEscaped" | Set-Content -Path (Join-Path $androidDir 'local.properties') -Encoding ASCII
    Write-Host "Android SDK: $sdkPath"
  } else {
    Write-Warning 'Android SDK no encontrado. Instala Android Studio y abre el SDK Manager una vez.'
  }

  Push-Location $androidDir
  Write-Host 'Compilando APK debug...'
  .\gradlew.bat assembleDebug

  $apk = Join-Path $androidDir 'app\build\outputs\apk\debug\app-debug.apk'
  if (Test-Path $apk) {
    Write-Host ''
    Write-Host "APK lista: $apk"
  } else {
    throw 'No se generó app-debug.apk'
  }
} finally {
  Pop-Location
  Pop-Location
}
