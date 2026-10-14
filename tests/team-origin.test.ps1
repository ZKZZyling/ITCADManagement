$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot '../scripts/watch-team.ps1')
if((Get-LatestITFieldTeamOrigin 'docs https://admin.localhost.run/') -ne $null){throw 'Picked admin page'}
if((Get-LatestITFieldTeamOrigin "https://old.lhr.life`nhttps://new.lhr.life") -ne 'https://new.lhr.life'){throw 'Picked stale rotated URL'}
if((Get-LatestITFieldTeamOrigin 'https://evil.invalid') -ne $null){throw 'Picked unrelated host'}
Write-Output 'PASS: latest rotated URL selected; docs and unrelated hosts rejected'
