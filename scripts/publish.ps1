param(
 [Parameter(Mandatory=$true)][string[]]$Paths,
 [Parameter(Mandatory=$true)][string]$Title,
 [Parameter(Mandatory=$true)][string]$Body,
 [switch]$CheckOnly
)
$ErrorActionPreference='Stop'
Set-Location -LiteralPath (Join-Path $PSScriptRoot '..')
function Invoke-Gate {
 param([string]$Program,[string[]]$Arguments)
 & $Program @Arguments
 if($LASTEXITCODE -ne 0){throw ('Failed gate: '+$Program+' '+($Arguments -join ' '))}
}
if($Title -notmatch '^[A-Za-z][ -~]{5,100}$' -or $Title -match '[\r\n]'){throw 'Use a concise English ASCII commit subject'}
if(!$Body.Trim()){throw 'Provide an English change description'}
$origin=(& git remote get-url origin).Trim()
if($LASTEXITCODE -ne 0 -or $origin -notin @('https://github.com/ZKZZyling/ITCADManagement.git','git@github.com:ZKZZyling/ITCADManagement.git')){throw 'Unexpected publication origin'}
$branch=(& git branch --show-current).Trim()
if(!$branch){throw 'Detached HEAD; select the intended branch before publication'}
$upstream=(& git rev-parse --abbrev-ref '@{upstream}').Trim()
if($LASTEXITCODE -ne 0 -or $upstream -notlike 'origin/*'){throw 'An origin upstream is required'}
Invoke-Gate -Program git -Arguments @('fetch','origin')
$behind=[int](& git rev-list --count 'HEAD..@{upstream}')
if($behind){throw 'Remote commits must be reviewed and integrated before publication; no automatic merge performed'}
foreach($item in $Paths){if(!$item -or $item -match '(^/|^[A-Za-z]:|(^|[/\\])\.\.([/\\]|$)|[*?\[\]])'){throw 'Use explicit repository-relative publication paths without wildcards'}}
Invoke-Gate -Program npm.cmd -Arguments @('run','build')
Invoke-Gate -Program npm.cmd -Arguments @('test')
& (Join-Path $PSScriptRoot 'check-powershell.ps1')
& (Join-Path $PSScriptRoot '../tests/control-state.test.ps1')
& (Join-Path $PSScriptRoot '../tests/team-origin.test.ps1')
Invoke-Gate -Program git -Arguments (@('add','--')+$Paths)
$staged=@(& git diff --cached --name-only)
foreach($file in $staged){
 $selected=$false
 foreach($item in $Paths){$prefix=$item.Replace('\','/').TrimEnd('/');if($file -eq $prefix -or $file.StartsWith($prefix+'/',[StringComparison]::Ordinal)){$selected=$true;break}}
 if(!$selected){throw ('Staged file outside selected paths: '+$file)}
}
Invoke-Gate -Program git -Arguments @('diff','--cached','--check')
Invoke-Gate -Program npm.cmd -Arguments @('run','check:release')
& git diff --cached --stat
if($CheckOnly){Write-Output 'Checks passed; staged changes retained for review. No commit or push performed.';return}
if($staged.Count){
 $directory=Join-Path (Get-Location) '.runtime/publish';New-Item -ItemType Directory -Path $directory -Force | Out-Null
 $message=Join-Path $directory 'commit-message.txt'
 $text=$Title+"`n`n"+$Body.Trim()+"`n`nValidation: build, Node tests, PowerShell checks, staged diff check, and release scan passed.`n"
 [IO.File]::WriteAllText($message,$text,[Text.UTF8Encoding]::new($false))
 Invoke-Gate -Program git -Arguments @('commit','--file',$message)
}
Invoke-Gate -Program git -Arguments @('push','origin',('HEAD:'+($upstream.Substring(7))))
$local=(& git rev-parse HEAD).Trim()
$remote=@(& git ls-remote origin ('refs/heads/'+$upstream.Substring(7)))
if($LASTEXITCODE -ne 0 -or !$remote.Count -or ($remote[0] -split '\s+')[0] -ne $local){throw 'Push returned but remote commit verification failed'}
Write-Output ('Verified remote commit: '+$local)
Write-Output 'Check GitHub CI for this exact commit before reporting full verification.'
