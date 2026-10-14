$ErrorActionPreference='Stop'
if($PSVersionTable.PSEdition -eq 'Desktop'){$env:PSModulePath=(Join-Path $PSHOME 'Modules')+';'+$env:PSModulePath}
. "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
 Set-Location -LiteralPath $script:ITFieldRoot
 . ./scripts/runtime-process.ps1
 Stop-OwnedITFieldProcess -PidFile 'data/server.pid' -Executable $script:ITFieldNode -CommandPattern ('*--itfield-instance='+$script:ITFieldInstance+'*') -Label 'IT Field server'
 $stillRunning=$false
 try{$h=Invoke-RestMethod 'http://127.0.0.1:42873/api/health' -TimeoutSec 2;$stillRunning=($h.service -eq 'itfield-rayong')}catch{}
 if($stillRunning){throw 'IT Field server still answers health checks; shutdown not verified'}
}
