# Flowvo PDF Generator Utility
# Renders docs/handbook_print.html to docs/FLOWVO_SYSTEM_ARCHITECTURE_AND_HANDOVER_HANDBOOK.pdf using headless Chromium/Edge

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outPdf = Join-Path $PSScriptRoot "FLOWVO_SYSTEM_ARCHITECTURE_AND_HANDOVER_HANDBOOK.pdf"
$inHtml = "file:///" + (Join-Path $PSScriptRoot "handbook_print.html").Replace("\", "/")

Write-Host "Rendering $inHtml to $outPdf..."
node -e "const { execFileSync } = require('child_process'); execFileSync('$($edgePath.Replace('\', '\\'))', ['--headless', '--disable-gpu', '--no-pdf-header-footer', '--print-to-pdf=$($outPdf.Replace('\', '\\'))', '$inHtml']);"

if (Test-Path $outPdf) {
    $size = (Get-Item $outPdf).Length
    Write-Host "SUCCESS: Generated PDF ($size bytes) at $outPdf"
} else {
    Write-Error "Failed to generate PDF"
}
