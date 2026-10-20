# Correcciones de los empaques · Bovifos

Revisión de las cinco imágenes de `assets/img/productos/` (20 de octubre de 2026).

## Referencia de estructura: Sal Sabanera

Es la imagen más realista y la única con todo el texto bien escrito. Estructura que deberían seguir las demás:

1. Lema superior: **Precisión en Nutrición Animal**
2. Emblema circular: **BOVIFOS** · **COMPAÑÍA ZOOTÉCNICA DE COLOMBIA** (siempre el mismo dibujo).
3. Panel amarillo central: **SAL MINERALIZADA** / **BOVIFOS**
4. Peso: **PESO NETO AL EMPACAR 40 kg**
5. Nombre de la referencia bajo el panel (en la Sabanera: **SABANERA**).
6. Bandas laterales del color de la referencia con **SAL MINERALIZADA** / **BOVIFOS [REFERENCIA]**.

| Referencia      | Color de banda (identifica la referencia) |
| --------------- | ----------------------------------------- |
| Sabanera        | Naranja                                   |
| 4% Ceba         | Amarillo                                  |
| 6% Levante      | Azul                                      |
| 8% Cría-Leche   | Verde lima                                |
| 10% Leche       | Rojo                                      |

## Qué se corrigió en las imágenes de la web

Los cinco sacos de esta carpeta se generaron a partir de la foto de la Sabanera. Por eso **todos los errores
de la tabla de abajo desaparecen**: emblema, lema y panel son los de la Sabanera (bien escritos), cada saco
lleva `PESO NETO AL EMPACAR 40kg` y su nombre (`4% CEBA`, `6% LEVANTE`, `8% CRÍA-LECHE`, `10% LECHE`).
Se cambió `40Kg` por `40kg`: el símbolo del kilogramo va en minúscula. No hubo espacio para separarlo del número.

**Emblema:** por decisión de Bovifos (20 de octubre de 2026), los cinco sacos llevan el **logotipo oficial**
(`../marca/bovifos-logo.png`) en lugar del emblema que traía la foto de la Sabanera.

El logo oficial dice **COMPAÑIA ZOOTECNICA DE COLOMBIA**, sin tildes. Bovifos decidió mantenerlo así
(20 de octubre de 2026). Si algún día cambia, basta con reemplazar `../marca/bovifos-logo.png` y volver a
ejecutar `herramientas/imagenes/generar.ps1` con `-Logo` y `logo-web.ps1`.

## Errores encontrados en las imágenes originales (`originales/`)

| Saco | Dónde | Dice | Debe decir |
| ---- | ----- | ---- | ---------- |
| Sabanera | Peso neto | 40Kg | 40 kg |
| 4% Ceba | Peso neto | (no aparece) | PESO NETO AL EMPACAR 40 kg |
| 6% Levante | Emblema | COMPAÑIA ZOOTECNICA | COMPAÑÍA ZOOTÉCNICA |
| 6% Levante | Peso neto | (no aparece) | PESO NETO AL EMPACAR 40 kg |
| 8% Cría-Leche | Emblema | COMPANIA ZOOTECNICA | COMPAÑÍA ZOOTÉCNICA |
| 8% Cría-Leche | Banda izquierda | SAL MINERALIZANA | SAL MINERALIZADA |
| 8% Cría-Leche | Ambas bandas | “8%” deformado | 8% |
| 8% Cría-Leche | Nombre | CRÍA- LECHE | CRÍA-LECHE |
| 8% Cría-Leche | Peso neto | 40 KG | 40 kg |
| 10% Leche | Lema | Precisión en Nutricion Animal | Precisión en Nutrición Animal |
| 10% Leche | Emblema | COMPAÑÍA ZOOTECNICA | COMPAÑÍA ZOOTÉCNICA |
| 10% Leche | Banda derecha | texto cortado y deformado | SAL MINERALIZADA / BOVIFOS 10% |
| 10% Leche | Peso neto | 40 KG | 40 kg |

## Otras diferencias

- **El emblema cambia en cada saco:** las siluetas de las cuatro reses no son iguales entre imágenes. Debe usarse
  siempre el logotipo oficial (ver `../marca/`).
- El 8% repite “COMPAÑÍA ZOOTÉCNICA DE COLOMBIA” en la parte inferior; los demás no lo llevan.
- Forma, arrugas y luz del saco son distintas en cada imagen (la del 10% es más ancha y brillante).

## Importante

Si los bultos impresos tienen estos mismos errores, corregirlos solo en la web haría que la foto no coincida con el
producto que recibe el cliente. Lo ideal es corregir también el arte del empaque para la próxima impresión.
