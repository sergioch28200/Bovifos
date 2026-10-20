# Genera los cinco sacos con la estructura de la Sal Sabanera.
param([string]$Base, [string]$Destino)
$s = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -Path "$s\Saco.cs", "$s\Procesador.cs" -ReferencedAssemblies System.Drawing
New-Item -ItemType Directory -Force $Destino | Out-Null
function Rc($x, $y, $w, $h) { New-Object System.Drawing.Rectangle $x, $y, $w, $h }

$normal = [System.Drawing.FontStyle]::Regular

# Referencias: color de banda (HSL medido en cada saco original) y textos
$refs = @(
  @{ id = "sabanera";     banda = $null;               lateral = $null; nombre = $null },
  @{ id = "4-ceba";       banda = @(54.8, 0.87, 0.56);  lateral = "4%";  nombre = "4% CEBA" },
  @{ id = "6-levante";    banda = @(198.5, 0.87, 0.44); lateral = "6%";  nombre = "6% LEVANTE" },
  @{ id = "8-cria-leche"; banda = @(84.3, 0.62, 0.52);  lateral = "8%";  nombre = "8% CRÍA-LECHE" },
  @{ id = "10-leche";     banda = @(2.8, 0.72, 0.48);   lateral = "10%"; nombre = "10% LECHE" }
)

$orig = [Lienzo]::Cargar($Base)
$verde = [Procesador]::ColorTexto($orig, (Rc 400 1040 290 55))
"verde de impresión: {0:N3} {1:N3} {2:N3}" -f $verde[0], $verde[1], $verde[2]

foreach ($r in $refs) {
  $c = $orig.Copia()
  $t = [Procesador]::Trama($c, 5)

  # 1. Peso neto: "40Kg" -> "40kg" (símbolo correcto del kilogramo, en minúscula)
  # (el "0" termina en x=763 y la "K" empieza en x=766; no tocar el "0")
  [void][Procesador]::Borrar($c, $t, (Rc 765 966 22 52), -300, 130, 2, 0.72)
  [void][Procesador]::Escribir($c, $t, "kg", "Bahnschrift SemiBold Condensed", $normal, 767, 1007, 0, 24, 0.62, 19, $verde[0], $verde[1], $verde[2], -300, 130)

  if ($r.banda) {
    # 2. Borrar "SABANERA" de las bandas laterales (antes de recolorear, sobre el naranja original)
    # (zona ajustada al renglón grande para no tocar "SAL MINERALIZADA")
    [void][Procesador]::Borrar($c, $t, (Rc 254 596 29 226), 0, 280, 2, 1.0)
    [void][Procesador]::Borrar($c, $t, (Rc 807 474 25 224), 0, -222, 2, 1.0)

    # 3. Color de las bandas laterales
    [void][Procesador]::Recolorear($c, @((Rc 200 240 125 900), (Rc 765 240 110 900)), 5, 45, 0.12, 22.5, 0.76, 0.54, $r.banda[0], $r.banda[1], $r.banda[2])

    # 4. Texto lateral nuevo: "BOVIFOS 4%"
    $vl = @(($verde[0] * 1.35), ($verde[1] * 1.35), ($verde[2] * 1.35))   # la tinta sobre la banda se ve más clara
    [void][Procesador]::Escribir($c, $t, $r.lateral, "Arial Black", $normal, 258, 607, 90, 21, 1.0, 0, $vl[0], $vl[1], $vl[2], 0, 280)
    [void][Procesador]::Escribir($c, $t, $r.lateral, "Arial Black", $normal, 826, 690, -90, 14, 1.45, 0, $vl[0], $vl[1], $vl[2], 0, -225)

    # 4. Nombre de la referencia bajo el panel amarillo
    [void][Procesador]::Borrar($c, $t, (Rc 392 1032 306 68), 0, 60, 4, 0.72)
    [void][Procesador]::Escribir($c, $t, $r.nombre, "Segoe UI Semibold", $normal, 403, 1088, 0, 43, 1.0, 300, $verde[0], $verde[1], $verde[2], 0, 60)
  }

  $out = Join-Path $Destino "bovifos-sal-$($r.id)-frontal.png"
  $c.Guardar($out)
  "listo: $out"
}
