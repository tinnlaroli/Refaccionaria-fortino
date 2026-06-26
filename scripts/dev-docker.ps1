# Levanta el stack en modo desarrollo (Vite HMR + API con --watch)
param(
  [switch]$Build
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$args = @("up")

if ($Build) {
  $args += "--build"
}

Write-Host "Modo desarrollo — override activo: cambios en ux/, api/, landing/ sin reiniciar." -ForegroundColor Cyan
Write-Host "Si cambiaste package.json: docker compose up --build" -ForegroundColor Yellow
Write-Host "Gateway: http://localhost:8080/pos/" -ForegroundColor Green

& docker compose up @args
