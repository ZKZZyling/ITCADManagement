param([string]$InputDrawing,[switch]$NoBrowser)
$ErrorActionPreference='Stop'
. "$PSScriptRoot/bootstrap.ps1"
if(!$InputDrawing){Add-Type -AssemblyName System.Windows.Forms;$dialog=New-Object Windows.Forms.OpenFileDialog;$dialog.Filter='CAD Drawings (*.dwg;*.dxf)|*.dwg;*.dxf';if($dialog.ShowDialog() -ne 'OK'){return};$InputDrawing=$dialog.FileName}
$source=Get-Item -LiteralPath $InputDrawing
Invoke-ITFieldCommand -Command {
 $python=Join-Path $script:ITFieldRoot '.venv/Scripts/python.exe'
 if(!(Test-Path $python)){throw 'Create .venv and install requirements.txt first; see docs/cad-pipeline.md'}
 $key=[guid]::NewGuid().ToString();$run=Join-Path $script:ITFieldRoot ('data/native/'+$key);$output=Join-Path $script:ITFieldRoot ('data/packets/'+$key)
 & $python -X utf8 scripts/extract-independent.py $source.FullName --output $run
 if($LASTEXITCODE -ne 0){throw 'Extraction failed; source preserved and current package unchanged'}
 & $python -X utf8 scripts/prepare-cad.py --pilot $run --out $output --full
 if($LASTEXITCODE -ne 0){throw 'Review preparation failed; current package unchanged'}
 & $python -X utf8 scripts/audit-package.py --root $output --native $run
 if($LASTEXITCODE -ne 0){throw 'Coverage audit failed; current package unchanged'}
 & $python -X utf8 scripts/optimize-cad.py --root $output
 if($LASTEXITCODE -ne 0){throw 'Optimization failed; current package unchanged'}
 Set-Content data/active-package.tmp $key -Encoding UTF8
 Move-Item -LiteralPath data/active-package.tmp -Destination data/active-package -Force
 Write-Output 'Review package prepared. Engineering acceptance remains blocked. Author references require separate preparation.'
 & ./scripts/start.ps1 -NoBrowser:$NoBrowser
}
