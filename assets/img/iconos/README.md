# Íconos · Versión Control mosca y garrapata

| Archivo | Qué es |
| ------- | ------ |
| `control-mosca.svg` | Mosca con círculo rojo de prohibición. **Provisional** |
| `control-garrapata.svg` | Garrapata con círculo rojo de prohibición. **Provisional** |

La web los muestra en tres sitios: la franja al inicio del catálogo, la insignia sobre la foto de cada
bulto y la fila «Control mosca y garrapata» de cada tarjeta. Son decorativos (el texto siempre los
acompaña), así que se cargan desde `styles.css`:

```css
.ico--mosca     { background-image: url("assets/img/iconos/control-mosca.svg"); }
.ico--garrapata { background-image: url("assets/img/iconos/control-garrapata.svg"); }
```

## Cambiarlos por los íconos oficiales

1. Copiar aquí los archivos oficiales. Lo ideal: SVG, o PNG **cuadrado con fondo transparente**
   de al menos 192 × 192 px, con el dibujo centrado y sin margen sobrante.
2. Si el nombre o la extensión cambian (por ejemplo `control-mosca.png`), actualizar las dos
   rutas de arriba en `styles.css`. No hay que tocar `index.html`.
3. Borrar los SVG provisionales.
