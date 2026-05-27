$ErrorActionPreference = 'Stop'

$androidDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$keystorePath = Join-Path $androidDir 'dojapp-release.jks'
$propsPath = Join-Path $androidDir 'keystore.properties'

function Find-Keytool {
  $candidates = @(
    'keytool',
    "$env:JAVA_HOME\bin\keytool.exe",
    'C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe',
    'C:\Program Files\Android\Android Studio\jre\bin\keytool.exe'
  )

  foreach ($candidate in $candidates) {
    if ([string]::IsNullOrWhiteSpace($candidate)) { continue }
    if ($candidate -eq 'keytool') {
      $resolved = Get-Command keytool -ErrorAction SilentlyContinue
      if ($resolved) { return $resolved.Source }
      continue
    }
    if (Test-Path $candidate) { return $candidate }
  }

  throw "No se encontró keytool. Instala JDK o Android Studio y vuelve a ejecutar."
}

if (Test-Path $keystorePath) {
  Write-Host "Keystore ya existe: $keystorePath"
  exit 0
}

$keytool = Find-Keytool
$storePass = 'dojappdev'
$keyPass = 'dojappdev'
$alias = 'dojapp'
$dname = 'CN=Dojapp Dev, OU=Mobile, O=Dojapp, L=Santiago, ST=RM, C=CL'

& $keytool `
  -genkeypair `
  -v `
  -storetype PKCS12 `
  -keystore $keystorePath `
  -alias $alias `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storepass $storePass `
  -keypass $keyPass `
  -dname $dname

@"
storeFile=dojapp-release.jks
storePassword=$storePass
keyAlias=$alias
keyPassword=$keyPass
"@ | Set-Content -Path $propsPath -Encoding ASCII

Write-Host "Keystore creado en $keystorePath"
Write-Host "keystore.properties generado (solo desarrollo local)."
