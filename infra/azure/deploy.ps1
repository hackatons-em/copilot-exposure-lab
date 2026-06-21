<#
  Deploy Copilot Exposure Lab to Azure (demo/dev).
  Prereqs: `az login` already run, and an active subscription selected.
  Cloud-builds the container images with `az acr build` — no local Docker needed.

  Usage (from repo root):
    pwsh ./infra/azure/deploy.ps1 -PgAdminPassword (Read-Host -AsSecureString)
#>
param(
  # Sweden Central has reliable capacity; some popular regions (e.g. West Europe)
  # reject new customers on credit subscriptions ("not accepting new customers").
  [string]$ResourceGroup = "rg-cel-dev-swc",
  [string]$Location = "swedencentral",
  # ACR builds from this git source (no local context upload — avoids Windows
  # long-path errors in node_modules and is fully reproducible). Public repo.
  [string]$GitUrl = "https://github.com/hackatons-em/copilot-exposure-lab.git",
  [Parameter(Mandatory = $true)][securestring]$PgAdminPassword
)

# NOTE: do NOT use $ErrorActionPreference='Stop' here — Azure CLI writes
# warnings to stderr, which PowerShell would otherwise promote to a terminating
# error. We check $LASTEXITCODE explicitly after each az call instead.
$repoRoot = Resolve-Path "$PSScriptRoot/../.."
$pwPlain = [System.Net.NetworkCredential]::new("", $PgAdminPassword).Password

function Invoke-Step($Name, [scriptblock]$Block) {
  Write-Host "==> $Name"
  $result = & $Block
  if ($LASTEXITCODE -ne 0) { throw "step failed ($Name): az exit $LASTEXITCODE" }
  return $result
}

Invoke-Step "Creating resource group $ResourceGroup in $Location" {
  az group create --name $ResourceGroup --location $Location -o none
} | Out-Null

$out1 = Invoke-Step "Phase 1: deploy infra with placeholder images (ACR, DB, apps)" {
  az deployment group create `
    --resource-group $ResourceGroup `
    --template-file "$PSScriptRoot/main.bicep" `
    --parameters "$PSScriptRoot/main.parameters.json" `
    --parameters pgAdminPassword=$pwPlain `
    --query properties.outputs -o json --only-show-errors
}
$deploy1 = $out1 | ConvertFrom-Json
$acr = $deploy1.acrLoginServer.value
$apiUrl = $deploy1.apiUrl.value
$acrName = $acr.Split(".")[0]
Write-Host "    ACR=$acr  API=$apiUrl"

Invoke-Step "Building node image in ACR (from git)" {
  az acr build --registry $acrName --image cel-node:latest --file "infra/docker/Dockerfile.node" $GitUrl --only-show-errors -o none
} | Out-Null

Invoke-Step "Building web image in ACR (API URL baked in, from git)" {
  az acr build --registry $acrName --image cel-web:latest --file "infra/docker/Dockerfile.web" `
    --build-arg NEXT_PUBLIC_API_URL=$apiUrl --build-arg NEXT_PUBLIC_WORKSPACE_ID=ws-demo $GitUrl --only-show-errors -o none
} | Out-Null

$out2 = Invoke-Step "Phase 2: redeploy with the built images" {
  az deployment group create `
    --resource-group $ResourceGroup `
    --template-file "$PSScriptRoot/main.bicep" `
    --parameters "$PSScriptRoot/main.parameters.json" `
    --parameters pgAdminPassword=$pwPlain `
    --parameters apiImage="$acr/cel-node:latest" workerImage="$acr/cel-node:latest" webImage="$acr/cel-web:latest" `
    --query properties.outputs -o json --only-show-errors
}
$deploy2 = $out2 | ConvertFrom-Json

Write-Host ""
Write-Host "Done. The API self-migrates and seeds the demo on boot."
Write-Host "  Web : $($deploy2.webUrl.value)"
Write-Host "  API : $($deploy2.apiUrl.value)/health"
Write-Host ""
Write-Host "Budget alerts are set at 10/25/50/80% of 1000 USD (= 100/250/500/800)."
