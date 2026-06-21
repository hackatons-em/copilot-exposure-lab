// Copilot Exposure Lab — demo/dev Azure deployment.
// Scope: resource group (create the RG first, e.g. rg-cel-dev-euw).
// Cost-first: free/dev/burstable tiers, short log retention, budget alerts.
// No Kubernetes — Azure Container Apps (consumption) runs the three services.

targetScope = 'resourceGroup'

@description('Azure region.')
param location string = resourceGroup().location

@description('Short app prefix used in resource names.')
param namePrefix string = 'cel'

@description('Environment suffix (dev/demo).')
param env string = 'dev'

@description('PostgreSQL administrator login.')
param pgAdminLogin string = 'celadmin'

@secure()
@description('PostgreSQL administrator password.')
param pgAdminPassword string

@description('Container image refs (pushed to the ACR by deploy.ps1). Use a public placeholder until first push.')
param apiImage string = 'mcr.microsoft.com/k8se/quickstart:latest'
param webImage string = 'mcr.microsoft.com/k8se/quickstart:latest'
param workerImage string = 'mcr.microsoft.com/k8se/quickstart:latest'

@description('Monthly budget in USD. Alerts fire at 10/25/50/80 percent (= $100/$250/$500/$800 on $1000).')
param monthlyBudgetUsd int = 1000

@description('Email for budget alerts.')
param budgetAlertEmail string = 'teamwork@loveiq.org'

var suffix = uniqueString(resourceGroup().id)
var pgName = 'pg-${namePrefix}-${env}-${substring(suffix, 0, 6)}'
var pgDatabase = 'cel'
var databaseUrl = 'postgresql://${pgAdminLogin}:${pgAdminPassword}@${pgName}.postgres.database.azure.com:5432/${pgDatabase}?sslmode=require'

// ── Observability ──────────────────────────────────────────────
resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-${namePrefix}-${env}'
  location: location
  properties: {
    retentionInDays: 30
    sku: { name: 'PerGB2018' }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${namePrefix}-${env}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logs.id
  }
}

// ── Registry ───────────────────────────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: 'cr${namePrefix}${env}${substring(suffix, 0, 8)}'
  location: location
  sku: { name: 'Basic' }
  properties: { adminUserEnabled: true }
}

// ── Secrets vault ──────────────────────────────────────────────
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-${namePrefix}-${env}-${substring(suffix, 0, 6)}'
  location: location
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

// ── Blob storage (report artifacts) ────────────────────────────
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'st${namePrefix}${env}${substring(suffix, 0, 10)}'
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

resource reportsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  name: '${storage.name}/default/reports'
}

// ── PostgreSQL Flexible Server (cheapest burstable tier) ───────
resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: pgName
  location: location
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: {
    version: '16'
    administratorLogin: pgAdminLogin
    administratorLoginPassword: pgAdminPassword
    storage: { storageSizeGB: 32 }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
  }
}

resource pgDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: postgres
  name: pgDatabase
}

// Allow other Azure services (incl. Container Apps) to reach the DB.
resource pgFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2024-08-01' = {
  parent: postgres
  name: 'AllowAllAzureServices'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}

// ── Search (demo retrieval simulation) — free tier ─────────────
resource search 'Microsoft.Search/searchServices@2024-06-01-preview' = {
  name: 'srch-${namePrefix}-${env}-${substring(suffix, 0, 6)}'
  location: location
  sku: { name: 'free' }
  properties: { replicaCount: 1, partitionCount: 1 }
}

// ── Container Apps environment + services ──────────────────────
resource caEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'cae-${namePrefix}-${env}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

var acrServer = acr.properties.loginServer
var acrCreds = acr.listCredentials()

resource apiApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'app-${namePrefix}-api-${env}'
  location: location
  properties: {
    managedEnvironmentId: caEnv.id
    configuration: {
      ingress: { external: true, targetPort: 4000, transport: 'auto' }
      registries: [{ server: acrServer, username: acrCreds.username, passwordSecretRef: 'acr-pwd' }]
      secrets: [
        { name: 'acr-pwd', value: acrCreds.passwords[0].value }
        { name: 'database-url', value: databaseUrl }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: apiImage
          command: ['pnpm', '--filter', '@cel/api', 'start']
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'PORT', value: '4000' }
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'RUN_MIGRATIONS', value: 'true' }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
          ]
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 2 }
    }
  }
}

resource workerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'app-${namePrefix}-worker-${env}'
  location: location
  properties: {
    managedEnvironmentId: caEnv.id
    configuration: {
      registries: [{ server: acrServer, username: acrCreds.username, passwordSecretRef: 'acr-pwd' }]
      secrets: [
        { name: 'acr-pwd', value: acrCreds.passwords[0].value }
        { name: 'database-url', value: databaseUrl }
      ]
    }
    template: {
      containers: [
        {
          name: 'worker'
          image: workerImage
          command: ['pnpm', '--filter', '@cel/worker', 'start']
          resources: { cpu: json('0.25'), memory: '0.5Gi' }
          env: [
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'WORKER_POLL_MS', value: '5000' }
          ]
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 1 }
    }
  }
}

resource webApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'app-${namePrefix}-web-${env}'
  location: location
  properties: {
    managedEnvironmentId: caEnv.id
    configuration: {
      ingress: { external: true, targetPort: 3000, transport: 'auto' }
      registries: [{ server: acrServer, username: acrCreds.username, passwordSecretRef: 'acr-pwd' }]
      secrets: [{ name: 'acr-pwd', value: acrCreds.passwords[0].value }]
    }
    template: {
      containers: [
        {
          name: 'web'
          image: webImage
          resources: { cpu: json('0.5'), memory: '1Gi' }
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 2 }
    }
  }
}

// ── Budget + alerts at $100/$250/$500/$800 ─────────────────────
resource budget 'Microsoft.Consumption/budgets@2023-11-01' = {
  name: 'budget-${namePrefix}-${env}'
  properties: {
    category: 'Cost'
    amount: monthlyBudgetUsd
    timeGrain: 'Monthly'
    timePeriod: { startDate: '2026-06-01' }
    notifications: {
      alert10: { enabled: true, operator: 'GreaterThanOrEqualTo', threshold: 10, contactEmails: [budgetAlertEmail] }
      alert25: { enabled: true, operator: 'GreaterThanOrEqualTo', threshold: 25, contactEmails: [budgetAlertEmail] }
      alert50: { enabled: true, operator: 'GreaterThanOrEqualTo', threshold: 50, contactEmails: [budgetAlertEmail] }
      alert80: { enabled: true, operator: 'GreaterThanOrEqualTo', threshold: 80, contactEmails: [budgetAlertEmail] }
    }
  }
}

output acrLoginServer string = acrServer
output apiUrl string = 'https://${apiApp.properties.configuration.ingress.fqdn}'
output webUrl string = 'https://${webApp.properties.configuration.ingress.fqdn}'
output postgresFqdn string = '${pgName}.postgres.database.azure.com'
output keyVaultName string = keyVault.name
output storageAccount string = storage.name
