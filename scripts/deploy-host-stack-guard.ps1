#!/usr/bin/env pwsh
# Stage and install the host health guard without relying on a thin site release.

[CmdletBinding()]
param(
  [string]$DeployHost = "root@47.253.230.197",
  [string]$RemoteStageDirectory = "/tmp/agent-build-stack-guard",
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

$localDirectory = "deploy/host-guard"
$assets = @(
  "agent-build-stack-guard.sh",
  "agent-build-stack-guard.service",
  "agent-build-stack-guard.timer",
  "install.sh"
)

foreach ($asset in $assets) {
  $path = Join-Path $localDirectory $asset
  if (-not (Test-Path $path -PathType Leaf)) {
    throw "Missing local guard asset: $path"
  }
}

if ($DryRun) {
  Write-Host "Dry run completed: local guard assets validated" -ForegroundColor Green
  return
}

$quotedStageDirectory = Quote-BashValue $RemoteStageDirectory
$quotedInstallPath = Quote-BashValue "${RemoteStageDirectory}/install.sh"
Invoke-Native "ssh" @("-o", "BatchMode=yes", $DeployHost, "mkdir -p $quotedStageDirectory")

foreach ($asset in $assets) {
  Invoke-Native "scp" @("-o", "BatchMode=yes", (Join-Path $localDirectory $asset), "${DeployHost}:${RemoteStageDirectory}/$asset")
}

Invoke-Native "ssh" @("-o", "BatchMode=yes", $DeployHost, "bash $quotedInstallPath")
Invoke-Native "ssh" @("-o", "BatchMode=yes", $DeployHost, "systemctl is-enabled agent-build-stack-guard.timer; systemctl is-active agent-build-stack-guard.timer; systemctl show --property=Result --value agent-build-stack-guard.service | grep -qx success")

Write-Host "Done: host stack guard installed and verified" -ForegroundColor Green
