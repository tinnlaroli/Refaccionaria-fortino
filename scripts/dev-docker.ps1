# Levanta el stack en modo desarrollo (Vite HMR + API con --watch)
param(
  [switch]$Build
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$args = @(
  "compose",
  "-f", "docker-compose.yml",
  "-f", "docker-compose.dev.yml",
  "up"
)

if ($Build) {
  $args += "--build"
}

Write-Host "Modo desarrollo — cambios en ux/, api/, landing/ se reflejan sin rebuild." -ForegroundColor Cyan
Write-Host "Gateway: http://localhost:8080/pos/app" -ForegroundColor Green

& docker @args
