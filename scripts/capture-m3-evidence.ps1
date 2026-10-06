# M3 evidence capture — re-runnable. Writes UTF-8 raw logs to docs/m3/evidence/.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/capture-m3-evidence.ps1
$ErrorActionPreference = 'Continue'
$outDir = Join-Path $PSScriptRoot '..\docs\m3\evidence'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Capture([string]$name, [scriptblock]$block) {
  Write-Host "==> $name"
  $text = & $block 2>&1 | Out-String
  $path = Join-Path $outDir "$name.log"
  [System.IO.File]::WriteAllText($path, $text, [System.Text.UTF8Encoding]::new($false))
  Write-Host "    wrote $name.log ($($text.Length) chars)"
}

Capture 'build'      { npm run build }
Capture 'lint'       { npm run lint }
Capture 'canonical'  { npm run test:canonical }
Capture 'golden'     { npm run test:golden }
Capture 'security'   { npm run test:security }
Capture 'ai'         { npm run test:ai }
Capture 'report'     { npm run test:report }
Capture 'rls'        { npm run test:rls }
Capture 'e2e'        { npm run test:e2e }

$stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
[System.IO.File]::WriteAllText(
  (Join-Path $outDir 'capture-stamp.txt'),
  "Captured (UTC): $stamp`r`nNode: $(node -v)`r`nCommit: $(git rev-parse HEAD)`r`n",
  [System.Text.UTF8Encoding]::new($false))
Write-Host "==> done. stamp $stamp"
