$ErrorActionPreference='Stop'
if($PSVersionTable.PSEdition -eq 'Desktop'){$env:PSModulePath=(Join-Path $PSHOME 'Modules')+';'+$env:PSModulePath}
. "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
 $appRoot=$script:ITFieldRoot;Set-Location -LiteralPath $appRoot
 . ./scripts/runtime-process.ps1
 Stop-OwnedITFieldProcess -PidFile 'data/cloud.pid' -Executable ([IO.Path]::GetFullPath((Join-Path $appRoot 'tools/cloudflared.exe'))) -CommandPattern '*--url http://127.0.0.1:42873*' -Label 'Cloudflare tunnel'
}
