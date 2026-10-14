function Stop-OwnedITFieldProcess {
 param([string]$PidFile,[string]$Executable,[string]$CommandPattern,[string]$Label)
 if(!(Test-Path -LiteralPath $PidFile)){Write-Output ($Label+': already stopped');return}
 $raw=(Get-Content -LiteralPath $PidFile -Raw -Encoding UTF8).Trim()
 $processId=0
 if(![int]::TryParse($raw,[ref]$processId) -or $processId -le 0){throw ($Label+': invalid PID file; preserved for investigation')}
 $owned=Get-CimInstance Win32_Process -Filter "ProcessId = $processId"
 if($owned){
  if($owned.ExecutablePath -ne $Executable -or $owned.CommandLine -notlike $CommandPattern){throw ($Label+': PID belongs to a different process; no process stopped')}
  try{$process=Get-Process -Id $processId -ErrorAction Stop}catch{if(Get-CimInstance Win32_Process -Filter "ProcessId = $processId"){throw};$process=$null}
  if($process){
   try{Stop-Process -InputObject $process -ErrorAction Stop}catch{if(!$process.HasExited){throw}}
   if(!$process.WaitForExit(10000)){throw ($Label+': stop timed out')}
   $process.Dispose()
  }
 }
 Remove-Item -LiteralPath $PidFile -ErrorAction Stop
 Write-Output ($Label+': stopped and verified')
}
