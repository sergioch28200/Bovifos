# Recorta el margen transparente del logo y crea versiones cuadradas ligeras para la web.
param([string]$Origen = ".\assets\img\marca\bovifos-logo.png", [string]$Destino = ".\assets\img\marca\web")
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $Destino | Out-Null

$src = New-Object System.Drawing.Bitmap ((Resolve-Path $Origen).Path)
# caja del contenido visible (alfa > 10)
$x0 = $src.Width; $y0 = $src.Height; $x1 = 0; $y1 = 0
for ($y = 0; $y -lt $src.Height; $y += 2) { for ($x = 0; $x -lt $src.Width; $x += 2) {
  if ($src.GetPixel($x, $y).A -gt 10) { if ($x -lt $x0) { $x0 = $x }; if ($y -lt $y0) { $y0 = $y }; if ($x -gt $x1) { $x1 = $x }; if ($y -gt $y1) { $y1 = $y } }
} }
$lado = [Math]::Max($x1 - $x0, $y1 - $y0) + 8
$cx = ($x0 + $x1) / 2; $cy = ($y0 + $y1) / 2
$rect = New-Object System.Drawing.RectangleF ($cx - $lado / 2), ($cy - $lado / 2), $lado, $lado
"contenido: x $x0-$x1, y $y0-$y1 -> cuadrado de $lado px"

foreach ($t in 512, 192, 180, 96, 32) {
  $b = New-Object System.Drawing.Bitmap $t, $t, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($src, (New-Object System.Drawing.RectangleF 0, 0, $t, $t), $rect, [System.Drawing.GraphicsUnit]::Pixel)
  $out = Join-Path $Destino "bovifos-logo-$t.png"
  $b.Save($out, [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $b.Dispose()
  "{0,-24} {1,6:N1} KB" -f (Split-Path $out -Leaf), ((Get-Item $out).Length / 1KB)
}
$src.Dispose()
