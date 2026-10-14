$ErrorActionPreference='Stop'
. "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
 $data=if($env:ITFIELD_DATA_DIR){$env:ITFIELD_DATA_DIR}else{Join-Path $script:ITFieldRoot 'data'}
 $pidFile=Join-Path $data 'analysis.pid'
 if(!(Test-Path $pidFile)){return}
 $processId=[int](Get-Content $pidFile -Raw);$owned=Get-CimInstance Win32_Process -Filter "ProcessId = $processId"
 if($owned){
  if($owned.ExecutablePath -ne $script:ITFieldNode -or $owned.CommandLine -notlike ('*--itcad-instance='+$script:ITFieldInstance+'*')){throw 'Analysis PID belongs to another process; refused to stop it'}
  $port=if($env:ITCAD_ANALYSIS_PORT){[int]$env:ITCAD_ANALYSIS_PORT}else{42875}
  $origin='http://127.0.0.1:'+$port;$token=(Get-Content (Join-Path $data 'analysis-token') -Raw -Encoding UTF8).Trim()
  $session=New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $null=Invoke-RestMethod ($origin+'/admin/pair') -Method Post -Headers @{Origin=$origin} -ContentType 'application/json' -Body (@{token=$token}|ConvertTo-Json) -WebSession $session
  $null=Invoke-RestMethod ($origin+'/admin/shutdown') -Method Post -Headers @{Origin=$origin} -ContentType 'application/json' -Body '{}' -WebSession $session
  Wait-Process -Id $processId -Timeout 30 -ErrorAction Stop
 }
 Remove-Item -LiteralPath $pidFile
 Write-Output 'Analysis worker and service shutdown verified'
}
