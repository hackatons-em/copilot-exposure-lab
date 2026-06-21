<#
  Deploy Copilot Exposure Lab to Azure (demo/dev).
  Prereqs: `az login` already run, and an active subscription selected.
  Cloud-builds the container images with `az acr build` — no local Docker needed.

  Usage (from repo root):
    pwsh ./infra/azure/deploy.ps1 -PgAdminPassword (Read-Host -AsSecureString)
#>
param(
  [string]$ResourceGroup = "rg-cel-dev-euw",
  [string]$Location = "westeurope",
  [Parameter(Mandatory = $true)][securestring]$PgAdminPassword
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path "$PSScriptRoot/../.."
$pwPlain = [System.Net.NetworkCredential]::new("", $PgAdminPassword).Password

Write-Host "==> Creating resource group $ResourceGroup in $Location"
az group create --name $ResourceGroup --location $Location | Out-Null

Write-Host "==> Phase 1: deploy infra with placeholder images (provisions ACR, DB, apps)"
$deploy1 = az deployment group create `
  --resource-group $ResourceGroup `
  --template-file "$PSScriptRoot/main.bicep" `
  --parameters "$PSScriptRoot/main.parameters.json" `
  --parameters pgAdminPassword=$pwPlain `
  --query properties.outputs -o json | ConvertFrom-Json

$acr = $deploy1.acrLoginServer.value
$apiUrl = $deploy1.apiUrl.value
$acrName = $acr.Split(".")[0]
Write-Host "    ACR=$acr  API=$apiUrl"

Write-Host "==> Building images in ACR (cloud build)"
az acr build --registry $acrName --image cel-node:latest --file "$repoRoot/infra/docker/Dockerfile.node" $repoRoot | Out-Null
az acr build --registry $acrName --image cel-web:latest --file "$repoRoot/infra/docker/Dockerfile.web" `
  --build-arg NEXT_PUBLIC_API_URL=$apiUrl --build-arg NEXT_PUBLIC_WORKSPACE_ID=ws-demo $repoRoot | Out-Null

Write-Host "==> Phase 2: redeploy with the built images"
$deploy2 = az deployment group create `
  --resource-group $ResourceGroup `
  --template-file "$PSScriptRoot/main.bicep" `
  --parameters "$PSScriptRoot/main.parameters.json" `
  --parameters pgAdminPassword=$pwPlain `
  --parameters apiImage="$acr/cel-node:latest" workerImage="$acr/cel-node:latest" webImage="$acr/cel-web:latest" `
  --query properties.outputs -o json | ConvertFrom-Json

Write-Host ""
Write-Host "Done. The API self-migrates and seeds the demo on boot."
Write-Host "  Web : $($deploy2.webUrl.value)"
Write-Host "  API : $($deploy2.apiUrl.value)/health"
Write-Host ""
Write-Host "Budget alerts are set at 10/25/50/80% of \$1000 (= \$100/\$250/\$500/\$800)."
