#!/usr/bin/env pwsh
# Container deploy for the agent-build slice of the multi-cloud stack.
# This script does not provision cloud resources. It needs SSH, Docker, and Docker Compose on the target host.

[CmdletBinding()]
param(
  [ValidateSet("aliyun", "volcengine", "tencent", "custom")]
  [string]$Provider = "aliyun",

  [switch]$DryRun,
  [switch]$SkipTests,
  [switch]$SkipBuild,
  [switch]$UseRegistry,
  [switch]$SkipPush,
  [switch]$SkipRemoteUp,
  [switch]$EnableJobs,
  [switch]$EnableNotion,
  [switch]$KeepArchive,

  [string]$DeployHost,
  [string]$Domain,
  [string]$BasePath,
  [string]$ImageRepository,
  [string]$ImageTag,
  [string]$RemoteStackDir = "/opt/agent-build-container",
  [string]$RuntimeEnvFile,
  [string]$ComposeFile = "deploy/compose/agent-build.compose.yml",

  [int]$SitePort = 8088,

  [ValidateSet("https", "http")]
  [string]$VerifyScheme = "https"
)

$ErrorActionPreference = "Stop"
$script:DryRunEnabled = [bool]$DryRun

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Step([string]$Message) {
  Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Read-Env([string]$Name) {
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) { return $null }
  return $value
}

function First-Value([object[]]$Values) {
  foreach ($value in $Values) {
    if ($null -ne $value -and -not [string]::IsNullOrWhiteSpace([string]$value)) {
      return [string]$value
    }
  }
  return $null
}

function Normalize-BasePath([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) { return "/" }
  $normalized = $Value.Trim()
  if (-not $normalized.StartsWith("/")) { $normalized = "/$normalized" }
  if (-not $normalized.EndsWith("/")) { $normalized = "$normalized/" }
  return $normalized
}

function Quote-BashValue([string]$Value) {
  if ($Value -match "'") {
    throw "Remote argument contains a single quote and cannot be safely embedded in bash: $Value"
  }
  return "'$Value'"
}

function Invoke-Native([string]$File, [string[]]$Arguments) {
  if ($script:DryRunEnabled) {
    Write-Host "DRYRUN: $File $($Arguments -join ' ')" -ForegroundColor DarkGray
    return
  }

  & $File @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed (exit $LASTEXITCODE): $File $($Arguments -join ' ')"
  }
}

function Invoke-Capture([string]$File, [string[]]$Arguments, [string]$Fallback) {
  try {
    $output = & $File @Arguments
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace([string]$output)) {
      return ([string]$output).Trim()
    }
  } catch {
    return $Fallback
  }
  return $Fallback
}

function Write-ConfigLine([string]$Label, [string]$Value) {
  Write-Host ("  {0,-22} {1}" -f $Label, $Value)
}

$providerProfiles = @{
  aliyun = @{
    Label = "Aliyun ECS"
    DeployHost = "root@47.253.230.197"
    Domain = "songuu.top"
    BasePath = "/agent-build/"
  }
  volcengine = @{
    Label = "Volcengine ECS"
    DeployHost = Read-Env "AGENT_BUILD_VOLCENGINE_HOST"
    Domain = First-Value @((Read-Env "AGENT_BUILD_VOLCENGINE_DOMAIN"), "songuu.top")
    BasePath = First-Value @((Read-Env "AGENT_BUILD_VOLCENGINE_BASE_PATH"), "/agent-build/")
  }
  tencent = @{
    Label = "Tencent Cloud CVM"
    DeployHost = Read-Env "AGENT_BUILD_TENCENT_HOST"
    Domain = First-Value @((Read-Env "AGENT_BUILD_TENCENT_DOMAIN"), "songuu.top")
    BasePath = First-Value @((Read-Env "AGENT_BUILD_TENCENT_BASE_PATH"), "/agent-build/")
  }
  custom = @{
    Label = "Custom Linux host"
    DeployHost = Read-Env "AGENT_BUILD_DEPLOY_HOST"
    Domain = First-Value @((Read-Env "AGENT_BUILD_DOMAIN"), "songuu.top")
    BasePath = First-Value @((Read-Env "AGENT_BUILD_BASE_PATH"), "/agent-build/")
  }
}

$profile = $providerProfiles[$Provider]
$providerEnvPrefix = "AGENT_BUILD_$($Provider.ToUpperInvariant())"
$resolvedHost = First-Value @($DeployHost, $profile.DeployHost)
$resolvedDomain = First-Value @($Domain, $profile.Domain)
$resolvedBasePath = Normalize-BasePath (First-Value @($BasePath, $profile.BasePath))

if ([string]::IsNullOrWhiteSpace($resolvedHost)) {
  throw "Deploy host is missing. Pass -DeployHost root@x.x.x.x or set $providerEnvPrefix`_HOST."
}
if ([string]::IsNullOrWhiteSpace($resolvedDomain)) {
  throw "Domain is missing. Pass -Domain example.com or set the provider Domain env var."
}
if (-not (Test-Path -LiteralPath $ComposeFile)) {
  throw "Missing compose file: $ComposeFile"
}

if ([string]::IsNullOrWhiteSpace($ImageTag)) {
  $ImageTag = Invoke-Capture "git" @("rev-parse", "--short", "HEAD") (Get-Date -Format "yyyyMMddHHmmss")
}

if (-not [string]::IsNullOrWhiteSpace($ImageRepository)) {
  $imagePrefix = $ImageRepository.TrimEnd("/")
  $siteImage = "${imagePrefix}-site:${ImageTag}"
  $runtimeImage = "${imagePrefix}-runtime:${ImageTag}"
} else {
  $siteImage = "agent-build-site:${ImageTag}"
  $runtimeImage = "agent-build-runtime:${ImageTag}"
}

$allowedOrigins = "${VerifyScheme}://$resolvedDomain"

Step "Container deploy config"
Write-ConfigLine "Provider" "$Provider ($($profile.Label))"
Write-ConfigLine "DeployHost" $resolvedHost
Write-ConfigLine "Domain" $resolvedDomain
Write-ConfigLine "BasePath" $resolvedBasePath
Write-ConfigLine "SitePort" ([string]$SitePort)
Write-ConfigLine "SiteImage" $siteImage
Write-ConfigLine "RuntimeImage" $runtimeImage
Write-ConfigLine "RemoteStackDir" $RemoteStackDir
Write-ConfigLine "UseRegistry" ([string][bool]$UseRegistry)
Write-ConfigLine "EnableJobs" ([string][bool]$EnableJobs)
Write-ConfigLine "EnableNotion" ([string][bool]$EnableNotion)

if (-not $SkipTests) {
  Step "Gates: typecheck + site + worker tests"
  Invoke-Native "pnpm" @("typecheck")
  Invoke-Native "npx" @("tsx", "knowledge-graph/data/visuals.test.mts")
  Invoke-Native "npx" @("tsx", "knowledge-graph/generate.test.mts")
  Invoke-Native "npx" @("tsx", ".vitepress/theme/diagram-zoom.test.mts")
  Invoke-Native "npx" @("tsx", ".vitepress/theme/reduced-motion.test.mts")
  Invoke-Native "pnpm" @("news:test")
  Invoke-Native "pnpm" @("notion:test")
} else {
  Write-Host "Skipping gates (-SkipTests)" -ForegroundColor Yellow
}

if (-not $SkipBuild) {
  Step "Docker build"
  Invoke-Native "docker" @(
    "build",
    "--target", "site",
    "--build-arg", "VITEPRESS_BASE=$resolvedBasePath",
    "--build-arg", "DEMO_RUNNER_CLIENT_ENABLED=1",
    "--build-arg", "DEMO_RUNNER_BASE_URL=$($resolvedBasePath.TrimEnd('/'))/api/demo-runner",
    "-t", $siteImage,
    "."
  )
  Invoke-Native "docker" @(
    "build",
    "--target", "app-runtime",
    "-t", $runtimeImage,
    "."
  )
} else {
  Write-Host "Skipping docker build (-SkipBuild)" -ForegroundColor Yellow
}

if ($UseRegistry) {
  if ([string]::IsNullOrWhiteSpace($ImageRepository)) {
    throw "-UseRegistry requires -ImageRepository, for example registry.example.com/ns/agent-build"
  }
  if (-not $SkipPush) {
    Step "Docker push"
    Invoke-Native "docker" @("push", $siteImage)
    Invoke-Native "docker" @("push", $runtimeImage)
  }
}

Step "Prepare compose payload"
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "agent-build-container-$ImageTag"
if (-not $DryRun) {
  Remove-Item -Recurse -Force $tempRoot -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
}

$composePayload = Join-Path $tempRoot "compose.yml"
$composeEnvPayload = Join-Path $tempRoot ".env"
$runtimeEnvPayload = Join-Path $tempRoot "agent-build.runtime.env"
$imageArchive = Join-Path $tempRoot "agent-build-images-$ImageTag.tar"

if (-not $DryRun) {
  Copy-Item -LiteralPath $ComposeFile -Destination $composePayload
  @(
    "AGENT_BUILD_SITE_IMAGE=$siteImage",
    "AGENT_BUILD_RUNTIME_IMAGE=$runtimeImage",
    "AGENT_BUILD_SITE_PORT=$SitePort",
    "AGENT_BUILD_BASE_PATH=$resolvedBasePath",
    "AGENT_BUILD_DOMAIN=$resolvedDomain",
    "AGENT_BUILD_ALLOWED_ORIGINS=$allowedOrigins"
  ) | Set-Content -Encoding UTF8 -LiteralPath $composeEnvPayload

  $runtimeLines = @(
    "NODE_ENV=production",
    "DEMO_RUNNER_PORT=5174",
    "DEMO_RUNNER_ALLOWED_HOSTS=$resolvedDomain",
    "DEMO_RUNNER_ALLOWED_ORIGINS=$allowedOrigins",
    "DEMO_RUNNER_ALLOW_MISSING_ORIGIN=1",
    "DEMO_RUNNER_REQUIRE_TOKEN=0"
  )
  if (-not [string]::IsNullOrWhiteSpace($RuntimeEnvFile)) {
    if (-not (Test-Path -LiteralPath $RuntimeEnvFile)) {
      throw "Runtime env file does not exist: $RuntimeEnvFile"
    }
    $runtimeLines += ""
    $runtimeLines += "# Imported from $RuntimeEnvFile at deploy time."
    $runtimeLines += Get-Content -LiteralPath $RuntimeEnvFile
  }
  $runtimeLines | Set-Content -Encoding UTF8 -LiteralPath $runtimeEnvPayload
} else {
  Write-Host "DRYRUN: would create compose payload in $tempRoot" -ForegroundColor DarkGray
}

Step "Remote compose sync"
$quotedRemoteStackDir = Quote-BashValue $RemoteStackDir
Invoke-Native "ssh" @("-o", "BatchMode=yes", $resolvedHost, "mkdir -p $quotedRemoteStackDir")
Invoke-Native "scp" @("-o", "BatchMode=yes", $composePayload, "${resolvedHost}:$RemoteStackDir/compose.yml")
Invoke-Native "scp" @("-o", "BatchMode=yes", $composeEnvPayload, "${resolvedHost}:$RemoteStackDir/.env")
Invoke-Native "scp" @("-o", "BatchMode=yes", $runtimeEnvPayload, "${resolvedHost}:$RemoteStackDir/agent-build.runtime.env")

if (-not $UseRegistry) {
  Step "Image transfer over SSH"
  Invoke-Native "docker" @("save", "-o", $imageArchive, $siteImage, $runtimeImage)
  Invoke-Native "scp" @("-o", "BatchMode=yes", $imageArchive, "${resolvedHost}:$RemoteStackDir/agent-build-images-$ImageTag.tar")
  Invoke-Native "ssh" @("-o", "BatchMode=yes", $resolvedHost, "cd $quotedRemoteStackDir && docker load -i agent-build-images-$ImageTag.tar && rm -f agent-build-images-$ImageTag.tar")
}

$profileArgs = @()
if ($EnableJobs) {
  $profileArgs += "--profile jobs"
}
if ($EnableNotion) {
  $profileArgs += "--profile notion"
}
$profileArgText = ($profileArgs -join " ")

if (-not $SkipRemoteUp) {
  Step "Remote docker compose up"
  if ($UseRegistry) {
    Invoke-Native "ssh" @("-o", "BatchMode=yes", $resolvedHost, "cd $quotedRemoteStackDir && docker compose --env-file .env -f compose.yml $profileArgText pull")
  }
  Invoke-Native "ssh" @("-o", "BatchMode=yes", $resolvedHost, "cd $quotedRemoteStackDir && docker compose --env-file .env -f compose.yml $profileArgText up -d")
  Invoke-Native "ssh" @("-o", "BatchMode=yes", $resolvedHost, "curl -fsS http://127.0.0.1:$SitePort/healthz")
} else {
  Write-Host "Skipping remote compose up (-SkipRemoteUp)" -ForegroundColor Yellow
}

if (-not $KeepArchive -and -not $DryRun) {
  Remove-Item -Recurse -Force $tempRoot -ErrorAction SilentlyContinue
}

Step "Container deploy complete"
Write-Host "Container site: http://127.0.0.1:$SitePort$resolvedBasePath on $resolvedHost" -ForegroundColor Green
Write-Host "Host Nginx cutover is separate. See deploy/MULTI_CLOUD_CONTAINER_DEPLOYMENT.md." -ForegroundColor Green
