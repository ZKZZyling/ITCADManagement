param([switch]$NoBrowser)
$ErrorActionPreference='Stop'
$script=Join-Path $PSScriptRoot 'start-cloud.ps1'
. "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
 $appRoot=$script:ITFieldRoot;Set-Location -LiteralPath $appRoot
 $argsList=@('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$script+'"'),'-KeepAlive');if($NoBrowser){$argsList+='-NoBrowser'}
 Start-Process -FilePath 'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe' -ArgumentList $argsList -WindowStyle Hidden -RedirectStandardOutput (Join-Path $appRoot 'data/cloud-launcher.log') -RedirectStandardError (Join-Path $appRoot 'data/cloud-launcher-error.log')
}
