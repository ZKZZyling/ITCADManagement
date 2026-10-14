param([switch]$NoBrowser,[switch]$KeepAlive)
$ErrorActionPreference='Stop'
if($PSVersionTable.PSEdition -eq 'Desktop'){$env:PSModulePath=(Join-Path $PSHOME 'Modules')+';'+$env:PSModulePath}
. "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
 $root=$script:ITFieldRoot;Set-Location $root
 & ./scripts/start.ps1 -NoBrowser
 . ./scripts/runtime-process.ps1
 $ssh='C:\Windows\System32\OpenSSH\ssh.exe';if(!(Test-Path $ssh)){throw 'Windows OpenSSH client missing'}
 $pattern='*-R 80:127.0.0.1:42873*nokey@localhost.run*';$pidFile='data/team.pid';$originFile='data/team-origin';$running=$false;$started=$false
 if(Test-Path $pidFile){$id=[int](Get-Content $pidFile -Raw);$owned=Get-CimInstance Win32_Process -Filter "ProcessId = $id";$running=$owned -and $owned.ExecutablePath -eq $ssh -and $owned.CommandLine -like $pattern;if($owned -and !$running){throw 'Saved team PID belongs to another process; refused to replace it'}}
 try{
  if(!$running){
   $config=Join-Path $root 'data/ssh-team-empty.conf';[IO.File]::WriteAllText($config,'',[Text.UTF8Encoding]::new($false))
   $args=@('-F',('"'+$config+'"'),'-o','BatchMode=yes','-o','StrictHostKeyChecking=accept-new','-o',('UserKnownHostsFile="'+$root+'/data/ssh-team-known-hosts"'),'-o','IdentityAgent=none','-o','IdentitiesOnly=yes','-o','ConnectTimeout=10','-o','ExitOnForwardFailure=yes','-o','ServerAliveInterval=30','-o','ServerAliveCountMax=3','-T','-R','80:127.0.0.1:42873','nokey@localhost.run','--','--inject-http-proxy-headers')
   $p=Start-Process $ssh -ArgumentList $args -WindowStyle Hidden -PassThru -RedirectStandardOutput 'data/team.log' -RedirectStandardError 'data/team-error.log';Set-Content $pidFile $p.Id -Encoding UTF8;$started=$true;$origin=$null
   for($i=0;$i -lt 90;$i++){Start-Sleep -Milliseconds 500;if($p.HasExited){throw 'Team tunnel exited; inspect data/team-error.log'};$text=(Get-Content data/team.log,data/team-error.log -Raw -ErrorAction SilentlyContinue)-join "`n";$match=[regex]::Match($text,'https://[a-z0-9-]+\.lhr\.life');if($match.Success){$origin=$match.Value;break}}
   if(!$origin){throw 'No verified-domain team URL received'};Set-Content $originFile $origin -Encoding UTF8
  }else{$origin=(Get-Content $originFile -Raw).Trim()}
  if($origin -notmatch '^https://[a-z0-9-]+\.lhr\.life$'){throw 'Invalid team origin'}
  $ready=$false;for($i=0;$i -lt 15;$i++){try{$h=Invoke-RestMethod ($origin+'/api/health') -TimeoutSec 5;if($h.service -eq 'itfield-rayong'){$ready=$true;break}}catch{};Start-Sleep -Seconds 1}
  if(!$ready){throw 'Team tunnel public health failed'}
  $token=(Get-Content data/pair-token -Raw).Trim();$url=$origin+'/field/index.html#pair='+$token
  [IO.File]::WriteAllText((Join-Path $root 'data/field-cloud-link.url'),"[InternetShortcut]`r`nURL=$url`r`n",[Text.UTF8Encoding]::new($false))
  Write-Output ('Team temporary tunnel ready: '+$origin+'; paired link stored locally')
  if(!$NoBrowser){Start-Process $url};if($KeepAlive){. ./scripts/watch-team.ps1;Watch-ITFieldTeamTunnel -ProcessId ([int](Get-Content $pidFile -Raw)) -AppRoot $root}
 }catch{if($started){Stop-OwnedITFieldProcess -PidFile $pidFile -Executable $ssh -CommandPattern $pattern -Label 'Failed team startup'};throw}
}
