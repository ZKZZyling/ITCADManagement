$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot '../scripts/control-state.ps1')
$state=@{busy=$true;readySeen=$false;operation='start'}
$failed=[pscustomobject]@{operation='start';success=$false;message='DNS failure'}
$notifications=0
for($tick=0;$tick -lt 100;$tick++){
 if(Receive-ITFieldControlResult $state $failed){
  $notifications++
  # Simulates a nested timer callback while the first handler is showing UI.
  if(Receive-ITFieldControlResult $state $failed){throw 'Nested callback consumed failure twice'}
 }
}
if($notifications -ne 1 -or $state.busy -or !$state.readySeen){throw 'Failure result was not consumed exactly once'}
$state.busy=$true;$state.readySeen=$false;$state.operation='local'
if(Receive-ITFieldControlResult $state $failed){throw 'Stale different operation consumed'}
if(!$state.busy){throw 'Stale result cleared current operation'}
if(!(Receive-ITFieldControlResult $state ([pscustomobject]@{operation='local';success=$true}))){throw 'Retry did not complete'}
if(Receive-ITFieldControlResult $state ([pscustomobject]@{operation='local';success=$true})){throw 'Success handled twice'}
$state.busy=$true;$state.readySeen=$false
if(Receive-ITFieldControlResult $state $null){throw 'Incomplete result was consumed'}
Write-Output 'PASS: failure and nested callbacks consumed once; stale/incomplete results rejected; retry and success consumed once'
