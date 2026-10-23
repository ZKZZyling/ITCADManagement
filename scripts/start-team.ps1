param([switch]$NoBrowser,[switch]$KeepAlive)
$ErrorActionPreference='Stop'
if($PSVersionTable.PSEdition -eq 'Desktop'){$env:PSModulePath=(Join-Path $PSHOME 'Modules')+';'+$env:PSModulePath}
. "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
 $root=$script:ITFieldRoot;Set-Location $root
 & ./scripts/start.ps1 -NoBrowser
 . ./scripts/runtime-process.ps1
 . ./scripts/watch-team.ps1
 $ssh='C:\Windows\System32\OpenSSH\ssh.exe';if(!(Test-Path $ssh)){throw 'Windows OpenSSH client missing'}
 $pattern='*-R 80:127.0.0.1:42873*nokey@localhost.run*';$pidFile='data/team.pid';$running=$false;$started=$false
 if(Test-Path $pidFile){$id=[int](Get-Content $pidFile -Raw);$owned=Get-CimInstance Win32_Process -Filter "ProcessId = $id";$running=$owned -and $owned.ExecutablePath -eq $ssh -and $owned.CommandLine -like $pattern;if($owned -and !$running){throw 'Saved team PID belongs to another process; refused to replace it'}}
 try{
  if(!$running){
   $config=Join-Path $root 'data/ssh-team-empty.conf';[IO.File]::WriteAllText($config,'',[Text.UTF8Encoding]::new($false))
   $args=@('-F',('"'+$config+'"'),'-o','BatchMode=yes','-o','StrictHostKeyChecking=accept-new','-o',('UserKnownHostsFile="'+$root+'/data/ssh-team-known-hosts"'),'-o','IdentityAgent=none','-o','IdentitiesOnly=yes','-o','ConnectTimeout=10','-o','ExitOnForwardFailure=yes','-o','ServerAliveInterval=30','-o','ServerAliveCountMax=3','-T','-R','80:127.0.0.1:42873','nokey@localhost.run','--','--inject-http-proxy-headers')
   $p=Start-Process $ssh -ArgumentList $args -WindowStyle Hidden -PassThru -RedirectStandardOutput 'data/team.log' -RedirectStandardError 'data/team-error.log';Set-Content $pidFile $p.Id -Encoding UTF8;$started=$true;$origin=$null
   for($i=0;$i -lt 90;$i++){Start-Sleep -Milliseconds 500;if($p.HasExited){throw 'Team tunnel exited; inspect data/team-error.log'};$origin=Get-LoggedITFieldTeamOrigin $root;if($origin){break}}
   if(!$origin){throw 'No verified-domain team URL received'}
  }
  $ready=$false
  for($i=0;$i -lt 15;$i++){
   # Read logs again on every attempt: the provider can rotate a hostname while
   # SSH remains alive and the preceding hostname is still failing DNS/health.
   try{$origin=Update-ITFieldTeamOrigin $root;$ready=$true;break}catch{}
   Start-Sleep -Seconds 1
  }
  if(!$ready){throw 'Team tunnel public health failed; local mode remains available'}
  $verifiedStatus=Get-Content data/team-status.json -Raw -Encoding UTF8 | ConvertFrom-Json
  $url=Get-ITFieldTeamLink -AppRoot $root -Origin $origin -AccessMode $verifiedStatus.accessMode
  Write-Output ('Team temporary tunnel ready: '+$origin+'; access link stored locally')
  if(!$NoBrowser){Start-Process $url}
  if($KeepAlive){Watch-ITFieldTeamTunnel -ProcessId ([int](Get-Content $pidFile -Raw)) -AppRoot $root}
  else{
   # Direct starts also keep rotation/health tracking alive after this command
   # exits. The watcher mutex ensures only one worker performs checks.
   $watcher=Join-Path $root 'scripts/watch-team.ps1'
   Start-Process ((Get-Process -Id $PID).Path) -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$watcher+'"'),'-WatchProcessId',([int](Get-Content $pidFile -Raw)),'-WatchAppRoot',('"'+$root+'"')) -WindowStyle Hidden | Out-Null
  }
 }catch{if($started){Stop-OwnedITFieldProcess -PidFile $pidFile -Executable $ssh -CommandPattern $pattern -Label 'Failed team startup'};throw}
}
