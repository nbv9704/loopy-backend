param(
  [string]$Url = "https://coddy.tech/",
  [int]$Port = 9222
)

$ErrorActionPreference = "Stop"

$candidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
  "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
)

$browser = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $browser) {
  throw "Chrome or Edge was not found. Install one of them before using this tool."
}

$profileDir = Join-Path $env:TEMP "loopy-capture-browser-$Port"

if (-not (Test-Path -LiteralPath $profileDir)) {
  New-Item -ItemType Directory -Path $profileDir | Out-Null
}

$args = @(
  "--remote-debugging-port=$Port",
  "--user-data-dir=$profileDir",
  "--no-first-run",
  "--new-window",
  $Url
)

Start-Process -FilePath $browser -ArgumentList $args

"Capture browser opened on port $Port. Navigate to the target page, then run: node tools/browser-capture/capture-current-page.mjs"
