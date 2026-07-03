#!/usr/bin/env pwsh
# Deploy Codefather interview sync scripts to a healthy production repo checkout and reload PM2.

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

function Invoke-NativeCapture([string]$File, [string[]]$Arguments) {
  if ($DryRun) {
    Write-Host "DRYRUN: $File $($Arguments -join ' ')" -ForegroundColor DarkGray
    return ""
  }

  $output = & $File @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    $rendered = ($output | ForEach-Object { $_.ToString() }) -join "`n"
    throw "Command failed (exit $LASTEXITCODE): $File $($Arguments -join ' ')`n$rendered"
  }

  return ($output | ForEach-Object { $_.ToString() }) -join "`n"
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
Write-Host "  DeployHost          $DeployHost"
Write-Host "  PreferredRemoteRoot $RemoteRoot"

foreach ($file in $files) {
  if (-not (Test-Path $file)) {
    throw "Missing local file: $file"
  }
}

if ($DryRun) {
  Write-Host "DRYRUN: remote preflight/deploy omitted after local file checks." -ForegroundColor DarkGray
  return
}

$quotedPreferredRoot = Quote-BashValue $RemoteRoot
$resolveScriptTemplate = @"
set -euo pipefail
preferred=__PREFERRED_ROOT__
resolve_path() {
  local path="`$1"
  if [ -e "`$path" ] || [ -L "`$path" ]; then
    readlink -f "`$path" 2>/dev/null || printf '%s\n' "`$path"
  else
    printf '%s\n' "`$path"
  fi
}
latest_env_file() {
  find /opt/agent-build/releases -mindepth 2 -maxdepth 2 -name .env -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n 1 | cut -d' ' -f2-
}
has_runtime() {
  local root="`$1"
  [ -f "`$root/package.json" ] && [ -d "`$root/scripts" ] && [ -d "`$root/node_modules" ]
}
preferred_resolved="`$(resolve_path "`$preferred")"
latest_env="`$(latest_env_file)"
reason="preferred"
selected="`$preferred_resolved"
if ! has_runtime "`$selected"; then
  reason="fallback"
  selected=""
  while IFS= read -r candidate; do
    [ -n "`$candidate" ] || continue
    if has_runtime "`$candidate"; then
      selected="`$candidate"
      break
    fi
  done < <(find /opt/agent-build/releases -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' 2>/dev/null | sort -nr | cut -d' ' -f2-)
fi
if [ -z "`$selected" ]; then
  echo "PREPARED_RUNTIME_ROOT="
  echo "PREFERRED_RESOLVED=`$preferred_resolved"
  echo "RESOLUTION_REASON=no-healthy-release"
  echo "LATEST_ENV_FILE=`$latest_env"
  exit 12
fi
if [ -z "`$latest_env" ]; then
  echo "PREPARED_RUNTIME_ROOT="
  echo "PREFERRED_RESOLVED=`$preferred_resolved"
  echo "RESOLUTION_REASON=missing-env"
  echo "LATEST_ENV_FILE="
  exit 13
fi
printf 'PREPARED_RUNTIME_ROOT=%s\n' "`$selected"
printf 'PREFERRED_RESOLVED=%s\n' "`$preferred_resolved"
printf 'RESOLUTION_REASON=%s\n' "`$reason"
printf 'LATEST_ENV_FILE=%s\n' "`$latest_env"
"@
$resolveScript = $resolveScriptTemplate.Replace('__PREFERRED_ROOT__', $quotedPreferredRoot)
$resolveBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($resolveScript -replace "`r`n", "`n")))

$resolveOutput = Invoke-NativeCapture "ssh" @("-o", "BatchMode=yes", $DeployHost, "printf %s $(Quote-BashValue $resolveBase64) | base64 -d | bash")
if ($resolveOutput) {
  Write-Host $resolveOutput
}

$preparedRoot = ([regex]::Match($resolveOutput, '(?m)^PREPARED_RUNTIME_ROOT=(.+)$')).Groups[1].Value.Trim()
if (-not $preparedRoot) {
  throw "Remote runtime preflight failed.`n$resolveOutput"
}

Write-Host "  PreparedRuntimeRoot $preparedRoot" -ForegroundColor Yellow

$remoteScriptsDir = "${preparedRoot}/scripts"
Invoke-Native "ssh" @("-o", "BatchMode=yes", $DeployHost, "mkdir -p $(Quote-BashValue $remoteScriptsDir)")

foreach ($file in $files) {
  Invoke-Native "scp" @("-o", "BatchMode=yes", $file, "${DeployHost}:${remoteScriptsDir}/")
}

$quotedPreparedRoot = Quote-BashValue $preparedRoot
$reload = @(
  "set -euo pipefail",
  "R=$quotedPreparedRoot",
  'cd "$R"',
  'chmod +x scripts/run-codefather-interview-cron.sh',
  'if pm2 describe codefather-interview-sync >/dev/null 2>&1; then pm2 delete codefather-interview-sync; fi',
  'pm2 start scripts/codefather-interview-ecosystem.config.cjs --only codefather-interview-sync',
  'pm2 save',
  'sleep 2',
  'pm2 describe codefather-interview-sync | sed -n "1,80p"',
  'pid=$(pm2 pid codefather-interview-sync)',
  'echo "RUN_PID=${pid}"',
  'echo "RUN_CWD=$(readlink -f /proc/${pid}/cwd)"',
  'tail -n 10 /var/log/agent-build/codefather-interview-sync.out.log || true',
  'tail -n 10 /var/log/agent-build/codefather-interview-sync.error.log || true'
) -join '; '
Invoke-Native "ssh" @("-o", "BatchMode=yes", $DeployHost, $reload)

Write-Host "Done: codefather interview sync deployed" -ForegroundColor Green

