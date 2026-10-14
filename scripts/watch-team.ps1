function Get-LatestITFieldTeamOrigin {
 param([string]$Text)
 $matches=[regex]::Matches($Text,'https://[a-z0-9-]+\.lhr\.life')
 if($matches.Count){return $matches[$matches.Count-1].Value}
 return $null
}
function Watch-ITFieldTeamTunnel {
 param([int]$ProcessId,[string]$AppRoot)
 $mutex=New-Object Threading.Mutex($false,'Local\ITFieldRayongTeamWatcher');$acquired=$false
 try{$acquired=$mutex.WaitOne(0)}catch [Threading.AbandonedMutexException]{$acquired=$true}
 if(!$acquired){$mutex.Dispose();Wait-Process -Id $ProcessId -ErrorAction SilentlyContinue;return}
 try{
 $last=''
 while(Get-Process -Id $ProcessId -ErrorAction SilentlyContinue){
  try{
   $text=(Get-Content -LiteralPath (Join-Path $AppRoot 'data/team.log') -Raw -Encoding UTF8)
   $origin=Get-LatestITFieldTeamOrigin $text
   if($origin){
    if($origin -ne $last){
     # Register exact new hostname before TLS-origin verification; never trust arbitrary hosts.
     [IO.File]::WriteAllText((Join-Path $AppRoot 'data/team-origin'),$origin,[Text.UTF8Encoding]::new($false))
     $health=Invoke-RestMethod ($origin+'/api/health') -TimeoutSec 5
     if($health.service -ne 'itfield-rayong'){throw 'Wrong public service'}
     $token=(Get-Content -LiteralPath (Join-Path $AppRoot 'data/pair-token') -Raw -Encoding UTF8).Trim()
     $link=Join-Path $AppRoot 'data/field-cloud-link.url';[IO.File]::WriteAllText(($link+'.tmp'),"[InternetShortcut]`r`nURL=$origin/field/index.html#pair=$token`r`n",[Text.UTF8Encoding]::new($false));Move-Item -LiteralPath ($link+'.tmp') -Destination $link -Force
     [IO.File]::WriteAllText((Join-Path $AppRoot 'data/team-status.json'),(@{ready=$true;origin=$origin;checkedAt=[DateTime]::UtcNow.ToString('o')}|ConvertTo-Json -Compress),[Text.UTF8Encoding]::new($false))
     $last=$origin
    }
   }
  }catch{[IO.File]::WriteAllText((Join-Path $AppRoot 'data/team-status.json'),(@{ready=$false;error='Team URL verification pending';checkedAt=[DateTime]::UtcNow.ToString('o')}|ConvertTo-Json -Compress),[Text.UTF8Encoding]::new($false))}
  Start-Sleep -Seconds 3
 }
 }finally{$mutex.ReleaseMutex();$mutex.Dispose()}
}
