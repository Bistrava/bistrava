Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$renderedCharterPage = Join-Path $projectRoot "tmp\pdfs\charte-page-03.png"
$brandOutput = Join-Path $projectRoot "brand\derived"
$publicOutput = Join-Path $projectRoot "public\brand"
$appOutput = Join-Path $projectRoot "src\app"

if (-not (Test-Path -LiteralPath $renderedCharterPage)) {
  throw "Render the third page of the brand charter before preparing web assets."
}

New-Item -ItemType Directory -Force -Path $brandOutput, $publicOutput | Out-Null

$page = [System.Drawing.Bitmap]::FromFile($renderedCharterPage)
$logo = $null
$icon = $null

try {
  # This is the clean official signature shown in the charter. The source PNG is
  # kept untouched because its checkerboard was flattened into the pixels.
  $logoRect = [System.Drawing.Rectangle]::new(145, 205, 610, 157)
  $logo = $page.Clone($logoRect, $page.PixelFormat)

  # Normalize only the pale presentation background and border. Brand-colored
  # pixels are left unchanged.
  $surface = [System.Drawing.Color]::FromArgb(255, 248, 251, 251)
  for ($y = 0; $y -lt $logo.Height; $y++) {
    for ($x = 0; $x -lt $logo.Width; $x++) {
      $pixel = $logo.GetPixel($x, $y)
      if ($pixel.R -ge 210 -and $pixel.G -ge 220 -and $pixel.B -ge 220) {
        $logo.SetPixel($x, $y, $surface)
      }
    }
  }

  $logoPath = Join-Path $brandOutput "bistrava-logo-web.png"
  $publicLogoPath = Join-Path $publicOutput "bistrava-logo-web.png"
  $logo.Save($logoPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $logo.Save($publicLogoPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $iconRect = [System.Drawing.Rectangle]::new(0, 0, 170, 157)
  $icon = $logo.Clone($iconRect, $logo.PixelFormat)
  $iconPath = Join-Path $brandOutput "bistrava-icon-web.png"
  $publicIconPath = Join-Path $publicOutput "bistrava-icon-web.png"
  $icon.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $icon.Save($publicIconPath, [System.Drawing.Imaging.ImageFormat]::Png)

  Copy-Item -LiteralPath $iconPath -Destination (Join-Path $appOutput "icon.png") -Force
  Copy-Item -LiteralPath $iconPath -Destination (Join-Path $appOutput "apple-icon.png") -Force
  Copy-Item -LiteralPath $logoPath -Destination (Join-Path $appOutput "opengraph-image.png") -Force
}
finally {
  if ($null -ne $icon) { $icon.Dispose() }
  if ($null -ne $logo) { $logo.Dispose() }
  $page.Dispose()
}
