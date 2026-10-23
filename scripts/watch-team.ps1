param([int]$WatchProcessId=0,[string]$WatchAppRoot='')

function Get-LatestITFieldTeamOrigin {
 param([string]$Text)
 # Match a complete provider hostname, never a prefix of a lookalike host or URL.
 $matches=[regex]::Matches($Text,'https://[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.lhr\.life(?=[/\s"''<>]|$)')
 if($matches.Count){return $matches[$matches.Count-1].Value}
 return $null
}
function Get-LoggedITFieldTeamOrigin {
 param([string]$AppRoot)
 # The provider writes announcements to stdout. Stderr is fallback only: concatenating
 # streams would incorrectly make an old stderr hostname newer than fresh stdout.
 foreach($name in @('team.log','team-error.log')){
  $path=Join-Path $AppRoot ('data/'+$name)
  if(Test-Path -LiteralPath $path){
   $origin=Get-LatestITFieldTeamOrigin (Get-Content -LiteralPath $path -Raw -Encoding UTF8)
   if($origin){return $origin}
  }
 }
 return $null
}
function Get-ITFieldTeamLink {
 param([string]$AppRoot,[string]$Origin,[string]$AccessMode='paired')
 # Only the verified server health decides effective access (including environment overrides).
 $url=$Origin+'/field/index.html'
 if($AccessMode -ceq 'open'){return $url}
 $token=(Get-Content -LiteralPath (Join-Path $AppRoot 'data/pair-token') -Raw -Encoding UTF8).Trim()
 return $url+'#pair='+$token
}
function Update-ITFieldTeamOrigin {
 param([string]$AppRoot)
 $statusFile=Join-Path $AppRoot 'data/team-status.json'
 try{
  $origin=Get-LoggedITFieldTeamOrigin $AppRoot
  if(!$origin){throw 'No verified-domain team URL received'}
  # The local server accepts only this exact registered public origin. Register
  # before health verification, including when an already-running SSH rotates it.
  [IO.File]::WriteAllText((Join-Path $AppRoot 'data/team-origin'),$origin,[Text.UTF8Encoding]::new($false))
  $health=Invoke-RestMethod ($origin+'/api/health') -TimeoutSec 5
  if($health.service -ne 'itfield-rayong'){throw 'Wrong public service'}
  $accessMode=if($health.accessMode -ceq 'open'){'open'}else{'paired'}
  $url=Get-ITFieldTeamLink -AppRoot $AppRoot -Origin $origin -AccessMode $accessMode
  $link=Join-Path $AppRoot 'data/field-cloud-link.url'
  $temporaryLink=$link+'.'+[Guid]::NewGuid().ToString('N')+'.tmp'
  [IO.File]::WriteAllText($temporaryLink,"[InternetShortcut]`r`nURL=$url`r`n",[Text.UTF8Encoding]::new($false))
  Move-Item -LiteralPath $temporaryLink -Destination $link -Force
  [IO.File]::WriteAllText($statusFile,(@{ready=$true;origin=$origin;accessMode=$accessMode;checkedAt=[DateTime]::UtcNow.ToString('o')}|ConvertTo-Json -Compress),[Text.UTF8Encoding]::new($false))
  return $origin
 }catch{
  [IO.File]::WriteAllText($statusFile,(@{ready=$false;error='Team URL verification pending';checkedAt=[DateTime]::UtcNow.ToString('o')}|ConvertTo-Json -Compress),[Text.UTF8Encoding]::new($false))
  throw
 }
}
function Watch-ITFieldTeamTunnel {
 param([int]$ProcessId,[string]$AppRoot,[int]$RefreshSeconds=30,[int]$PollSeconds=3,[string]$MutexName='Local\ITFieldRayongTeamWatcher')
 $mutex=New-Object Threading.Mutex($false,$MutexName);$acquired=$false
 try{$acquired=$mutex.WaitOne(0)}catch [Threading.AbandonedMutexException]{$acquired=$true}
 if(!$acquired){$mutex.Dispose();return}
 try{
  $lastOrigin='';$lastCheck=[DateTime]::MinValue
  while(Get-Process -Id $ProcessId -ErrorAction SilentlyContinue){
   try{
    $origin=Get-LoggedITFieldTeamOrigin $AppRoot
    # Retry failures, handle rotations promptly, and recheck unchanged links so a
    # formerly healthy tunnel cannot remain permanently marked ready.
    if($origin -ne $lastOrigin -or ([DateTime]::UtcNow-$lastCheck).TotalSeconds -ge $RefreshSeconds){
     $lastOrigin=Update-ITFieldTeamOrigin $AppRoot
     $lastCheck=[DateTime]::UtcNow
    }
   }catch{$lastCheck=[DateTime]::MinValue}
   Start-Sleep -Seconds $PollSeconds
  }
  [IO.File]::WriteAllText((Join-Path $AppRoot 'data/team-status.json'),(@{ready=$false;error='Team tunnel stopped';checkedAt=[DateTime]::UtcNow.ToString('o')}|ConvertTo-Json -Compress),[Text.UTF8Encoding]::new($false))
 }finally{$mutex.ReleaseMutex();$mutex.Dispose()}
}
if($WatchProcessId -gt 0 -and $WatchAppRoot){Watch-ITFieldTeamTunnel -ProcessId $WatchProcessId -AppRoot $WatchAppRoot}
