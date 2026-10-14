$ErrorActionPreference='Stop'
$files=Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.ps1'
foreach($file in $files){
 $tokens=$null;$errors=$null
 $null=[Management.Automation.Language.Parser]::ParseFile($file.FullName,[ref]$tokens,[ref]$errors)
 if($errors.Count){throw ($file.Name+': '+($errors.Message -join '; '))}
}
Write-Output ('PASS: PowerShell syntax checked in '+$files.Count+' scripts')
