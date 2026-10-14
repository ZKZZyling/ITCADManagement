$ErrorActionPreference='Stop'
if($PSVersionTable.PSEdition -eq 'Desktop'){$env:PSModulePath=(Join-Path $PSHOME 'Modules')+';'+$env:PSModulePath}
$failures=@()
try{& (Join-Path $PSScriptRoot 'stop-team.ps1')}catch{$failures+=$_.Exception.Message}
try{& (Join-Path $PSScriptRoot 'stop-cloud.ps1')}catch{$failures+=$_.Exception.Message}
try{& (Join-Path $PSScriptRoot 'stop.ps1')}catch{$failures+=$_.Exception.Message}
if($failures.Count){throw ($failures -join '; ')}
Write-Output 'IT Field shutdown verified'
