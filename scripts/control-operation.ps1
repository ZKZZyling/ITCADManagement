param([ValidateSet('start','team','local','stop')][string]$Operation,[Parameter(Mandatory=$true)][string]$ResultFile)
$ErrorActionPreference='Stop'
if($PSVersionTable.PSEdition -eq 'Desktop'){$env:PSModulePath=(Join-Path $PSHOME 'Modules')+';'+$env:PSModulePath}
$appRoot=$script:ITFieldRoot
$resultPath=[IO.Path]::GetFullPath($ResultFile)
$dataRoot=[IO.Path]::GetFullPath((Join-Path $appRoot 'data'))+[IO.Path]::DirectorySeparatorChar
if(!$resultPath.StartsWith($dataRoot,[StringComparison]::OrdinalIgnoreCase)){throw 'Result path must remain in the application data directory'}
function Write-Result($success,$message){
 $result=[ordered]@{operation=$Operation;success=$success;message=$message;finishedAt=[DateTime]::UtcNow.ToString('o')}
 $tempPath=$resultPath+'.tmp'
 [IO.File]::WriteAllText($tempPath,($result|ConvertTo-Json -Compress),[Text.UTF8Encoding]::new($false))
 Move-Item -LiteralPath $tempPath -Destination $resultPath -Force
}
$lock=New-Object Threading.Mutex($false,'Local\ITFieldRayongOperation')
$acquired=$false
try{
 try{$acquired=$lock.WaitOne(0)}catch [Threading.AbandonedMutexException]{$acquired=$true}
 if(!$acquired){throw 'Another start/stop operation is already in progress'}
 . "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
  Set-Location -LiteralPath $appRoot
  switch($Operation){
   'start' {& ./scripts/start-cloud.ps1 -NoBrowser}
   'team' {& ./scripts/start-team.ps1 -NoBrowser}
   'local' {& ./scripts/start.ps1 -NoBrowser}
   'stop' {& ./scripts/stop-all.ps1}
  }
  Write-Result $true ($Operation+' completed and verified')
 }
}catch{
 if(Test-Path -LiteralPath $dataRoot){Write-Result $false $_.Exception.Message}
 Write-Error $_ -ErrorAction Continue
 exit 1
}finally{if($acquired){$lock.ReleaseMutex()};$lock.Dispose()}
# Keep the Windows parent alive after a successful tunnel start; GUI reads the result first.
if($Operation -eq 'start'){
 try{$cloudProcessId=[int](Get-Content -LiteralPath (Join-Path $appRoot 'data/cloud.pid') -Raw -Encoding UTF8);$p=Get-Process -Id $cloudProcessId -ErrorAction Stop;$p.WaitForExit();$p.Dispose()}catch{}
}
if($Operation -eq 'team'){try{$id=[int](Get-Content -LiteralPath (Join-Path $appRoot 'data/team.pid') -Raw -Encoding UTF8);. (Join-Path $appRoot 'scripts/watch-team.ps1');Watch-ITFieldTeamTunnel -ProcessId $id -AppRoot $appRoot}catch{}}
exit 0
