#!/usr/bin/env pwsh
# Deploy Codefather interview sync scripts to the production repo checkout and reload PM2.

[CmdletBinding()]
param(
  [string]$DeployHost = "root@47.253.230.197",
  [string]$RemoteRoot = "/opt/agent-build/current",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Invoke-Native([string]$File, [string[]]$Arguments) {
  if ($DryRun) {
    Write-Host "DRYRUN: $File $($Arguments -join ' ')" -ForegroundColor DarkGray
    return
  }

  & $File @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed (exit $LASTEXITCODE): $File $($Arguments -join ' ')"
  }
}

function Quote-BashValue([string]$Value) {
  if ($Value -match "'") {
    throw "Remote argument contains single quote: $Value"
  }
  return "'$Value'"
}

$files = @(
  "scripts/sync-codefather-interview-to-supabase.ts",
  "scripts/codefather-interview-cron.ts",
  "scripts/codefather-interview-ecosystem.config.cjs",
  "scripts/run-codefather-interview-cron.sh"
)

Write-Host "=== Codefather sync deploy ===" -ForegroundColor Cyan
Write-Host "  DeployHost  $DeployHost"
Write-Host "  RemoteRoot  $RemoteRoot"

foreach ($file in $files) {
  if (-not (Test-Path $file)) {
    throw "Missing local file: $file"
  }
}

$remoteScriptsDir = "${RemoteRoot}/scripts"
Invoke-Native "ssh" @("-o", "BatchMode=yes", $DeployHost, "mkdir -p $(Quote-BashValue $remoteScriptsDir)")

foreach ($file in $files) {
  Invoke-Native "scp" @("-o", "BatchMode=yes", $file, "${DeployHost}:${remoteScriptsDir}/")
}

$quotedRoot = Quote-BashValue $RemoteRoot
$reload = @(
  "set -e",
  "R=$quotedRoot",
  'cd "$R"',
  'chmod +x scripts/run-codefather-interview-cron.sh',
  'if pm2 describe codefather-interview-sync >/dev/null 2>&1; then pm2 delete codefather-interview-sync; fi',
  'pm2 start scripts/codefather-interview-ecosystem.config.cjs --only codefather-interview-sync',
  'pm2 save',
  'pm2 describe codefather-interview-sync | sed -n "1,80p"',
  'pid=$(pm2 pid codefather-interview-sync)',
  'echo "RUN_PID=${pid}"',
  'echo "RUN_CWD=$(readlink -f /proc/${pid}/cwd)"',
  'pm2 env $(pm2 describe codefather-interview-sync | awk "/script id/ {print \$4; exit}") | grep -E "CODEFATHER_INTERVIEW_(REPO_ROOT|CRON)" || true'
) -join '; '
Invoke-Native "ssh" @("-o", "BatchMode=yes", $DeployHost, $reload)

Write-Host "Done: codefather interview sync deployed" -ForegroundColor Green

