param([switch]$NoBrowser)
$ErrorActionPreference='Stop'
. "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
 $data=if($env:ITFIELD_DATA_DIR){$env:ITFIELD_DATA_DIR}else{Join-Path $script:ITFieldRoot 'data'}
 New-Item -ItemType Directory -Path $data -Force | Out-Null
 $port=if($env:ITCAD_ANALYSIS_PORT){[int]$env:ITCAD_ANALYSIS_PORT}else{42875}
 $hash=[Security.Cryptography.SHA256]::Create();$storageInstance=([BitConverter]::ToString($hash.ComputeHash([Text.Encoding]::UTF8.GetBytes([IO.Path]::GetFullPath($data).ToLowerInvariant())))).Replace('-','').ToLowerInvariant().Substring(0,16);$hash.Dispose()
 $startLock=New-Object Threading.Mutex($false,('Local\ITCADAnalysisStart-'+$storageInstance));$ownsLock=$false
 try{$ownsLock=$startLock.WaitOne(0)}catch [Threading.AbandonedMutexException]{$ownsLock=$true}
 if(!$ownsLock){$startLock.Dispose();throw 'Analysis startup already in progress'}
 try{
 $ready=$false
 try{$h=Invoke-RestMethod ('http://127.0.0.1:'+$port+'/admin/health') -TimeoutSec 2;$ready=$h.service -eq 'itcad-analysis' -and $h.instance -eq $script:ITFieldInstance -and $h.dataInstance -eq $storageInstance}catch{}
 if(!$ready){
  if(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue){throw 'Analysis port occupied by another instance; no process replaced'}
  $p=Start-Process $script:ITFieldNode -ArgumentList @('server/analysis-server.mjs',('--itcad-instance='+$script:ITFieldInstance)) -WorkingDirectory $script:ITFieldRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $data 'analysis-server.log') -RedirectStandardError (Join-Path $data 'analysis-server-error.log')
  Set-Content -LiteralPath (Join-Path $data 'analysis.pid') -Value $p.Id -Encoding UTF8
  for($i=0;$i -lt 40;$i++){Start-Sleep -Milliseconds 250;try{$h=Invoke-RestMethod ('http://127.0.0.1:'+$port+'/admin/health') -TimeoutSec 2;if($h.service -eq 'itcad-analysis' -and $h.instance -eq $script:ITFieldInstance -and $h.dataInstance -eq $storageInstance){$ready=$true;break}}catch{}}
  if(!$ready){throw 'Analysis startup failed; inspect the private analysis logs'}
 }
 $token=(Get-Content (Join-Path $data 'analysis-token') -Raw -Encoding UTF8).Trim()
 if(!$NoBrowser){Start-Process ('http://127.0.0.1:'+$port+'/analysis/index.html#admin='+$token)}
 Write-Output 'Local analysis service ready. Administrator token kept private.'
 }finally{$startLock.ReleaseMutex();$startLock.Dispose()}
}
