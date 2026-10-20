# Fotos de producto · Bovifos

Coloca aquí la foto frontal de cada bulto, en PNG, con **exactamente** estos nombres:

| Referencia         | Archivo                              |
| ------------------ | ------------------------------------ |
| Sal Sabanera       | `bovifos-sal-sabanera-frontal.png`   |
| Sal 4% Ceba        | `bovifos-sal-4-ceba-frontal.png`     |
| Sal 6% Levante     | `bovifos-sal-6-levante-frontal.png`  |
| Sal 8% Cría-Leche  | `bovifos-sal-8-cria-leche-frontal.png` |
| Sal 10% Leche      | `bovifos-sal-10-leche-frontal.png`   |

## Cómo deben ser las fotos

- **Foto real del bulto**, sin alterar logotipo, nombre, porcentajes ni textos del empaque.
- **Vista frontal**, con la etiqueta legible y el bulto completo (sin recortes).
- **Fondo transparente o blanco liso**, para que todas las tarjetas se vean iguales.
- **Mismo encuadre en las cinco**: el bulto ocupando casi todo el alto, centrado y con la misma escala.
- **Tamaño recomendado:** 1200 × 1500 px (proporción 4:5), idealmente menos de 400 KB por archivo.

La web muestra cada foto completa (`object-fit: contain`), así que no se deforma ni se recorta.

## Versiones para la web (`web/`)

Los PNG de esta carpeta son los **originales** y no se cargan en la página (pesan unos 2 MB cada uno).
La landing usa las copias de `web/`: JPEG de 480 × 600 y 720 × 900 px (40–80 KB), con el fondo
transparente rellenado en `#F6F7F3`, el mismo color del recuadro de la tarjeta.

Si cambias o añades una foto, vuelve a generar sus dos copias con esos tamaños y nombres
(`bovifos-sal-6-levante-frontal-480.jpg` y `bovifos-sal-6-levante-frontal-720.jpg`).
