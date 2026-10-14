$script:ITFieldRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$script:ITFieldNode=(Get-Command node -ErrorAction Stop).Source
$hash=[Security.Cryptography.SHA256]::Create()
$script:ITFieldInstance=([BitConverter]::ToString($hash.ComputeHash([Text.Encoding]::UTF8.GetBytes($script:ITFieldRoot.ToLowerInvariant())))).Replace('-','').ToLowerInvariant().Substring(0,16)
$hash.Dispose()
function Invoke-ITFieldCommand {
 param([scriptblock]$Command)
 $previous=Get-Location;$oldTemp=$env:TEMP;$oldTmp=$env:TMP
 try {
  Set-Location -LiteralPath $script:ITFieldRoot
  $temporary=Join-Path $script:ITFieldRoot '.runtime/temp'
  New-Item -ItemType Directory -Path $temporary -Force | Out-Null
  $env:TEMP=$temporary;$env:TMP=$temporary
  & $Command
 } finally {$env:TEMP=$oldTemp;$env:TMP=$oldTmp;Set-Location -LiteralPath $previous.Path}
}
