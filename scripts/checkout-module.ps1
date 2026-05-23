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

$branch = $branchMap[$Module]

Write-Host "Cambiando a rama: $branch"
git checkout $branch

if ($LASTEXITCODE -ne 0) {
  Write-Error "No se pudo cambiar a la rama $branch"
  exit 1
}

Write-Host ""
Write-Host "Rama activa: $branch"
Write-Host "En esta rama el codigo del modulo esta en la raiz del repo (no en apps/)."
Write-Host "Ejecuta npm install y los scripts de esa rama desde aqui."
Write-Host ""
