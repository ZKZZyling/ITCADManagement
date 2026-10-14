param([switch]$NoBrowser)
$ErrorActionPreference='Stop'
. "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
 $root=$script:ITFieldRoot
 $args=@('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$root+'/scripts/start-team.ps1"'),'-KeepAlive');if($NoBrowser){$args+='-NoBrowser'}
 Start-Process 'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe' -ArgumentList $args -WindowStyle Hidden -RedirectStandardOutput ($root+'/data/team-launcher.log') -RedirectStandardError ($root+'/data/team-launcher-error.log')
}
