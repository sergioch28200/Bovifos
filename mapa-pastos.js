// Mapa interactivo de análisis de pastos (sección "Análisis con dron").
// Todo lo que muestra sale de esta configuración: es una FINCA DE EJEMPLO con valores
// ilustrativos. Para cambiar potreros, valores o parámetros, editar CAPAS y POTREROS.

// Parámetros del mapa. "colores" es una escala de un solo tono, de menor a mayor valor.
// "deseable" indica si conviene un valor alto ("alto") o bajo ("bajo") para orientar la lectura.
const CAPAS = {
  pc: {
    nombre: "Proteína cruda", unidad: "%", min: 6, max: 15, decimales: 1, deseable: "alto",
    alerta: "proteína más baja",
    colores: ["#3b4f2c", "#4f7a35", "#6fa33f", "#a3c95a", "#dcef93"],
  },
  fdn: {
    nombre: "Fibra (FDN)", unidad: "%", min: 50, max: 72, decimales: 1, deseable: "bajo",
    alerta: "fibra más alta",
    colores: ["#4d3a1f", "#7a5626", "#a8782f", "#d3a24a", "#f3d488"],
  },
  p: {
    nombre: "Fósforo", unidad: "%", min: 0.12, max: 0.36, decimales: 2, deseable: "alto",
    alerta: "fósforo más bajo",
    colores: ["#1f4650", "#246b72", "#2f9294", "#5fbdb5", "#ade6da"],
  },
  ca: {
    nombre: "Calcio", unidad: "%", min: 0.25, max: 0.6, decimales: 2, deseable: "alto",
    alerta: "calcio más bajo",
    colores: ["#3a3155", "#55477f", "#7863a9", "#a28ed0", "#d6cbf0"],
  },
};

// Potreros de la finca de ejemplo: contorno en el mapa (viewBox 800 × 540), número,
// área, pasto y valor promedio de cada parámetro. "giro" orienta la variación interna.
const POTREROS = [
  { id: 1, nombre: "La Loma", area: 8.4, pasto: "Brachiaria decumbens", giro: 30,
    puntos: [[46, 34], [282, 26], [270, 234], [40, 238]], etiqueta: [160, 132],
    valores: { pc: 7.8, fdn: 68.4, p: 0.17, ca: 0.33 } },
  { id: 2, nombre: "El Bajo", area: 7.6, pasto: "Pasto estrella", giro: 160,
    puntos: [[294, 26], [514, 38], [506, 232], [282, 234]], etiqueta: [398, 132],
    valores: { pc: 12.6, fdn: 58.1, p: 0.29, ca: 0.49 } },
  { id: 3, nombre: "La Ceiba", area: 8.1, pasto: "Brachiaria brizantha", giro: 250,
    puntos: [[526, 40], [742, 54], [734, 226], [518, 232]], etiqueta: [630, 138],
    valores: { pc: 10.2, fdn: 63.0, p: 0.22, ca: 0.41 } },
  { id: 4, nombre: "El Mango", area: 9.2, pasto: "Guinea Mombasa", giro: 90,
    puntos: [[44, 270], [286, 266], [300, 484], [48, 490]], etiqueta: [170, 378],
    valores: { pc: 13.4, fdn: 56.2, p: 0.31, ca: 0.53 } },
  { id: 5, nombre: "La Esperanza", area: 8.0, pasto: "Brachiaria decumbens", giro: 320,
    puntos: [[298, 266], [520, 262], [534, 478], [312, 484]], etiqueta: [416, 374],
    valores: { pc: 8.9, fdn: 66.0, p: 0.19, ca: 0.36 } },
  { id: 6, nombre: "El Guamo", area: 7.9, pasto: "Angleton", giro: 200,
    puntos: [[532, 262], [740, 258], [746, 472], [546, 478]], etiqueta: [641, 368],
    valores: { pc: 11.3, fdn: 60.7, p: 0.25, ca: 0.45 } },
];

const mapaRaiz = document.getElementById("mapa-pastos");
if (mapaRaiz) iniciarMapa(mapaRaiz);

function iniciarMapa(raiz) {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const VISTA_COMPLETA = [0, 0, 800, 540];
  const CELDA = 12;   // tamaño de cada sector del mapa de colores
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const svg = raiz.querySelector(".mapa__svg");
  const capaPotreros = svg.querySelector(".mapa__potreros");
  const panel = raiz.querySelector(".mapa__panel");
  const estado = document.getElementById("mapa-estado");
  const botonesCapa = [...raiz.querySelectorAll(".mapa__capas [data-capa]")];
  const leyenda = {
    titulo: raiz.querySelector(".leyenda__titulo"),
    min: raiz.querySelector(".leyenda__min"),
    max: raiz.querySelector(".leyenda__max"),
    barra: raiz.querySelector(".leyenda__barra"),
  };

  const estadoMapa = { capa: "pc", fijo: null, vista: null };
  const claves = Object.keys(CAPAS);

  // ---------- utilidades ----------
  const fmt = (n, d) => n.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtCapa = (clave, v) => `${fmt(v, CAPAS[clave].decimales)} ${CAPAS[clave].unidad}`;
  const porcentaje = (clave, v) => {
    const c = CAPAS[clave];
    return Math.min(100, Math.max(0, ((v - c.min) / (c.max - c.min)) * 100));
  };
  const gradiente = (clave) => `linear-gradient(90deg, ${CAPAS[clave].colores.join(", ")})`;
  const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const rampas = Object.fromEntries(claves.map((k) => [k, CAPAS[k].colores.map(hexRgb)]));

  const color = (clave, v) => {
    const pasos = rampas[clave];
    const t = (porcentaje(clave, v) / 100) * (pasos.length - 1);
    const i = Math.min(pasos.length - 2, Math.floor(t));
    const f = t - i;
    const rgb = pasos[i].map((c, j) => Math.round(c + (pasos[i + 1][j] - c) * f));
    return `rgb(${rgb.join(",")})`;
  };

  // generador pseudoaleatorio con semilla: el mapa sale igual en cada visita
  const azar = (semilla) => () => {
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const dentro = ([x, y], puntos) => {
    let adentro = false;
    for (let i = 0, j = puntos.length - 1; i < puntos.length; j = i++) {
      const [xi, yi] = puntos[i];
      const [xj, yj] = puntos[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) adentro = !adentro;
    }
    return adentro;
  };

  const el = (nombre, atributos = {}) => {
    const nodo = document.createElementNS(SVG_NS, nombre);
    Object.entries(atributos).forEach(([k, v]) => nodo.setAttribute(k, v));
    return nodo;
  };

  // ---------- datos derivados ----------
  const areaTotal = POTREROS.reduce((s, p) => s + p.area, 0);
  const promedio = Object.fromEntries(
    claves.map((k) => [k, POTREROS.reduce((s, p) => s + p.valores[k] * p.area, 0) / areaTotal])
  );
  const extremos = Object.fromEntries(
    claves.map((k) => {
      const v = POTREROS.map((p) => p.valores[k]);
      return [k, [Math.min(...v), Math.max(...v)]];
    })
  );

  // ---------- dibujo de potreros: malla de sectores con variación interna ----------
  const defs = svg.querySelector("defs");
  const sectores = [];   // { rect, valores }

  POTREROS.forEach((pot) => {
    const xs = pot.puntos.map((p) => p[0]);
    const ys = pot.puntos.map((p) => p[1]);
    const caja = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    pot.caja = caja;
    const puntosTxt = pot.puntos.map((p) => p.join(",")).join(" ");

    const clip = el("clipPath", { id: `clip-potrero-${pot.id}` });
    clip.append(el("polygon", { points: puntosTxt }));
    defs.append(clip);

    const grupo = el("g", {
      class: "potrero", "data-id": pot.id, tabindex: "0", role: "button", "aria-pressed": "false",
      "aria-label": `Potrero ${pot.id}, ${pot.nombre}, ${fmt(pot.area, 1)} hectáreas`,
    });
    const celdas = el("g", { class: "potrero__celdas", "clip-path": `url(#clip-potrero-${pot.id})` });

    // ruido suave: valores al azar en una rejilla gruesa, interpolados
    const rnd = azar(pot.id * 977);
    const cols = Math.ceil((caja.x1 - caja.x0) / CELDA) + 1;
    const filas = Math.ceil((caja.y1 - caja.y0) / CELDA) + 1;
    const PASO_RUIDO = 4;
    const lado = Math.ceil(Math.max(cols, filas) / PASO_RUIDO) + 4;
    const red = Array.from({ length: lado }, () => Array.from({ length: lado }, () => rnd() * 2 - 1));
    const ruido = (c, f) => {
      const gx = c / PASO_RUIDO, gy = f / PASO_RUIDO;
      const x0 = Math.floor(gx), y0 = Math.floor(gy), tx = gx - x0, ty = gy - y0;
      const a = red[y0][x0] * (1 - tx) + red[y0][x0 + 1] * tx;
      const b = red[y0 + 1][x0] * (1 - tx) + red[y0 + 1][x0 + 1] * tx;
      return a * (1 - ty) + b * ty;
    };
    const ang = (pot.giro * Math.PI) / 180;
    const cx = (caja.x0 + caja.x1) / 2, cy = (caja.y0 + caja.y1) / 2;
    const radio = Math.hypot(caja.x1 - caja.x0, caja.y1 - caja.y0) / 2;

    const crudos = [];
    for (let f = 0; f < filas; f++) {
      for (let c = 0; c < cols; c++) {
        const x = caja.x0 + c * CELDA, y = caja.y0 + f * CELDA;
        const esquinas = [[x, y], [x + CELDA, y], [x, y + CELDA], [x + CELDA, y + CELDA], [x + CELDA / 2, y + CELDA / 2]];
        if (!esquinas.some((p) => dentro(p, pot.puntos))) continue;
        const tendencia = ((x + CELDA / 2 - cx) * Math.cos(ang) + (y + CELDA / 2 - cy) * Math.sin(ang)) / radio;
        crudos.push({ x, y, base: 0.55 * tendencia + 0.45 * ruido(c, f), extra: ruido(c + 5, f + 3), centro: dentro(esquinas[4], pot.puntos) });
      }
    }
    // centrar la variación para que el promedio del potrero sea su valor declarado
    const media = crudos.reduce((s, k) => s + k.base, 0) / crudos.length;
    pot.rango = Object.fromEntries(claves.map((k) => [k, [Infinity, -Infinity]]));

    crudos.forEach((k) => {
      const valores = {};
      claves.forEach((clave) => {
        const capa = CAPAS[clave];
        const amplitud = 0.16 * (capa.max - capa.min);
        const signo = capa.deseable === "bajo" ? -1 : 1;
        const v = pot.valores[clave] + amplitud * (signo * (k.base - media) * 0.85 + k.extra * 0.3);
        valores[clave] = Math.min(capa.max, Math.max(capa.min, v));
        if (k.centro) {
          pot.rango[clave][0] = Math.min(pot.rango[clave][0], valores[clave]);
          pot.rango[clave][1] = Math.max(pot.rango[clave][1], valores[clave]);
        }
      });
      const rect = el("rect", { x: k.x, y: k.y, width: CELDA + 0.5, height: CELDA + 0.5 });
      celdas.append(rect);
      sectores.push({ rect, valores });
    });

    const borde = el("polygon", { class: "potrero__borde", points: puntosTxt });
    const num = el("g", { class: "potrero__num", transform: `translate(${pot.etiqueta.join(" ")})` });
    const circulo = el("circle", { r: "19" });
    const texto = el("text");
    texto.textContent = pot.id;
    num.append(circulo, texto);
    grupo.append(celdas, borde, num);
    capaPotreros.append(grupo);
    pot.grupo = grupo;
  });

  // ---------- panel: se construye una vez y luego solo se actualiza ----------
  panel.innerHTML = `
    <div class="panel__contenido">
      <div class="panel__head">
        <div>
          <p class="panel__kicker"></p>
          <h3 class="panel__titulo"></h3>
          <p class="panel__meta"></p>
        </div>
        <button type="button" class="panel__volver" hidden>← Vista general</button>
      </div>
      <div>
        <p class="panel__subtitulo panel__sub-ind"></p>
        <ul class="indicadores">
          ${claves.map((k) => `
            <li><button type="button" class="indicador" data-capa="${k}" aria-pressed="false">
              <span class="indicador__nombre">${CAPAS[k].nombre}</span>
              <span class="indicador__valor"></span>
              <span class="indicador__pista" style="background:${gradiente(k)}" aria-hidden="true">
                <span class="indicador__rango"></span><span class="indicador__punto"></span>
              </span>
              <span class="indicador__nivel"></span>
            </button></li>`).join("")}
        </ul>
      </div>
      <p class="panel__orientacion"></p>
    </div>`;

  // gráfico comparativo: debajo del mapa en escritorio y después del panel en móvil
  const comparar = raiz.querySelector(".mapa__comparar");
  comparar.innerHTML = `
    <p class="panel__subtitulo panel__sub-barras"></p>
    <ul class="barras">
      ${POTREROS.map((p) => `
        <li><button type="button" class="barra" data-id="${p.id}" aria-pressed="false">
          <span class="barra__nombre"><span class="barra__muestra" aria-hidden="true"></span>${p.id} · ${p.nombre}</span>
          <span class="barra__pista" aria-hidden="true"><span class="barra__relleno"></span></span>
          <span class="barra__valor"></span>
        </button></li>`).join("")}
    </ul>
    <p class="barras__eje"></p>`;

  const $ = (sel) => raiz.querySelector(sel);
  const ref = {
    contenido: $(".panel__contenido"),
    kicker: $(".panel__kicker"), titulo: $(".panel__titulo"), meta: $(".panel__meta"), volver: $(".panel__volver"),
    subInd: $(".panel__sub-ind"), subBarras: $(".panel__sub-barras"), eje: $(".barras__eje"), orientacion: $(".panel__orientacion"),
    indicadores: [...panel.querySelectorAll(".indicador")],
    barras: [...comparar.querySelectorAll(".barra")],
  };

  // ---------- actualización ----------
  const potrero = (id) => POTREROS.find((p) => p.id === id) || null;

  const nivel = (clave, v) => {
    const rel = (v - promedio[clave]) / promedio[clave];
    if (Math.abs(rel) < 0.03) return "● Cerca del promedio de la finca";
    return rel > 0 ? "▲ Por encima del promedio de la finca" : "▼ Por debajo del promedio de la finca";
  };

  const orientacion = (pot) => {
    if (!pot) {
      return "<strong>Orientación:</strong> las diferencias entre potreros ayudan a decidir la suplementación mineral según la zona donde pasta cada lote. Selecciona un potrero para ver su detalle.";
    }
    const revisar = claves.filter((k) => {
      const rel = (pot.valores[k] - promedio[k]) / promedio[k];
      return CAPAS[k].deseable === "alto" ? rel < -0.05 : rel > 0.03;
    }).map((k) => CAPAS[k].alerta);
    if (!revisar.length) {
      return "<strong>Orientación:</strong> este potrero está en el promedio de la finca o por encima en los parámetros analizados. Con el reporte completo mantienes la suplementación mineral ajustada a cada zona.";
    }
    const lista = revisar.length > 1 ? `${revisar.slice(0, -1).join(", ")} y ${revisar.at(-1)}` : revisar[0];
    return `<strong>Orientación:</strong> frente al promedio de la finca, en este potrero hay ${lista}. Con el reporte completo te orientamos sobre la fórmula y la dosis de sal mineralizada para los animales que pastan aquí.`;
  };

  let ultimoMostrado;
  let ultimoFijo = null;

  const actualizar = () => {
    const { capa } = estadoMapa;
    const idMostrado = estadoMapa.vista ?? estadoMapa.fijo;
    const pot = potrero(idMostrado);
    const c = CAPAS[capa];

    // capa del mapa y leyenda
    botonesCapa.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.capa === capa)));
    leyenda.titulo.textContent = `${c.nombre} (${c.unidad})`;
    leyenda.min.textContent = fmt(c.min, c.decimales);
    leyenda.max.textContent = fmt(c.max, c.decimales);
    leyenda.barra.style.background = gradiente(capa);
    sectores.forEach((s) => s.rect.setAttribute("fill", color(capa, s.valores[capa])));

    // potreros resaltados
    POTREROS.forEach((p) => {
      p.grupo.classList.toggle("is-activo", p.id === idMostrado);
      p.grupo.classList.toggle("is-atenuado", idMostrado != null && p.id !== idMostrado);
      p.grupo.setAttribute("aria-pressed", String(p.id === estadoMapa.fijo));
    });

    // encabezado del panel (con un fundido corto cuando cambia de zona)
    if (idMostrado !== ultimoMostrado) {
      ref.contenido.style.animation = "none";
      void ref.contenido.offsetWidth;
      ref.contenido.style.animation = "";
      ultimoMostrado = idMostrado;
    }
    ref.kicker.textContent = pot ? `Potrero ${pot.id}` : "Vista general";
    ref.titulo.textContent = pot ? pot.nombre : "Finca de ejemplo";
    ref.meta.textContent = pot
      ? `${fmt(pot.area, 1)} ha · ${pot.pasto}`
      : `${fmt(areaTotal, 1)} ha analizadas · ${POTREROS.length} potreros`;
    ref.volver.hidden = estadoMapa.fijo == null;
    ref.subInd.textContent = pot ? "Composición estimada del pasto" : "Promedio ponderado de la finca";

    // indicadores de todos los parámetros
    ref.indicadores.forEach((btn) => {
      const k = btn.dataset.capa;
      const valor = pot ? pot.valores[k] : promedio[k];
      const [a, b] = pot ? pot.rango[k] : extremos[k];
      btn.setAttribute("aria-pressed", String(k === capa));
      btn.querySelector(".indicador__valor").textContent = fmtCapa(k, valor);
      const rango = btn.querySelector(".indicador__rango");
      rango.style.left = `${porcentaje(k, a)}%`;
      rango.style.width = `${Math.max(1, porcentaje(k, b) - porcentaje(k, a))}%`;
      btn.querySelector(".indicador__punto").style.left = `${porcentaje(k, valor)}%`;
      btn.querySelector(".indicador__nivel").textContent = pot
        ? `${nivel(k, valor)} · dentro del potrero: ${fmt(a, CAPAS[k].decimales)}–${fmtCapa(k, b)}`
        : `Entre potreros: ${fmt(a, CAPAS[k].decimales)}–${fmtCapa(k, b)}`;
    });

    // comparación entre potreros (barras desde cero)
    ref.subBarras.textContent = `Comparación entre potreros · ${c.nombre} (${c.unidad})`;
    ref.barras.forEach((btn) => {
      const p = potrero(Number(btn.dataset.id));
      const v = p.valores[capa];
      btn.classList.toggle("is-activo", p.id === idMostrado);
      btn.setAttribute("aria-pressed", String(p.id === estadoMapa.fijo));
      btn.setAttribute("aria-label", `Potrero ${p.id}, ${p.nombre}: ${fmtCapa(capa, v)}`);
      const relleno = btn.querySelector(".barra__relleno");
      relleno.style.width = `${(v / c.max) * 100}%`;
      relleno.style.backgroundColor = p.id === idMostrado ? "var(--amarillo)" : "rgba(255, 255, 255, 0.7)";
      btn.querySelector(".barra__muestra").style.backgroundColor = color(capa, v);   // mismo color que en el mapa
      btn.querySelector(".barra__valor").textContent = fmt(v, c.decimales);
    });
    ref.eje.textContent = `Escala de 0 a ${fmtCapa(capa, c.max)} · promedio de la finca: ${fmtCapa(capa, promedio[capa])}`;
    ref.orientacion.innerHTML = orientacion(pot);

    if (estadoMapa.fijo !== ultimoFijo) {
      const fijo = potrero(estadoMapa.fijo);
      estado.textContent = fijo ? `Potrero ${fijo.id}, ${fijo.nombre}, seleccionado` : "Vista general de la finca";
      acercar(fijo);
      ultimoFijo = estadoMapa.fijo;
    }
  };

  // ---------- acercamiento suave al potrero elegido ----------
  let vistaActual = [...VISTA_COMPLETA];
  let animacion = null;

  const vistaDe = (pot) => {
    if (!pot) return [...VISTA_COMPLETA];
    const margen = 46;
    const proporcion = VISTA_COMPLETA[2] / VISTA_COMPLETA[3];
    let w = pot.caja.x1 - pot.caja.x0 + margen * 2;
    let h = pot.caja.y1 - pot.caja.y0 + margen * 2;
    if (w / h < proporcion) w = h * proporcion; else h = w / proporcion;
    const x = Math.min(Math.max(0, (pot.caja.x0 + pot.caja.x1) / 2 - w / 2), VISTA_COMPLETA[2] - w);
    const y = Math.min(Math.max(0, (pot.caja.y0 + pot.caja.y1) / 2 - h / 2), VISTA_COMPLETA[3] - h);
    return [x, y, w, h];
  };

  const acercar = (pot) => {
    const destino = vistaDe(pot);
    cancelAnimationFrame(animacion);
    if (reduceMotion) {
      vistaActual = destino;
      svg.setAttribute("viewBox", destino.join(" "));
      return;
    }
    const origen = [...vistaActual];
    const inicio = performance.now();
    const DURACION = 650;
    const paso = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / DURACION);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      vistaActual = origen.map((o, i) => o + (destino[i] - o) * e);
      svg.setAttribute("viewBox", vistaActual.join(" "));
      if (t < 1) animacion = requestAnimationFrame(paso);
    };
    animacion = requestAnimationFrame(paso);
  };

  // ---------- eventos ----------
  const fijar = (id) => { estadoMapa.fijo = id; estadoMapa.vista = null; actualizar(); };
  const verPrevia = (id) => { estadoMapa.vista = id; actualizar(); };

  POTREROS.forEach((p) => {
    const g = p.grupo;
    g.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") verPrevia(p.id); });
    g.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") verPrevia(null); });
    g.addEventListener("click", () => fijar(p.id));
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fijar(p.id); }
    });
  });

  ref.barras.forEach((btn) => {
    const id = Number(btn.dataset.id);
    btn.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") verPrevia(id); });
    btn.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") verPrevia(null); });
    btn.addEventListener("click", () => fijar(id));
  });

  const cambiarCapa = (clave) => { estadoMapa.capa = clave; actualizar(); };
  botonesCapa.forEach((b) => b.addEventListener("click", () => cambiarCapa(b.dataset.capa)));
  ref.indicadores.forEach((b) => b.addEventListener("click", () => cambiarCapa(b.dataset.capa)));

  // al volver, el foco regresa al potrero que estaba elegido (el botón desaparece)
  const volverGeneral = () => {
    const anterior = potrero(estadoMapa.fijo);
    fijar(null);
    anterior?.grupo.focus();
  };
  ref.volver.addEventListener("click", volverGeneral);
  raiz.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && estadoMapa.fijo != null) volverGeneral();
  });

  actualizar();
}
