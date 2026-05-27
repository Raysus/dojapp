# QA API — prueba flujos con usuarios demo (stack Docker en :3000)
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000'
$failures = [System.Collections.Generic.List[string]]::new()

function Login($email) {
  $body = @{ email = $email; password = '123456' } | ConvertTo-Json
  $res = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body
  return $res.access_token
}

function Get-Auth($token, $path) {
  return Invoke-RestMethod -Uri "$base$path" -Headers @{ Authorization = "Bearer $token" }
}

function To-JsonBody($body) {
  if ($body -is [array]) {
    if ($body.Count -eq 0) { return '[]' }
    if ($body.Count -eq 1) {
      return '[' + ($body[0] | ConvertTo-Json -Depth 6 -Compress) + ']'
    }
    return ($body | ConvertTo-Json -Depth 6 -Compress)
  }
  return ($body | ConvertTo-Json -Depth 6 -Compress)
}

function Post-Auth($token, $path, $body = $null) {
  $params = @{
    Method = 'Post'
    Uri = "$base$path"
    Headers = @{ Authorization = "Bearer $token" }
    ContentType = 'application/json'
  }
  if ($null -ne $body) {
    $params.Body = To-JsonBody $body
  }
  return Invoke-RestMethod @params
}

function Assert-Ok {
  param([string]$Name, [scriptblock]$Block)
  try {
    & $Block
    Write-Host "OK $Name" -ForegroundColor Green
  } catch {
    Write-Host "FAIL $Name`: $($_.Exception.Message)" -ForegroundColor Red
    [void]$failures.Add($Name)
  }
}

Write-Host '=== Dojapp QA API ===' -ForegroundColor Cyan

$studentToken = $null
$senseiToken = $null
$adminToken = $null
$dojoId = $null
$contentId = $null

Assert-Ok 'health/db' {
  $db = Invoke-RestMethod -Uri "$base/health/db" -TimeoutSec 10
  if ($db.db -notmatch 'connected') { throw "DB no conectada: $($db | ConvertTo-Json -Compress)" }
}

Assert-Ok 'login demo users' {
  $script:studentToken = Login 'alumno@dojo.cl'
  $script:senseiToken = Login 'sensei@dojo.cl'
  $script:adminToken = Login 'admin@dojo.cl'
}

Assert-Ok 'student sees white-belt contents' {
  $contents = Get-Auth $studentToken '/students/me/contents'
  $count = ($contents | ForEach-Object { $_.contents.Count } | Measure-Object -Sum).Sum
  if ($count -lt 2) { throw "Esperados al menos 2 contenidos, recibidos $count" }
  $titles = $contents | ForEach-Object { $_.contents | ForEach-Object { $_.title } }
  if ($titles -contains 'Etiquette del Dojo') { throw 'No debe ver contenido de cinturón amarillo' }
}

Assert-Ok 'student stats' {
  $stats = Get-Auth $studentToken '/students/me/stats'
  if (-not $stats -or $stats.Count -lt 1) { throw 'Stats vacías' }
}

Assert-Ok 'professor dojos and students' {
  $dojos = Get-Auth $senseiToken '/dojos/mine'
  if ($dojos.Count -lt 1) { throw 'Sensei sin dojos' }
  $script:dojoId = $dojos[0].id
  $students = Get-Auth $senseiToken "/dojos/$($script:dojoId)/students"
  if ($students.Count -lt 1) { throw 'Dojo sin alumnos' }
}

Assert-Ok 'attendance list and save' {
  $attDate = (Get-Date).ToString('yyyy-MM-dd')
  $att = Get-Auth $senseiToken "/dojos/$dojoId/attendance?date=$attDate"
  if ($att.Count -lt 1) { throw 'Lista de asistencia vacía' }
  $payload = @($att | ForEach-Object { @{ userId = $_.userId; present = $true; date = $attDate } })
  Post-Auth $senseiToken "/dojos/$dojoId/attendance" $payload | Out-Null
}

Assert-Ok 'content viewer GET' {
  $studentContents = Get-Auth $studentToken '/students/me/contents'
  if ($studentContents.Count -lt 1 -or $studentContents[0].contents.Count -lt 1) {
    throw 'Alumno sin contenidos visibles'
  }
  $script:contentId = $studentContents[0].contents[0].id
  $script:dojoId = $studentContents[0].dojoId
  $detail = Get-Auth $studentToken "/dojos/$dojoId/contents/$contentId"
  if (-not $detail.title) { throw 'Detalle de contenido vacío' }
}

Assert-Ok 'student mark content complete' {
  Post-Auth $studentToken "/students/me/contents/$contentId/complete" @{} | Out-Null
  $stats = Get-Auth $studentToken '/students/me/stats'
  if ($stats[0].progress.completed -lt 1) { throw 'Progreso no actualizado tras completar' }
}

Assert-Ok 'admin stats and create content' {
  $stats = Get-Auth $adminToken '/admin/stats'
  if ($stats.users -lt 3) { throw 'Stats admin incompletas' }
  $dojos = Get-Auth $adminToken '/admin/dojos'
  $grades = Get-Auth $adminToken "/admin/dojos/$($dojos[0].id)/grades"
  $created = Post-Auth $adminToken "/admin/dojos/$($dojos[0].id)/contents" @{
    title = 'QA Docker Content'
    type = 'TEXT'
    body = 'Generado en QA automatizado'
    gradeId = $grades[0].id
  }
  if (-not $created.id) { throw 'Admin no pudo crear contenido' }
}

Assert-Ok 'dojo metrics' {
  $metrics = Get-Auth $senseiToken "/metrics/dojos/$dojoId/metrics"
  if ($null -eq $metrics) { throw 'Métricas vacías' }
}

Write-Host ''
if ($failures.Count -eq 0) {
  Write-Host '=== QA API completado sin fallos ===' -ForegroundColor Green
  exit 0
}

Write-Host "=== QA API falló en: $($failures -join ', ') ===" -ForegroundColor Red
exit 1
