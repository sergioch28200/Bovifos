# Crea copias JPEG ligeras para la web a partir de los PNG originales de producto.
# El fondo transparente se rellena con el mismo color del recuadro de la tarjeta.
param([string]$Origen, [string]$Destino, [int[]]$Anchos = @(480, 720), [long]$Calidad = 82, [string]$Fondo = "#F6F7F3")
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $Destino | Out-Null

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $Calidad
$color = [System.Drawing.ColorTranslator]::FromHtml($Fondo)

Get-ChildItem $Origen -Filter *.png | ForEach-Object {
  $src = [System.Drawing.Image]::FromFile($_.FullName)
  foreach ($w in $Anchos) {
    $h = [int][Math]::Round($src.Height * $w / $src.Width)
    $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear($color)
    $g.DrawImage($src, 0, 0, $w, $h)
    $out = Join-Path $Destino ($_.BaseName + "-$w.jpg")
    $bmp.Save($out, $codec, $params)
    $g.Dispose(); $bmp.Dispose()
    "{0,-48} {1}x{2} {3,6:N0} KB" -f (Split-Path $out -Leaf), $w, $h, ((Get-Item $out).Length / 1KB)
  }
  $src.Dispose()
}
