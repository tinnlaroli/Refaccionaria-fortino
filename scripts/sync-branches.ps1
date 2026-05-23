$ErrorActionPreference = "Stop"

$current = git branch --show-current
if ($current -ne "main") {
  Write-Host "Cambiando a main antes de sincronizar..."
  git checkout main
}

$branches = @("feat/api", "feat/ux", "feat/landing", "feat/bd")

foreach ($branch in $branches) {
  Write-Host ""
  Write-Host "=== Merge main -> $branch ==="
  git checkout $branch
  git merge main -m "chore: sync $branch with main"
}

git checkout main
Write-Host ""
Write-Host "Ramas sincronizadas con main."
