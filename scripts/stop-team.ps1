$ErrorActionPreference='Stop'
. "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
 Set-Location $script:ITFieldRoot
 . ./scripts/runtime-process.ps1
 Stop-OwnedITFieldProcess -PidFile 'data/team.pid' -Executable 'C:\Windows\System32\OpenSSH\ssh.exe' -CommandPattern '*-R 80:127.0.0.1:42873*nokey@localhost.run*' -Label 'Team tunnel'
}
