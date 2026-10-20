# Logotipo · Bovifos

Coloca aquí el archivo **original** del logotipo (el que usa la marca en sus empaques y documentos).

| Archivo                     | Qué es                                            | Necesario    |
| --------------------------- | ------------------------------------------------- | ------------ |
| `bovifos-logo.svg`          | Logo en vector (de Illustrator, Corel, Figma…)    | Ideal        |
| `bovifos-logo.png`          | Si no hay vector: PNG con fondo transparente, mínimo 1000 px de ancho | Si no hay SVG |
| `bovifos-logo-blanco.svg`   | Versión en blanco para fondos verdes (opcional)   | Opcional     |

## Recomendaciones

- Usa el archivo de diseño original, no una captura ni una foto del saco.
- Si solo existe en PDF, AI o EPS, ponlo aquí tal cual: se puede exportar a SVG.
- Fondo transparente, sin bordes ni márgenes grandes alrededor.

## Estado actual (20 de octubre de 2026)

- `bovifos-logo.png` (1080 × 1350, fondo transparente) es el que usa la web: `web/` tiene copias recortadas
  de 32, 96, 180, 192 y 512 px, generadas con `herramientas/imagenes/logo-web.ps1`.
- `bovifos-logo.svg` **no es vectorial**: contiene la misma imagen PNG incrustada. Si existe el archivo
  original en AI, PDF, EPS o CorelDRAW, conviene ponerlo aquí.
- El logo dice “COMPAÑIA ZOOTECNICA”, sin tildes: ver `../productos/CORRECCIONES.md`.

## Dónde se usa

- Encabezado y pie de página de la landing.
- Ícono de la pestaña del navegador (favicon) y la imagen que aparece al compartir el enlace.
- Como referencia para comprobar el emblema de los sacos en `../productos/`.
