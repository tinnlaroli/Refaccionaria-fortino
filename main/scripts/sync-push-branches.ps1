# Sincroniza carpetas del monorepo local a cada rama y hace push.
# Uso: powershell -File main/scripts/sync-push-branches.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path "$root\.git")) { $root = "C:\Users\tinn\Documents\Dev\Refaccionaria" }

$wtBase = Join-Path $root "worktrees"
New-Item -ItemType Directory -Force -Path $wtBase | Out-Null

function Remove-Worktree($branch) {
  $name = ($branch -replace "[/\\]", "-")
  $path = Join-Path $wtBase $name
  if (Test-Path $path) {
    git -C $root worktree remove --force $path 2>$null
    if (Test-Path $path) { Remove-Item -Recurse -Force $path }
  }
  return $path
}

function Copy-Tree($from, $to) {
  if (-not (Test-Path $from)) { throw "No existe: $from" }
  New-Item -ItemType Directory -Force -Path $to | Out-Null
  robocopy $from $to /E /XD node_modules dist .git /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy fallo ($from -> $to) exit $LASTEXITCODE" }
}

function Push-Branch($branch, $message, $copyAction) {
  Write-Host "`n=== $branch ===" -ForegroundColor Cyan
  $wt = Remove-Worktree $branch
  git -C $root worktree add $wt $branch
  & $copyAction $wt
  git -C $wt add -A
  $status = git -C $wt status --porcelain
  if (-not $status) {
    Write-Host "Sin cambios en $branch" -ForegroundColor Yellow
    git -C $root worktree remove --force $wt
    return
  }
  git -C $wt commit -m $message
  git -C $wt push -u origin $branch
  git -C $root worktree remove --force $wt
  Write-Host "OK $branch" -ForegroundColor Green
}

Push-Branch "feat/bd" "feat(bd): migracion ventas, enums pago/estado y esquema ampliado" {
  param($wt)
  Copy-Tree (Join-Path $root "bd") $wt
}

Push-Branch "feat/api" "feat(api): ventas con pago, cancelacion, auditoria, corte de caja y sync" {
  param($wt)
  Copy-Tree (Join-Path $root "api") $wt
  Copy-Tree (Join-Path $root "bd") (Join-Path $wt "db")
}

Push-Branch "feat/ux" "feat(ux): panel admin, POS offline, pagos, inventario y sidebar colapsable" {
  param($wt)
  Copy-Tree (Join-Path $root "ux") $wt
}

Push-Branch "feat/landing" "chore(landing): export inicial del sitio publico" {
  param($wt)
  Copy-Tree (Join-Path $root "landing") $wt
}

Push-Branch "main" "chore(main): stack Docker unificado, gateway y documentacion de integracion" {
  param($wt)
  Copy-Tree (Join-Path $root "main") $wt
  Copy-Tree (Join-Path $root "docker") (Join-Path $wt "docker")
  Copy-Item (Join-Path $root "docker-compose.yml") (Join-Path $wt "docker-compose.yml") -Force
  Copy-Item (Join-Path $root ".gitignore") (Join-Path $wt ".gitignore") -Force
}

Write-Host "`nListo." -ForegroundColor Green
