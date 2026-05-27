$ErrorActionPreference = 'Stop'

$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$latestDir = Join-Path $sdkRoot 'cmdline-tools\latest'
$sdkmanager = Join-Path $latestDir 'bin\sdkmanager.bat'
$zipPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..\.tmp\commandlinetools-win.zip'

function Find-JavaHome {
  $candidates = @(
    $env:JAVA_HOME,
    'C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot',
    'C:\Program Files\Android\Android Studio\jbr'
  )
  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path (Join-Path $candidate 'bin\java.exe'))) {
      return $candidate
    }
  }
  throw 'Java 17 no encontrado. Instala Microsoft OpenJDK 17.'
}

function Invoke-SdkManager {
  param([string[]]$Args)

  $env:JAVA_HOME = Find-JavaHome
  $env:ANDROID_HOME = $sdkRoot
  $env:ANDROID_SDK_ROOT = $sdkRoot

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $sdkmanager
  $psi.Arguments = "--sdk_root=`"$sdkRoot`" $($Args -join ' ')"
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true

  $process = [System.Diagnostics.Process]::Start($psi)
  for ($i = 0; $i -lt 100; $i++) {
    $process.StandardInput.WriteLine('y')
  }
  $process.StandardInput.Close()
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  if ($stdout) { Write-Host $stdout }
  if ($stderr) { Write-Host $stderr }
  if ($process.ExitCode -ne 0) {
    throw "sdkmanager falló con código $($process.ExitCode)"
  }
}

New-Item -ItemType Directory -Force -Path $latestDir | Out-Null

if (-not (Test-Path $sdkmanager)) {
  if (-not (Test-Path $zipPath)) {
    Write-Host 'Descargando command line tools...'
    New-Item -ItemType Directory -Force -Path (Split-Path $zipPath) | Out-Null
    curl.exe -L -o $zipPath 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip'
  }

  Expand-Archive -Path $zipPath -DestinationPath (Join-Path $sdkRoot 'cmdline-tools') -Force
  $nested = Join-Path $sdkRoot 'cmdline-tools\cmdline-tools'
  if (Test-Path $nested) {
    Get-ChildItem $nested | Move-Item -Destination $latestDir -Force
    Remove-Item $nested -Recurse -Force
  }
}

Write-Host 'Aceptando licencias SDK...'
Invoke-SdkManager @('--licenses')

Write-Host 'Instalando platform-tools, platform 36 y build-tools...'
Invoke-SdkManager @('platform-tools', 'platforms;android-36', 'build-tools;36.0.0')

Write-Host "Android SDK listo: $sdkRoot"
