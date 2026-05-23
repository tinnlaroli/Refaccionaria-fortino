param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("api", "ux", "pos", "landing", "bd", "db", "main")]
  [string]$Module
)

$branchMap = @{
  api     = "feat/api"
  ux      = "feat/ux"
  pos     = "feat/ux"
  landing = "feat/landing"
  bd      = "feat/bd"
  db      = "feat/bd"
  main    = "main"
}

$folderMap = @{
  api     = "apps/api"
  ux      = "apps/pos"
  pos     = "apps/pos"
  landing = "apps/landing"
  bd      = "packages/db"
  db      = "packages/db"
  main    = "."
}

$branch = $branchMap[$Module]
$folder = $folderMap[$Module]

Write-Host "Cambiando a rama: $branch"
git checkout $branch

if ($LASTEXITCODE -ne 0) {
  Write-Error "No se pudo cambiar a la rama $branch"
  exit 1
}

Write-Host ""
Write-Host "Modulo: $Module"
Write-Host "Carpeta: $folder"
Write-Host "Rama:    $branch"
Write-Host ""
Write-Host "Para levantar todo el stack desde main:"
Write-Host "  git checkout main"
Write-Host "  npm run docker:up"
