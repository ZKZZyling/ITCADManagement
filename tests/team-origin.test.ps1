$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot '../scripts/watch-team.ps1')
foreach($invalid in @('docs https://admin.localhost.run/','https://evil.invalid','https://valid.lhr.life.evil/','https://valid.lhr.life:443/','https://valid.lhr.life@evil.invalid','https://-bad.lhr.life/','https://bad-.lhr.life/')){
 if((Get-LatestITFieldTeamOrigin $invalid) -ne $null){throw 'Picked an unrelated or lookalike hostname'}
}
if((Get-LatestITFieldTeamOrigin "https://old.lhr.life`nhttps://new.lhr.life/") -ne 'https://new.lhr.life'){throw 'Picked stale rotated URL'}
$testRoot=Join-Path $env:TEMP ('ITField-TeamTest-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $testRoot 'data') -Force | Out-Null
try{
 Set-Content (Join-Path $testRoot 'data/team.log') "https://old.lhr.life`nhttps://new.lhr.life" -Encoding UTF8
 Set-Content (Join-Path $testRoot 'data/team-error.log') 'https://stale.lhr.life' -Encoding UTF8
 Set-Content (Join-Path $testRoot 'data/pair-token') 'synthetic-pair-token' -Encoding UTF8
 $script:healthCalls=0;$script:failHealth=$false;$script:healthMode=$null
 function Invoke-RestMethod {
  param($Uri,$TimeoutSec)
  $script:healthCalls++
  $registered=(Get-Content (Join-Path $testRoot 'data/team-origin') -Raw).Trim()
  if($Uri -ne ($registered+'/api/health')){throw 'New origin was not registered before health check'}
  if($script:failHealth){throw 'Synthetic health failure'}
  return @{service='itfield-rayong';accessMode=$script:healthMode}
 }
 if((Update-ITFieldTeamOrigin $testRoot) -ne 'https://new.lhr.life'){throw 'Fresh log did not replace stale origin'}
 $shortcut=Get-Content (Join-Path $testRoot 'data/field-cloud-link.url') -Raw
 if(!$shortcut.Contains('https://new.lhr.life/field/index.html#pair=synthetic-pair-token')){throw 'Pairing shortcut not refreshed'}
 Set-Content (Join-Path $testRoot 'data/access-mode') 'paired' -Encoding UTF8
 $script:healthMode='open'
 # Open links must work without even reading a pairing token.
 Remove-Item -LiteralPath (Join-Path $testRoot 'data/pair-token')
 Update-ITFieldTeamOrigin $testRoot | Out-Null
 $shortcut=Get-Content (Join-Path $testRoot 'data/field-cloud-link.url') -Raw
 if($shortcut.Trim() -ne "[InternetShortcut]`r`nURL=https://new.lhr.life/field/index.html"){throw 'Open shortcut exposed credentials or omitted plain field URL'}
 Set-Content (Join-Path $testRoot 'data/pair-token') 'synthetic-pair-token' -Encoding UTF8
 $script:healthMode='paired'
 Set-Content (Join-Path $testRoot 'data/access-mode') 'open' -Encoding UTF8
 Update-ITFieldTeamOrigin $testRoot | Out-Null
 if(!(Get-Content (Join-Path $testRoot 'data/field-cloud-link.url') -Raw).Contains('#pair=synthetic-pair-token')){throw 'Verified paired health was overridden by open config file'}
 foreach($restrictedMode in @('Open','paired','invalid',$null)){
  Set-Content (Join-Path $testRoot 'data/access-mode') $restrictedMode -Encoding UTF8
  if((Get-ITFieldTeamLink -AppRoot $testRoot -Origin 'https://new.lhr.life' -AccessMode $restrictedMode) -ne 'https://new.lhr.life/field/index.html#pair=synthetic-pair-token'){throw 'Non-open access mode disabled pairing'}
 }
 Remove-Item -LiteralPath (Join-Path $testRoot 'data/access-mode')
 Add-Content (Join-Path $testRoot 'data/team.log') 'https://rotated.lhr.life' -Encoding UTF8
 if((Update-ITFieldTeamOrigin $testRoot) -ne 'https://rotated.lhr.life'){throw 'Rotation during retries not followed'}
 $script:failHealth=$true
 try{Update-ITFieldTeamOrigin $testRoot | Out-Null;throw 'Expected health failure'}catch{if($_.Exception.Message -ne 'Synthetic health failure'){throw}}
 if((Get-Content (Join-Path $testRoot 'data/team-status.json') -Raw | ConvertFrom-Json).ready){throw 'Health failure left ready state stale'}
 # Run two bounded watcher cycles with an unchanged hostname. A zero refresh
 # interval is a test seam; the production default is 30 seconds.
 $script:failHealth=$false;$script:polls=0;$script:healthCalls=0
 function Get-Process {param($Id,$ErrorAction) if($script:polls -lt 2){return @{Id=$Id}}}
 function Start-Sleep {param($Seconds) $script:polls++;$script:failHealth=$true}
 Watch-ITFieldTeamTunnel -ProcessId 1 -AppRoot $testRoot -RefreshSeconds 0 -PollSeconds 0 -MutexName ('Local\ITFieldTeamTest-'+[Guid]::NewGuid().ToString('N'))
 if($script:healthCalls -ne 2){throw 'Unchanged origin health was not periodically refreshed'}
 if((Get-Content (Join-Path $testRoot 'data/team-status.json') -Raw | ConvertFrom-Json).ready){throw 'Stopped tunnel left ready state stale'}
 Write-Output 'PASS: exact provider hosts; latest rotation; origin registration; paired/open shortcuts; recurring health and stopped status'
}finally{
 Remove-Item Function:Invoke-RestMethod,Function:Get-Process,Function:Start-Sleep -ErrorAction SilentlyContinue
 # Delete only this uniquely created test directory under the verified TEMP.
 $resolved=[IO.Path]::GetFullPath($testRoot)
 $tempBase=[IO.Path]::GetFullPath($env:TEMP).TrimEnd('\')+'\'
 if(!$resolved.StartsWith($tempBase,[StringComparison]::OrdinalIgnoreCase)){throw 'Test cleanup path escaped TEMP'}
 Remove-Item -LiteralPath $resolved -Recurse -Force
}
