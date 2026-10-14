param([switch]$NoBrowser)
$ErrorActionPreference='Stop'
. "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
 $appRoot=$script:ITFieldRoot
 Set-Location -LiteralPath $appRoot
 if(!(Test-Path -LiteralPath 'public/field/assets/main.js')){throw 'Client build missing. Run setup/build before launch.'}
 $health='http://127.0.0.1:42873/api/health'
 $running=$false
 try{$h=Invoke-RestMethod -Uri $health -TimeoutSec 2; $running=(($h.service -eq 'itfield-rayong' -and $h.instance -eq $script:ITFieldInstance))}catch{}
 if(!$running){
  $occupied=Get-NetTCPConnection -State Listen -LocalPort 42873 -ErrorAction SilentlyContinue
  if($occupied){throw 'Port 42873 is occupied by another service. No process was stopped or replaced.'}
  New-Item -ItemType Directory -Path 'data' -Force | Out-Null
  $process=Start-Process -FilePath $script:ITFieldNode -ArgumentList @('server/local.mjs','--itfield-port=42873',('--itfield-instance='+$script:ITFieldInstance)) -WorkingDirectory $appRoot -WindowStyle Hidden -RedirectStandardOutput 'data/server.log' -RedirectStandardError 'data/server-error.log' -PassThru
  Set-Content -LiteralPath 'data/server.pid' -Value $process.Id -Encoding UTF8
  for($attempt=0;$attempt -lt 60;$attempt++){Start-Sleep -Milliseconds 500;try{$h=Invoke-RestMethod -Uri $health -TimeoutSec 2;if(($h.service -eq 'itfield-rayong' -and $h.instance -eq $script:ITFieldInstance)){$running=$true;break}}catch{}}
  if(!$running){throw 'Server failed readiness check. See data/server-error.log'}
 }
 $pairToken=(Get-Content -LiteralPath 'data/pair-token' -Raw -Encoding UTF8).Trim()
 $url='http://localhost:42873/field/index.html#pair='+$pairToken
 if(!$NoBrowser){Start-Process $url}
 Write-Output 'IT Field server ready: http://localhost:42873'
}
