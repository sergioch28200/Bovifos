# Fotos de producto · Bovifos

| Carpeta / archivo | Qué es | ¿Lo usa la web? |
| ----------------- | ------ | --------------- |
| `bovifos-sal-*-frontal.png` | Sacos **estandarizados**: los cinco parten de la foto de la Sal Sabanera | No (fuente) |
| `web/` | Copias JPEG de 480 y 720 px (40–80 KB) que carga la landing | **Sí** |
| `originales/` | Las imágenes tal como se entregaron, sin modificar | No |
| `CORRECCIONES.md` | Errores de ortografía encontrados y qué se corrigió | — |

| Referencia         | Archivo                                |
| ------------------ | -------------------------------------- |
| Sal Sabanera       | `bovifos-sal-sabanera-frontal.png`     |
| Sal 4% Ceba        | `bovifos-sal-4-ceba-frontal.png`       |
| Sal 6% Levante     | `bovifos-sal-6-levante-frontal.png`    |
| Sal 8% Cría-Leche  | `bovifos-sal-8-cria-leche-frontal.png` |
| Sal 10% Leche      | `bovifos-sal-10-leche-frontal.png`     |

## Cómo se generan

Los scripts están en `herramientas/imagenes/` (ver su README). Si llega una foto nueva de la Sabanera o el logo
oficial, se vuelven a generar los cinco sacos y sus versiones web con dos comandos.

## Si se reemplaza una foto a mano

- Foto real del bulto, vista frontal, etiqueta legible y bulto completo.
- Fondo transparente, mismo encuadre que las demás, 1080 × 1350 px (4:5).
- Después, regenerar las copias de `web/` (el fondo transparente se rellena con `#F6F7F3`, el color de la tarjeta).
