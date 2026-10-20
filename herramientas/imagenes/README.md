# Herramientas de imagen · Bovifos

Scripts para regenerar las fotos de producto (Windows PowerShell 5.1, sin instalar nada).

## 1. Generar los cinco sacos desde la Sal Sabanera

Toma `assets/img/productos/originales/bovifos-sal-sabanera-frontal.png` como base y crea las cinco referencias
con la misma estructura: cambia el color de las bandas laterales, el texto lateral (`BOVIFOS 4%`…), el nombre
bajo el panel amarillo y corrige `40Kg` → `40kg`. Conserva la trama tejida del saco.

Con `-Logo`, además reemplaza el emblema por el logotipo oficial (escalado al círculo del saco, con la tinta
y la trama del tejido):

```
powershell -NoProfile -ExecutionPolicy Bypass -File .\herramientas\imagenes\generar.ps1 -Base .\assets\img\productos\originales\bovifos-sal-sabanera-frontal.png -Logo .\assets\img\marca\bovifos-logo.png -Destino .\assets\img\productos
```

Si se cambia el logo, regenerar también los íconos de la web con `logo-web.ps1`.

Los colores de banda y los textos de cada referencia están al inicio de `generar.ps1`.

## 2. Versiones ligeras para la web

```
powershell -NoProfile -ExecutionPolicy Bypass -File .\herramientas\imagenes\redimensionar.ps1 -Origen .\assets\img\productos -Destino .\assets\img\productos\web
```

Crea los JPEG de 480 y 720 px que usa la landing.

## Archivos

- `Saco.cs`: carga, guarda y analiza píxeles (máscaras por color, perfiles).
- `Procesador.cs`: recolorear, borrar texto conservando la trama y escribir texto nuevo.
- `generar.ps1` / `redimensionar.ps1`: los dos pasos de arriba.
