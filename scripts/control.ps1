param([switch]$SelfTest,[switch]$VerifyUI)
$ErrorActionPreference='Stop'
if($PSVersionTable.PSEdition -eq 'Desktop'){$env:PSModulePath=(Join-Path $PSHOME 'Modules')+';'+$env:PSModulePath}
try { . "$PSScriptRoot/bootstrap.ps1"
Invoke-ITFieldCommand -Command {
 $appRoot=$script:ITFieldRoot
 Set-Location -LiteralPath $appRoot
 . ./scripts/control-state.ps1
 $powerShellExe='C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
 function Get-LocalReady {
  try{$h=Invoke-RestMethod 'http://127.0.0.1:42873/api/health' -TimeoutSec 1;return ($h.service -eq 'itfield-rayong' -and $h.instance -eq $script:ITFieldInstance)}catch{return $false}
 }
 function Get-TeamLink {
  $p=Join-Path $appRoot 'data/field-cloud-link.url'
  if(!(Test-Path -LiteralPath $p)){throw 'ยังไม่มีลิงก์ทีม กรุณากดเริ่มระบบก่อน'}
  $line=Get-Content -LiteralPath $p -Encoding UTF8 | Where-Object {$_ -like 'URL=*'} | Select-Object -First 1
  if(!$line -or $line -notmatch '^URL=https://[a-z0-9-]+\.(trycloudflare\.com|lhr\.life)/field/index\.html#pair=[a-f0-9]+$'){throw 'ไฟล์ลิงก์ทีมไม่ถูกต้อง'}
  return $line.Substring(4)
 }
 foreach($file in @('scripts/start-team.ps1','scripts/stop-team.ps1','scripts/control-state.ps1','scripts/control-operation.ps1','scripts/runtime-process.ps1','scripts/start.ps1','scripts/stop-all.ps1','scripts/stop.ps1','scripts/stop-cloud.ps1','scripts/prepare-drawing.ps1','public/field/assets/main.js')){if(!(Test-Path -LiteralPath $file)){throw ('Required file missing: '+$file)}}
 if($SelfTest){
  $validLink=$false;try{$null=Get-TeamLink;$validLink=$true}catch{}
  [pscustomobject]@{controller='itfield-control';version=4;dependencies='pass';localReady=(Get-LocalReady);pairedLinkSyntaxValid=$validLink;publicLinkVerified=$false;portableRootValidated=$true}|ConvertTo-Json
  return
 }
 Add-Type -AssemblyName System.Windows.Forms
 Add-Type -AssemblyName System.Drawing
 [Windows.Forms.Application]::EnableVisualStyles()
 $mutex=New-Object Threading.Mutex($false,'Local\ITFieldRayongControl')
 $ownsControl=$false;try{$ownsControl=$mutex.WaitOne(0)}catch [Threading.AbandonedMutexException]{$ownsControl=$true}
 if(!$ownsControl){[Windows.Forms.MessageBox]::Show('ตัวควบคุม IT Field เปิดอยู่แล้ว กรุณาใช้หน้าต่างเดิม','IT Field')|Out-Null;$mutex.Dispose();return}
 try{
  $form=New-Object Windows.Forms.Form
  $form.Text='IT Field Rayong — ตัวควบคุมระบบ v4'
  $form.ClientSize=New-Object Drawing.Size(660,490)
  $form.StartPosition='CenterScreen';$form.FormBorderStyle='FixedDialog';$form.MaximizeBox=$false
  $form.BackColor=[Drawing.Color]::FromArgb(244,248,250)
  $form.Font=New-Object Drawing.Font('Tahoma',10)
  function Add-Label($text,$x,$y,$w,$h){$l=New-Object Windows.Forms.Label;$l.Text=$text;$l.SetBounds($x,$y,$w,$h);$form.Controls.Add($l);return $l}
  $title=Add-Label 'IT FIELD / RAYONG' 24 20 610 32
  $title.Font=New-Object Drawing.Font('Tahoma',18,[Drawing.FontStyle]::Bold)
  $null=Add-Label 'เปิดเว็บในเครื่องได้ทันที • ลิงก์ภายนอกเปิดแยกเมื่อต้องการ' 24 62 610 28
  $status=Add-Label 'กำลังตรวจสถานะ…' 24 100 610 26
  $cloud=Add-Label 'ลิงก์ทีม: ยังไม่ได้ตรวจสถานะการเชื่อมต่อภายนอก' 24 134 610 40
  function Add-Button($text,$x,$y,$w,$h){$b=New-Object Windows.Forms.Button;$b.Text=$text;$b.SetBounds($x,$y,$w,$h);$b.FlatStyle='Flat';$form.Controls.Add($b);return $b}
  $start=Add-Button 'เริ่มระบบและเปิดเว็บในเครื่อง' 24 187 612 58
  $start.BackColor=[Drawing.Color]::FromArgb(23,125,144);$start.ForeColor=[Drawing.Color]::White
  $start.Font=New-Object Drawing.Font('Tahoma',12,[Drawing.FontStyle]::Bold)
  $open=Add-Button 'เปิดลิงก์ทีมชั่วคราว' 24 260 296 46
  $copy=Add-Button 'คัดลอกลิงก์จับคู่สำหรับทีม' 340 260 296 46
  $stop=Add-Button 'หยุดระบบทั้งหมด' 24 320 296 46
  $tools=Add-Button 'เปิดโฟลเดอร์เครื่องมือ' 340 320 296 46
  $note=Add-Label "ต้องเชื่อมต่อไดรฟ์โครงการและเปิดเครื่องเซิร์ฟเวอร์ไว้ขณะใช้งาน\nลิงก์ทีมให้สิทธิเข้าถึงงาน • ส่งเฉพาะทีมที่ได้รับอนุญาต\nปิดหน้าต่างนี้ไม่หยุดเซิร์ฟเวอร์ • ลิงก์ชั่วคราวอาจเปลี่ยนเมื่อเริ่ม Tunnel ใหม่" 24 389 612 78
  $note.Text=$note.Text.Replace('\n',"`r`n")
  $state=@{busy=$false;operation='';job=$null;log='';errorLog='';resultFile='';startedAt=$null;opened=$false;readySeen=$false;errorShowing=$false}
  function Show-Error($message){
   if($state.errorShowing){return}
   $state.errorShowing=$true
   if($timer){$timer.Stop()}
   try{[Windows.Forms.MessageBox]::Show($message,'IT Field — ตรวจสอบการทำงาน',[Windows.Forms.MessageBoxButtons]::OK,[Windows.Forms.MessageBoxIcon]::Warning)|Out-Null}
   finally{$state.errorShowing=$false;if($timer -and !$form.IsDisposed){$timer.Start()}}
  }
  function Start-Action($operation,$scriptPath){
   if($state.busy){return}
   $runId=[guid]::NewGuid().ToString('N')
   $state.log=Join-Path $appRoot ('data/control-'+$runId+'.log');$state.errorLog=Join-Path $appRoot ('data/control-'+$runId+'-error.log')
   $state.resultFile=Join-Path $appRoot ('data/control-'+$runId+'-result.json')
   $state.operation=$operation;$state.startedAt=Get-Date;$state.opened=$false;$state.readySeen=$false
   $arguments=@('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+(Join-Path $appRoot 'scripts/control-operation.ps1')+'"'),'-Operation',$operation,'-ResultFile',('"'+$state.resultFile+'"'))
   $state.job=Start-Process $powerShellExe -ArgumentList $arguments -WorkingDirectory $appRoot -WindowStyle Hidden -RedirectStandardOutput $state.log -RedirectStandardError $state.errorLog -PassThru
   $null=$state.job.Handle
   $state.busy=$true;$start.Enabled=$false;$open.Enabled=$false;$stop.Enabled=$false;$copy.Enabled=$false
   $status.Text='กำลังทำงาน… โปรดรอ';$cloud.Text=$(if($operation -eq 'stop'){'กำลังหยุดเซิร์ฟเวอร์และ Cloudflare…'}else{'กำลังเตรียมระบบ กรุณาอย่ากดเริ่มซ้ำ'})
  }
  $start.Add_Click({try{Start-Action 'local' (Join-Path $appRoot 'scripts/start.ps1')}catch{Show-Error $_.Exception.Message}})
  $open.Add_Click({try{Start-Action 'team' (Join-Path $appRoot 'scripts/start-team.ps1')}catch{Show-Error $_.Exception.Message}})
  $copy.Add_Click({try{
   if(!(Get-LocalReady)){throw 'เซิร์ฟเวอร์ยังไม่พร้อม กรุณากดเริ่มระบบก่อน'}
   $url=Get-TeamLink
   $h=Invoke-RestMethod ($url.Split('#')[0].Replace('/field/index.html','/api/health')) -TimeoutSec 5
   if($h.service -ne 'itfield-rayong'){throw 'ลิงก์ทีมยังไม่พร้อม'}
   [Windows.Forms.Clipboard]::SetText($url);$cloud.Text='คัดลอกลิงก์พร้อมรหัสจับคู่แล้ว ส่งให้ทีมที่ได้รับอนุญาตได้'
  }catch{Show-Error $_.Exception.Message}})
  $stop.Add_Click({try{Start-Action 'stop' (Join-Path $appRoot 'scripts/stop-all.ps1')}catch{Show-Error $_.Exception.Message}})
  $tools.Add_Click({$folder=$appRoot;Start-Process explorer.exe -ArgumentList ('"'+$folder+'"')})
  $timer=New-Object Windows.Forms.Timer;$timer.Interval=1500
  $timer.Add_Tick({
   if($state.busy){
    $result=$null
    if(Test-Path -LiteralPath $state.resultFile){try{$result=Get-Content -LiteralPath $state.resultFile -Raw -Encoding UTF8|ConvertFrom-Json}catch{}}
    if(Receive-ITFieldControlResult -State $state -Result $result){
     try{
      if(!$result.success){throw $result.message}
      if($state.operation -eq 'stop'){$cloud.Text='หยุดเซิร์ฟเวอร์และ Cloudflare แล้ว • ตรวจสอบสำเร็จ'}
      else{
       if($state.operation -in @('start','team')){$url=Get-TeamLink;$cloud.Text='พร้อมใช้งาน: '+$url.Split('/')[2]}
       else{$pair=(Get-Content -LiteralPath (Join-Path $appRoot 'data/pair-token') -Raw -Encoding UTF8).Trim();$url='http://localhost:42873/field/index.html#pair='+$pair;$cloud.Text='เปิดเฉพาะในเครื่องนี้แล้ว'}
       Start-Process $url;$state.opened=$true
      }
      $state.readySeen=$true
     }catch{
      if($state.operation -in @('start','team') -and (Get-LocalReady)){
       $cloud.Text='ลิงก์ภายนอกยังไม่พร้อม • เว็บในเครื่องใช้งานได้ • ดูบันทึกในโฟลเดอร์ data'
       if(!$state.opened){try{$pair=(Get-Content -LiteralPath (Join-Path $appRoot 'data/pair-token') -Raw -Encoding UTF8).Trim();Start-Process ('http://localhost:42873/field/index.html#pair='+$pair);$state.opened=$true}catch{Show-Error 'เว็บในเครื่องพร้อม แต่เปิดเบราว์เซอร์ไม่ได้ กรุณาเปิด http://localhost:42873/field/index.html'}}
      }else{$cloud.Text='ทำงานไม่สำเร็จ • ดูบันทึกในโฟลเดอร์ data';Show-Error $_.Exception.Message}
     }
    }elseif($state.job.HasExited){
     $state.job.WaitForExit()
     $state.busy=$false
     $state.readySeen=$true
     $cloud.Text='ยังไม่ได้รับผลยืนยันจากตัวรัน'
     Show-Error ('ตัวรันจบโดยไม่ได้ส่งผลยืนยัน กรุณาดูบันทึก: '+$state.errorLog)
    }
    if(!$state.busy){$start.Enabled=$true;$open.Enabled=$true;$stop.Enabled=$true;$copy.Enabled=$true}
   }
   if(!$state.busy){if(Get-LocalReady){$status.Text='เซิร์ฟเวอร์ในเครื่อง: พร้อมใช้งาน'}else{$status.Text='เซิร์ฟเวอร์ในเครื่อง: หยุดอยู่'}}
   elseif($state.startedAt){$seconds=[int]((Get-Date)-$state.startedAt).TotalSeconds;$status.Text='กำลังทำงาน… '+$seconds+' วินาที • รอผลตรวจสอบ'}
  })
  $form.Add_FormClosed({$timer.Stop();$timer.Dispose()})
  if($VerifyUI){
   $status.Text='เซิร์ฟเวอร์ในเครื่อง: '+$(if(Get-LocalReady){'พร้อมใช้งาน'}else{'หยุดอยู่'})
   $form.Show();$form.Refresh();[Windows.Forms.Application]::DoEvents()
   $bitmap=New-Object Drawing.Bitmap($form.Width,$form.Height);$form.DrawToBitmap($bitmap,$form.ClientRectangle)
   $bitmap.Save((Join-Path $appRoot 'test-results/control-preview.png'),[Drawing.Imaging.ImageFormat]::Png);$bitmap.Dispose();$form.Close()
   Write-Output 'Controller UI constructed and rendered; button workflows require real interaction validation.'
  }else{$timer.Start();[Windows.Forms.Application]::Run($form)}
  $form.Dispose()
 }finally{$mutex.ReleaseMutex();$mutex.Dispose()}
} } catch {
 if($SelfTest -or $VerifyUI){throw}
 Add-Type -AssemblyName System.Windows.Forms
 [Windows.Forms.MessageBox]::Show(('เปิดตัวควบคุมไม่ได้ กรุณาตรวจไดรฟ์และไฟล์โครงการ'+"`r`n"+$_.Exception.Message),'IT Field — ตรวจสอบการเริ่มต้น',[Windows.Forms.MessageBoxButtons]::OK,[Windows.Forms.MessageBoxIcon]::Error)|Out-Null
}
