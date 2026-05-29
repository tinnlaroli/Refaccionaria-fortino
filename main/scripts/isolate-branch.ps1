# Uso interno: reemplaza el arbol de trabajo con un modulo en la raiz.
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("api", "bd", "ux", "landing")]
  [string]$Module
)

$src = Join-Path $PSScriptRoot ".." ".split-modules" $Module
if (-not (Test-Path $src)) {
  Write-Error "No existe backup en $src"
  exit 1
}

Get-ChildItem -Force | Where-Object {
  $_.Name -notin @(".git", ".split-modules")
} | Remove-Item -Recurse -Force

Copy-Item -Recurse -Force "$src\*" .
Write-Host "Modulo $Module copiado a la raiz."
