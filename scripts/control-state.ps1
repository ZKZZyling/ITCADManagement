function Receive-ITFieldControlResult {
 param([hashtable]$State,$Result)
 if(!$State.busy -or $State.readySeen -or !$Result -or $Result.operation -ne $State.operation){return $false}
 # Consume before any UI callback can pump Windows messages and re-enter the timer.
 $State.readySeen=$true
 $State.busy=$false
 return $true
}
