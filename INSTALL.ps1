#Requires -Version 5.1
param([string]$Scheme = "Clair-Dark")

$ErrorActionPreference = "Stop"
$ThemeName = "Clair-SpicyTheme"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$dest = Join-Path $env:APPDATA "spicetify\Themes\$ThemeName"

if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) {
  Write-Host "Spicetify is not installed. See https://spicetify.app/docs/getting-started" -ForegroundColor Yellow
  exit 1
}

spicetify backup

if (Test-Path $dest) {
  Move-Item -LiteralPath $dest -Destination "$dest.bak-$(Get-Date -Format yyyyMMdd-HHmmss)" -Force
}
New-Item -ItemType Directory -Path $dest -Force | Out-Null
"color.ini", "user.css", "theme.js" | ForEach-Object {
  Copy-Item -LiteralPath (Join-Path $RepoRoot $_) -Destination $dest -Force
}

spicetify config current_theme $ThemeName color_scheme $Scheme inject_css 1 replace_colors 1 overwrite_assets 1 inject_theme_js 1
spicetify apply

Write-Host "$ThemeName ($Scheme) installed. Open settings with the gear button next to your avatar." -ForegroundColor Cyan
