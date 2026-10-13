$ErrorActionPreference = 'Stop'
$blogRoot = Split-Path $PSScriptRoot -Parent
$hugoPath = Join-Path $blogRoot '.tools/hugo/hugo.exe'
if (-not (Test-Path -LiteralPath $hugoPath)) { $hugoPath = (Get-Command hugo -ErrorAction Stop).Source }
Push-Location $blogRoot
try {
    & $hugoPath server --buildDrafts --disableFastRender
    if ($LASTEXITCODE -ne 0) { throw "Hugo preview failed: $LASTEXITCODE" }
} finally { Pop-Location }
