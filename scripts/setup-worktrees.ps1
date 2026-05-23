$ErrorActionPreference = "Stop"

$branches = @(
  @{ Name = "feat/api"; Path = "worktrees/api" },
  @{ Name = "feat/ux"; Path = "worktrees/pos" },
  @{ Name = "feat/landing"; Path = "worktrees/landing" },
  @{ Name = "feat/bd"; Path = "worktrees/db" }
)

Write-Host "Creando git worktrees dentro de Refaccionaria/worktrees/ ..."
Write-Host "Cada worktree es una copia completa del repo en su rama."
Write-Host ""

New-Item -ItemType Directory -Force -Path "worktrees" | Out-Null

foreach ($item in $branches) {
  $target = $item.Path
  if (Test-Path $target) {
    Write-Host "[skip] $target ya existe"
    continue
  }

  Write-Host "[add] $($item.Name) -> $target"
  git worktree add $target $item.Name
}

Write-Host ""
Write-Host "Worktrees listos. Edita cada modulo en su carpeta worktree:"
Write-Host "  worktrees/api/     -> feat/api"
Write-Host "  worktrees/pos/     -> feat/ux"
Write-Host "  worktrees/landing/ -> feat/landing"
Write-Host "  worktrees/db/      -> feat/bd"
Write-Host ""
Write-Host "Docker sigue en la raiz (main): npm run docker:up"
