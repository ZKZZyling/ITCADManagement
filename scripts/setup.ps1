$ErrorActionPreference='Stop'
Set-Location -LiteralPath (Join-Path $PSScriptRoot '..')
& node -e "const [a,b]=process.versions.node.split('.').map(Number);if(a<22||(a===22&&b<13))throw Error('Node 22.13+ required');require('node:sqlite')"
if($LASTEXITCODE -ne 0){throw 'Unsupported Node runtime'}
& npm.cmd ci
if($LASTEXITCODE -ne 0){throw 'Dependency installation failed'}
& npm.cmd run build
if($LASTEXITCODE -ne 0){throw 'Client build failed'}
& npm.cmd run demo
if($LASTEXITCODE -ne 0){throw 'Demo setup failed'}
Write-Output 'Setup ready. Open ITField-Control.cmd to start the local workspace.'
