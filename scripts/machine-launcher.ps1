[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][string]$Dataset,
 [ValidateSet('Start','Status','Stop','Restart')][string]$Action='Start',
 [ValidateRange(1024,65535)][int]$Port=42881,
 [string]$ExpectedSourceSHA256='', [string]$ExpectedWorkbookSHA256='',
 [switch]$NoBrowser
)
$mutex=[Threading.Mutex]::new($false,('Local\ITCADMachinePlanner-'+$Port))
$lockTaken=$false
try {
$lockTaken=$mutex.WaitOne([TimeSpan]::FromSeconds(30))
if(-not $lockTaken){throw 'Another launcher is still working. Retry after it finishes.'}
$ErrorActionPreference='Stop'
$env:PSModulePath=($PSHOME+'\Modules;'+$env:WINDIR+'\System32\WindowsPowerShell\v1.0\Modules;'+$env:PSModulePath)
$serverPath=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../server/machine-planner.mjs'))
$datasetPath=(Resolve-Path -LiteralPath $Dataset).Path
$packageRoot=Split-Path -Parent $datasetPath
$runtimePath=Join-Path $packageRoot 'runtime'
$statePath=Join-Path $runtimePath 'machine-launcher-state.json'
$data=Get-Content -LiteralPath $datasetPath -Raw -Encoding UTF8 | ConvertFrom-Json
$pathHasher=[Security.Cryptography.SHA256]::Create()
$packagePathHash=([BitConverter]::ToString($pathHasher.ComputeHash([Text.Encoding]::UTF8.GetBytes($datasetPath.ToLowerInvariant())))).Replace('-','').ToLowerInvariant()
$pathHasher.Dispose()
$packageHash=(Get-FileHash -LiteralPath $datasetPath -Algorithm SHA256).Hash.ToLowerInvariant()
$serverHash=(Get-FileHash -LiteralPath $serverPath -Algorithm SHA256).Hash.ToLowerInvariant()
if($ExpectedSourceSHA256 -and $data.sourceSHA256 -cne $ExpectedSourceSHA256){throw 'Source identity mismatch; original package required.'}
if($ExpectedWorkbookSHA256 -and $data.sourceWorkbookSHA256 -cne $ExpectedWorkbookSHA256){throw 'Workbook identity mismatch; original package required.'}
$baseUrl="http://127.0.0.1:$Port"
function Get-Health {
 try { Invoke-RestMethod -Uri "$baseUrl/api/machine-server/health" -TimeoutSec 2 } catch { $null }
}
function Test-Identity($health) {
 $health -and $health.application -eq 'itcad-private-machine-planner' -and $health.protocolVersion -eq 1 -and $health.identity.sourceSHA256 -ceq $data.sourceSHA256 -and $health.identity.workbookSHA256 -ceq $data.sourceWorkbookSHA256 -and $health.identity.datasetSHA256 -ceq $packageHash -and $health.identity.packagePathSHA256 -ceq $packagePathHash -and $health.serverCodeSHA256 -ceq $serverHash
}
function Test-Owned($health) {
 if(-not $health -or -not (Test-Path -LiteralPath $statePath)){return $false}
 $state=Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
 if($state.instanceId -cne $health.instanceId -or $state.pid -ne $health.pid -or $state.datasetPath -ine $datasetPath){return $false}
 $proc=Get-CimInstance Win32_Process -Filter "ProcessId=$($health.pid)" -ErrorAction SilentlyContinue
 $proc -and $proc.Name -eq 'node.exe' -and $proc.CommandLine.Contains($serverPath) -and $health.serverPath -ieq $serverPath
}
function Stop-Owned($health) {
 if(-not (Test-Owned $health)){throw 'The listener is not owned by this launcher. It was left running.'}
 $status=Invoke-RestMethod -Uri "$baseUrl/api/machine-server/status" -TimeoutSec 2
 if($status.instanceId -cne $health.instanceId){throw 'Listener changed; stop cancelled.'}
 $null=Invoke-RestMethod -Method Post -Uri "$baseUrl/api/machine-server/stop" -Headers @{Origin=$baseUrl;'X-Machine-Management'=$status.managementToken} -ContentType 'application/json' -Body '{}' -TimeoutSec 3
 for($i=0;$i -lt 30;$i++){if(-not (Get-Health)){return};Start-Sleep -Milliseconds 100}
 throw 'The owned server did not stop in time. No process was force-killed.'
}
$health=Get-Health
if($Action -eq 'Status') {
 if($health){[pscustomobject]@{status=if(Test-Identity $health){'ready'}else{'different-package-or-version'};owned=(Test-Owned $health);pid=$health.pid;url="$baseUrl/field/machines.html#connect";identity=$health.identity}|ConvertTo-Json -Depth 5}else{[pscustomobject]@{status='not-running-or-unrecognized';url="$baseUrl/field/machines.html#connect"}|ConvertTo-Json};exit 0
}
if($Action -eq 'Stop') {if($health){Stop-Owned $health;Write-Output 'Stopped owned machine planner.'}else{Write-Output 'No recognized machine planner; no process was stopped.'};exit 0}
if($health -and ($Action -eq 'Restart' -or -not (Test-Identity $health))){Stop-Owned $health;$health=$null}
if($health){
 if(-not (Test-Identity $health)){throw 'Port contains a different package or server version.'}
 # Reuse a matching server without adopting ownership of a different launcher.
 Write-Output "Reused machine planner PID $($health.pid)."
}else{
 $listeners=Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
 if($listeners){throw "Port $Port is occupied by an unrecognized listener. No process was stopped and the stable browser origin was preserved."}
 $node=(Get-Command node.exe -ErrorAction Stop).Source
 $null=New-Item -ItemType Directory -Force -Path $runtimePath
 $names=@('ITCAD_MACHINE_DATASET','ITCAD_MACHINE_PORT','ITCAD_MACHINE_EXPECT_SOURCE','ITCAD_MACHINE_EXPECT_WORKBOOK')
 $previous=@{};foreach($name in $names){$previous[$name]=[Environment]::GetEnvironmentVariable($name,'Process')}
 try {
  $env:ITCAD_MACHINE_DATASET=$datasetPath;$env:ITCAD_MACHINE_PORT="$Port";$env:ITCAD_MACHINE_EXPECT_SOURCE=$data.sourceSHA256;$env:ITCAD_MACHINE_EXPECT_WORKBOOK=$data.sourceWorkbookSHA256
  $child=Start-Process -FilePath $node -ArgumentList @('"'+$serverPath+'"') -WorkingDirectory (Split-Path -Parent $serverPath) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimePath 'server.stdout.log') -RedirectStandardError (Join-Path $runtimePath 'server.stderr.log')
 }finally{foreach($name in $names){[Environment]::SetEnvironmentVariable($name,$previous[$name],'Process')}}
 for($i=0;$i -lt 50;$i++){Start-Sleep -Milliseconds 100;$health=Get-Health;if($health){break};$child.Refresh();if($child.HasExited){break}}
 if(-not (Test-Identity $health) -or $health.pid -ne $child.Id){throw 'Server did not report the expected package and PID. Inspect private runtime/server.stderr.log; no unrelated process was stopped.'}
 [pscustomobject]@{pid=$health.pid;instanceId=$health.instanceId;datasetPath=$datasetPath;serverPath=$serverPath;port=$Port;startedAt=(Get-Date).ToUniversalTime().ToString('o')}|ConvertTo-Json|Set-Content -LiteralPath $statePath -Encoding UTF8
 Write-Output "Started machine planner PID $($health.pid)."
}
$url="$baseUrl/field/machines.html#connect"
Write-Output $url
if(-not $NoBrowser){Start-Process $url}


} finally { if($lockTaken){$mutex.ReleaseMutex()}; $mutex.Dispose() }
