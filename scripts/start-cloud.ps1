param([switch]$NoBrowser,[switch]$KeepAlive)
$ErrorActionPreference='Stop'
if($PSVersionTable.PSEdition -eq 'Desktop'){$env:PSModulePath=(Join-Path $PSHOME 'Modules')+';'+$env:PSModulePath}
. "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
 $appRoot=$script:ITFieldRoot;Set-Location -LiteralPath $appRoot
 & ./scripts/start.ps1 -NoBrowser
 $binary=Join-Path $appRoot 'tools/cloudflared.exe'
 if(!(Test-Path -LiteralPath $binary)){throw 'Cloudflared missing: install the signed official Cloudflare Windows binary in tools/cloudflared.exe'}
 $binary=(Get-Item -LiteralPath $binary).FullName
 $signature=Get-AuthenticodeSignature -LiteralPath $binary
 if($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Cloudflare'){throw 'Cloudflare executable signature is not valid'}
 $originFile=Join-Path $appRoot 'data/cloud-origin';$pidFile=Join-Path $appRoot 'data/cloud.pid';$running=$false
 . ./scripts/runtime-process.ps1
 $startedTunnel=$false
 try {
 if(Test-Path -LiteralPath $pidFile){$cloudPid=[int](Get-Content -LiteralPath $pidFile -Raw -Encoding UTF8);$owned=Get-CimInstance Win32_Process -Filter "ProcessId = $cloudPid" -ErrorAction SilentlyContinue;$running=($owned -and $owned.ExecutablePath -eq $binary -and $owned.CommandLine -like '*--url http://127.0.0.1:42873*')}
 if(!$running){
  # Use only this application's configuration; never inherit a company tunnel profile.
  $config=Join-Path $appRoot 'data/cloud-isolated.yml'
  [IO.File]::WriteAllText($config,"{} `n",[Text.UTF8Encoding]::new($false))
  $log=Join-Path $appRoot 'data/cloud.log';$err=Join-Path $appRoot 'data/cloud-error.log'
  $process=Start-Process -FilePath $binary -ArgumentList @('--no-autoupdate','tunnel','--config',('"'+$config+'"'),'--metrics','127.0.0.1:0','--url','http://127.0.0.1:42873','--protocol','http2') -WorkingDirectory $appRoot -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $err -PassThru
  Set-Content -LiteralPath $pidFile -Value $process.Id -Encoding UTF8
  $startedTunnel=$true
  $origin=$null
  for($i=0;$i -lt 60;$i++){Start-Sleep -Milliseconds 500;if($process.HasExited){throw 'Cloudflare exited; inspect data/cloud-error.log'};if(Test-Path -LiteralPath $err){$text=Get-Content -LiteralPath $err -Raw -Encoding UTF8;$match=[regex]::Match($text,'https://[a-z0-9-]+\.trycloudflare\.com');if($match.Success){$origin=$match.Value;break}}}
  if(!$origin){throw 'No tunnel URL returned; inspect data/cloud-error.log'}
  Set-Content -LiteralPath $originFile -Value $origin -Encoding UTF8
 }else{$origin=(Get-Content -LiteralPath $originFile -Raw -Encoding UTF8).Trim()}
 if($origin -notmatch '^https://[a-z0-9-]+\.trycloudflare\.com$'){throw 'Invalid Cloudflare origin'}
 $ready=$false
 for($i=0;$i -lt 60;$i++){
  $liveId=[int](Get-Content -LiteralPath $pidFile -Raw -Encoding UTF8)
  if(!(Get-Process -Id $liveId -ErrorAction SilentlyContinue)){throw 'Tunnel stopped before public readiness'}
  try{$health=Invoke-RestMethod ($origin+'/api/health') -TimeoutSec 5;if($health.service -eq 'itfield-rayong'){$ready=$true;break}}catch{}
  if($i -eq 10){
   try{$null=Resolve-DnsName -Name ([Uri]$origin).Host -DnsOnly -ErrorAction Stop}
   catch{throw 'Public tunnel hostname cannot be resolved by current DNS. Local mode is available; do not change company DNS or VPN automatically.'}
  }
  Start-Sleep -Seconds 2
 }
 if(!$ready){throw 'Tunnel origin was issued but public health check failed'}
 $pair=(Get-Content -LiteralPath 'data/pair-token' -Raw -Encoding UTF8).Trim();$url=$origin+'/field/index.html#pair='+$pair
 [IO.File]::WriteAllText((Join-Path $appRoot 'data/field-cloud-link.url'),"[InternetShortcut]`r`nURL=$url`r`n",[Text.UTF8Encoding]::new($false))
 if(!$NoBrowser){Start-Process $url}
 Write-Output ('Cloudflare temporary tunnel ready: '+$origin+'; paired link is stored locally in data/field-cloud-link.url')
 if($KeepAlive){$cloudPid=[int](Get-Content -LiteralPath $pidFile -Raw -Encoding UTF8);Wait-Process -Id $cloudPid}
 } catch {
  if($startedTunnel){Stop-OwnedITFieldProcess -PidFile $pidFile -Executable $binary -CommandPattern '*--url http://127.0.0.1:42873*' -Label 'Failed startup tunnel'}
  throw
 }
}
