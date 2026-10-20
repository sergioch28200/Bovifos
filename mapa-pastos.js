// Mapa de calor de macrominerales en la pradera (sección "Análisis con dron").
//
// QUÉ ES REAL Y QUÉ ES SIMULADO
// - Simulado: la superficie de valores del mapa. Se genera en el navegador con una semilla fija
//   para la demostración; no es una medición de Bovifos ni de una finca.
// - Publicado (con fuente): los rangos "observado" y "referencia" de cada mineral, tomados de
//   Ospina Rivera et al. (2024), Rev. Inv. Vet. Perú 35(3). Ver las referencias en index.html.
//
// CÓMO CAMBIAR LOS MINERALES O SUS ESCALAS
// - Para quitar o agregar un mineral, editar MINERALES y su botón en .mapa__selector (index.html).
// - "observado": rango publicado de concentración en gramíneas tropicales (% MS). Define la
//   escala del mapa y el intervalo dentro del que se simulan los valores.
// - "referencia": requerimiento general para bovinos en pastoreo (% MS). Define dónde cambia el
//   color (cálido por debajo, amarillo en el mínimo, verde dentro, azul por encima). Si no tiene
//   máximo publicado, poner null.
// - Con datos reales, reemplazar generarCampo() por los valores del reporte (una matriz de
//   ANCHO × ALTO en % MS, con null fuera del área analizada) y quitar el aviso de simulación.

const MINERALES = {
  ca: {
    simbolo: "Ca", nombre: "Calcio", decimales: 2,
    observado: [0.24, 0.55], referencia: [0.30, 0.81],
    funcion: "Forma huesos y dientes, participa en la contracción muscular y es clave en la producción de leche. En muchas gramíneas se encuentra por debajo del requerimiento, sobre todo en vacas lactantes.",
  },
  p: {
    simbolo: "P", nombre: "Fósforo", decimales: 2,
    observado: [0.20, 0.36], referencia: [0.25, 0.45],
    funcion: "Interviene en la formación de huesos, el aprovechamiento de la energía, el crecimiento y la fertilidad. En muchas gramíneas se encuentra por debajo del requerimiento, sobre todo en vacas lactantes.",
  },
  k: {
    simbolo: "K", nombre: "Potasio", decimales: 2,
    observado: [1.42, 3.30], referencia: [0.60, 2.00],
    funcion: "Regula el equilibrio de líquidos y la función nerviosa y muscular. En los forrajes rara vez es deficiente; un contenido alto no equivale a mejor nutrición.",
  },
  mg: {
    simbolo: "Mg", nombre: "Magnesio", decimales: 2,
    observado: [0.17, 0.35], referencia: [0.25, 0.35],
    funcion: "Necesario para la función nerviosa y muscular y para muchas enzimas. Su deficiencia se asocia con la tetania de los pastos.",
  },
  s: {
    simbolo: "S", nombre: "Azufre", decimales: 2,
    observado: [0.16, 0.37], referencia: [0.20, null], aproximada: true,
    funcion: "Lo usan los microorganismos del rumen para formar aminoácidos azufrados y proteína.",
  },
};

// Área analizada de la simulación sobre la foto (coordenadas 0–160 × 0–100).
// Sigue el borde de la pradera: deja por fuera el camino y el lote arado.
const AREA = [
  [24, 4], [64, 2], [110, 3], [118, 18], [128, 30], [156, 34], [157, 62], [155, 96],
  [96, 98], [44, 97], [22, 88], [16, 72], [22, 60], [18, 46], [20, 26],
];

const mapaRaiz = document.getElementById("mapa-pastos");
if (mapaRaiz) iniciarMapa(mapaRaiz);

function iniciarMapa(raiz) {
  const ANCHO = 160, ALTO = 100;
  const COLORES = {
    rojo: "#c8432b", naranja: "#e5853a", amarillo: "#f1cf4a",
    verdeClaro: "#a6cf5d", verde: "#3e9a4a", azulClaro: "#5fa8c9", azul: "#2f6f9f",
  };
  const OPACIDAD = 0.62;

  const lienzo = raiz.querySelector(".mapa__lienzo");
  const canvases = [...raiz.querySelectorAll(".mapa__calor")];
  const capa = raiz.querySelector(".mapa__capa");
  const panel = raiz.querySelector(".mapa__panel");
  const lectura = raiz.querySelector(".mapa__lectura");
  const mira = capa.querySelector(".mapa__mira");
  const botones = [...raiz.querySelectorAll(".mapa__selector [data-mineral]")];
  const leyenda = {
    mineral: raiz.querySelector(".leyenda__mineral"),
    barra: raiz.querySelector(".leyenda__barra"),
    ref: raiz.querySelector(".leyenda__ref"),
    marcas: raiz.querySelector(".leyenda__marcas"),
    claves: raiz.querySelector(".leyenda__claves"),
  };

  // ---------- utilidades ----------
  const fmt = (n, d = 2) => n.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d });
  const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const svgEl = (nombre, attrs = {}) => {
    const n = document.createElementNS("http://www.w3.org/2000/svg", nombre);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  };
  const dentro = (x, y, pol) => {
    let a = false;
    for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
      const [xi, yi] = pol[i], [xj, yj] = pol[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) a = !a;
    }
    return a;
  };
  const azar = (semilla) => () => {
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // ---------- escala de color de cada mineral ----------
  // Paradas [valor, color]: cálido por debajo de la referencia, amarillo en su mínimo,
  // verde dentro y azul por encima del máximo. Así, más no se lee como mejor.
  const paradas = (m) => {
    const [d0, d1] = m.observado;
    const [r0, r1] = m.referencia;
    const techo = r1 == null ? d1 : Math.min(r1, d1);
    const p = [];
    if (r0 > d0) p.push([d0, COLORES.rojo], [d0 + (r0 - d0) * 0.55, COLORES.naranja]);
    p.push([r0, COLORES.amarillo]);
    p.push([r0 + (techo - r0) * 0.3, COLORES.verdeClaro], [techo, COLORES.verde]);
    if (r1 != null && r1 < d1) p.push([r1 + (d1 - r1) * 0.4, COLORES.azulClaro], [d1, COLORES.azul]);
    return p.map(([v, c]) => [v, hexRgb(c)]);
  };

  const colorDe = (lista, v) => {
    if (v <= lista[0][0]) return lista[0][1];
    for (let i = 1; i < lista.length; i++) {
      if (v <= lista[i][0]) {
        const [v0, c0] = lista[i - 1], [v1, c1] = lista[i];
        const t = (v - v0) / (v1 - v0 || 1);
        return c0.map((c, j) => Math.round(c + (c1[j] - c) * t));
      }
    }
    return lista[lista.length - 1][1];
  };

  const categoria = (m, v) => {
    const [r0, r1] = m.referencia;
    if (v < r0) return "debajo";
    if (r1 != null && v > r1) return "encima";
    return "dentro";
  };
  const CATEGORIAS = {
    debajo: { texto: "Por debajo de la referencia", color: COLORES.naranja },
    dentro: { texto: "Dentro de la referencia", color: COLORES.verde },
    encima: { texto: "Por encima de la referencia", color: COLORES.azul },
  };
  // con una referencia sin máximo (azufre), "dentro" significa igual o por encima
  const textoCategoria = (m, k) =>
    k === "dentro" && m.referencia[1] == null ? "Igual o por encima de la referencia" : CATEGORIAS[k].texto;

  // ---------- máscara del área analizada ----------
  const mascara = new Uint8Array(ANCHO * ALTO);
  for (let y = 0; y < ALTO; y++) {
    for (let x = 0; x < ANCHO; x++) mascara[y * ANCHO + x] = dentro(x + 0.5, y + 0.5, AREA) ? 1 : 0;
  }

  // ---------- superficie SIMULADA ----------
  // Manchas suaves (gaussianas) con una parte común a todos los minerales, como ocurre con la
  // fertilidad del suelo, y otra propia de cada mineral.
  const manchas = (semilla, n) => {
    const r = azar(semilla);
    return Array.from({ length: n }, () => ({
      x: 10 + r() * 140, y: 6 + r() * 88, radio: 14 + r() * 30, peso: r() * 2 - 1,
    }));
  };
  const comunes = manchas(11, 9);
  const evaluar = (lista, x, y) =>
    lista.reduce((s, b) => s + b.peso * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / (2 * b.radio ** 2)), 0);

  const generarCampo = (clave, m, semilla) => {
    const propias = manchas(semilla, 8);
    const crudo = new Float32Array(ANCHO * ALTO);
    let min = Infinity, max = -Infinity;
    for (let y = 0; y < ALTO; y++) {
      for (let x = 0; x < ANCHO; x++) {
        const i = y * ANCHO + x;
        const v = 0.55 * evaluar(comunes, x, y) + 0.45 * evaluar(propias, x, y);
        crudo[i] = v;
        if (mascara[i]) { min = Math.min(min, v); max = Math.max(max, v); }
      }
    }
    const [d0, d1] = m.observado;
    const campo = new Float32Array(ANCHO * ALTO).fill(NaN);
    for (let i = 0; i < crudo.length; i++) {
      if (!mascara[i]) continue;
      const t = (crudo[i] - min) / (max - min);
      campo[i] = d0 + (d1 - d0) * (0.05 + 0.9 * t);   // dentro del rango observado publicado
    }
    return campo;
  };

  const datos = {};
  Object.entries(MINERALES).forEach(([clave, m], n) => {
    const campo = generarCampo(clave, m, 101 + n * 37);
    let suma = 0, cuenta = 0, min = Infinity, max = -Infinity;
    const reparto = { debajo: 0, dentro: 0, encima: 0 };
    campo.forEach((v) => {
      if (Number.isNaN(v)) return;
      suma += v; cuenta++;
      min = Math.min(min, v); max = Math.max(max, v);
      reparto[categoria(m, v)]++;
    });
    Object.keys(reparto).forEach((k) => { reparto[k] = (reparto[k] / cuenta) * 100; });
    datos[clave] = { campo, media: suma / cuenta, min, max, reparto, paradas: paradas(m) };
  });

  // ---------- capa vectorial: área, zona exterior y retícula ----------
  const areaD = `M${AREA.map((p) => p.join(" ")).join("L")}Z`;
  capa.querySelector(".mapa__area").setAttribute("d", areaD);
  capa.querySelector(".mapa__fuera").setAttribute("d", `M0 0H160V100H0Z ${areaD}`);
  const reticula = capa.querySelector(".mapa__reticula");
  for (let x = 16; x < ANCHO; x += 16) reticula.append(svgEl("line", { x1: x, x2: x, y1: 0, y2: ALTO }));
  for (let y = 20; y < ALTO; y += 20) reticula.append(svgEl("line", { x1: 0, x2: ANCHO, y1: y, y2: y }));

  // ---------- isolíneas (marching squares) ----------
  const isolinea = (campo, nivel) => {
    const seg = [];
    const v = (x, y) => campo[y * ANCHO + x];
    const corte = (a, b) => (nivel - a) / (b - a);
    for (let y = 0; y < ALTO - 1; y++) {
      for (let x = 0; x < ANCHO - 1; x++) {
        const a = v(x, y), b = v(x + 1, y), c = v(x + 1, y + 1), d = v(x, y + 1);
        if ([a, b, c, d].some(Number.isNaN)) continue;
        const pts = [];
        if ((a < nivel) !== (b < nivel)) pts.push([x + corte(a, b), y]);
        if ((b < nivel) !== (c < nivel)) pts.push([x + 1, y + corte(b, c)]);
        if ((d < nivel) !== (c < nivel)) pts.push([x + corte(d, c), y + 1]);
        if ((a < nivel) !== (d < nivel)) pts.push([x, y + corte(a, d)]);
        for (let k = 0; k + 1 < pts.length; k += 2) {
          seg.push(`M${(pts[k][0] + 0.5).toFixed(2)} ${(pts[k][1] + 0.5).toFixed(2)}L${(pts[k + 1][0] + 0.5).toFixed(2)} ${(pts[k + 1][1] + 0.5).toFixed(2)}`);
        }
      }
    }
    return seg.join("");
  };

  // ---------- dibujo ----------
  let canvasActivo = 0;
  const pintar = (clave) => {
    const { campo, paradas: lista } = datos[clave];
    const destino = canvases[1 - canvasActivo];
    const ctx = destino.getContext("2d");
    const img = ctx.createImageData(ANCHO, ALTO);
    for (let i = 0; i < campo.length; i++) {
      if (Number.isNaN(campo[i])) continue;
      const [r, g, b] = colorDe(lista, campo[i]);
      img.data.set([r, g, b, Math.round(255 * OPACIDAD)], i * 4);
    }
    ctx.putImageData(img, 0, 0);
    // fundido entre el mineral anterior y el nuevo
    destino.classList.add("is-visible");
    canvases[canvasActivo].classList.remove("is-visible");
    canvasActivo = 1 - canvasActivo;
  };

  const pintarIsolineas = (clave) => {
    const m = MINERALES[clave];
    const { campo } = datos[clave];
    const [d0, d1] = m.observado;
    const g = capa.querySelector(".mapa__isolineas");
    g.replaceChildren();
    // curvas de nivel tenues cada sexto del rango, y las de referencia resaltadas
    for (let k = 1; k < 6; k++) g.append(svgEl("path", { class: "iso", d: isolinea(campo, d0 + ((d1 - d0) * k) / 6) }));
    m.referencia.forEach((r, i) => {
      if (r == null || r <= d0 || r >= d1) return;
      g.append(svgEl("path", { class: `iso iso--ref${i ? " iso--max" : ""}`, d: isolinea(campo, r) }));
    });
  };

  // ---------- leyenda ----------
  const pos = (m, v) => ((v - m.observado[0]) / (m.observado[1] - m.observado[0])) * 100;

  const pintarLeyenda = (clave) => {
    const m = MINERALES[clave];
    const { paradas: lista } = datos[clave];
    const [d0, d1] = m.observado;
    const [r0, r1] = m.referencia;
    leyenda.mineral.textContent = `${m.nombre} (${m.simbolo})`;
    const muestras = Array.from({ length: 25 }, (_, i) => {
      const v = d0 + ((d1 - d0) * i) / 24;
      return `rgb(${colorDe(lista, v).join(",")}) ${(i / 24) * 100}%`;
    });
    leyenda.barra.style.background = `linear-gradient(90deg, ${muestras.join(", ")})`;

    // corchete de la referencia (recortado a la escala)
    const izq = Math.max(0, pos(m, r0));
    const der = r1 == null ? 100 : Math.min(100, pos(m, r1));
    leyenda.ref.style.left = `${izq}%`;
    leyenda.ref.style.width = `${der - izq}%`;
    leyenda.ref.classList.toggle("corta-izq", r0 < d0);
    leyenda.ref.classList.toggle("corta-der", r1 == null || r1 > d1);
    leyenda.ref.classList.toggle("texto-der", izq > 50);   // el rótulo no se sale de la barra
    const textoRef = r1 == null
      ? `Referencia ≈ ${fmt(r0)} %`
      : `Referencia ${fmt(r0)}–${fmt(r1)} %`;
    leyenda.ref.querySelector("span").textContent = textoRef;

    // marcas: extremos de la escala y límites de la referencia que caen dentro
    const marcas = [[d0, "extremo"], [d1, "extremo"]];
    [r0, r1].forEach((r) => { if (r != null && r > d0 && r < d1) marcas.push([r, "ref"]); });
    leyenda.marcas.replaceChildren(...marcas.map(([v, tipo]) => {
      const s = document.createElement("span");
      s.className = `marca marca--${tipo}`;
      s.style.left = `${pos(m, v)}%`;
      s.textContent = fmt(v);
      return s;
    }));

    // claves de color con texto (nunca solo color)
    const presentes = Object.keys(CATEGORIAS).filter((k) => datos[clave].reparto[k] > 0);
    leyenda.claves.replaceChildren(...presentes.map((k) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="clave__muestra" style="background:${CATEGORIAS[k].color}"></span>${textoCategoria(m, k)}`;
      return li;
    }), (() => {
      const li = document.createElement("li");
      li.innerHTML = '<span class="clave__linea"></span>Línea de referencia';
      return li;
    })());
  };

  // ---------- panel ----------
  panel.innerHTML = `
    <div class="panel__contenido">
      <p class="panel__kicker">Indicador seleccionado</p>
      <h3 class="panel__titulo"></h3>
      <p class="panel__unidad">Porcentaje de la materia seca (% MS)</p>
      <p class="panel__funcion"></p>
      <dl class="panel__datos">
        <div><dt>Media simulada</dt><dd class="dato-media"></dd></div>
        <div><dt>Rango en el mapa</dt><dd class="dato-rango"></dd></div>
      </dl>
      <div>
        <p class="panel__subtitulo">Área analizada según la referencia</p>
        <div class="reparto" aria-hidden="true"></div>
        <ul class="reparto__claves"></ul>
      </div>
      <p class="panel__orientacion"></p>
      <dl class="panel__refs">
        <div><dt>Rango observado en gramíneas tropicales<a class="dron__ref" href="#dron-fuentes">¹</a></dt><dd class="ref-observado"></dd></div>
        <div><dt>Referencia de requerimiento para bovinos en pastoreo (NRC, 2001)<a class="dron__ref" href="#dron-fuentes">¹</a></dt><dd class="ref-requerimiento"></dd></div>
      </dl>
      <p class="panel__simulado">Valores simulados para ilustrar el reporte: no son mediciones de una finca.</p>
    </div>`;
  const $ = (s) => panel.querySelector(s);

  const interpretacion = (clave) => {
    const m = MINERALES[clave];
    const { reparto } = datos[clave];
    const rotulos = { debajo: "por debajo", dentro: m.referencia[1] == null ? "igual o por encima" : "dentro", encima: "por encima" };
    const partes = Object.keys(rotulos)
      .filter((k) => reparto[k] >= 1)
      .map((k, i) => `el ${Math.round(reparto[k])} %${i === 0 ? " del área analizada queda" : ""} ${rotulos[k]}`);
    const lista = partes.length > 1 ? `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}` : partes[0];
    let texto = `<strong>Interpretación orientativa:</strong> en esta simulación, ${lista} de la referencia${m.aproximada ? " aproximada" : ""} de ${m.nombre.toLowerCase()}. `;
    if (reparto.debajo >= 20) {
      texto += "En un análisis real, las zonas por debajo serían un punto para revisar con un asesor al definir la suplementación mineral.";
    } else if (reparto.encima >= 20) {
      texto += "Estar por encima de la referencia no significa mejor nutrición: el exceso de un mineral puede afectar el aprovechamiento de otros.";
    } else {
      texto += "La lectura final depende del tipo de ganado, la etapa productiva y la dieta total.";
    }
    return texto;
  };

  const pintarPanel = (clave) => {
    const m = MINERALES[clave];
    const d = datos[clave];
    $(".panel__titulo").innerHTML = `${m.nombre} <span>(${m.simbolo})</span>`;
    $(".panel__funcion").textContent = m.funcion;
    $(".dato-media").textContent = `${fmt(d.media)} %`;
    $(".dato-rango").textContent = `${fmt(d.min)}–${fmt(d.max)} %`;
    const presentes = Object.keys(CATEGORIAS).filter((k) => d.reparto[k] > 0);
    $(".reparto").replaceChildren(...presentes.map((k) => {
      const s = document.createElement("span");
      s.style.width = `${d.reparto[k]}%`;
      s.style.background = CATEGORIAS[k].color;
      return s;
    }));
    $(".reparto__claves").replaceChildren(...presentes.map((k) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="clave__muestra" style="background:${CATEGORIAS[k].color}"></span>${textoCategoria(m, k)}: <strong>${Math.round(d.reparto[k])} %</strong>`;
      return li;
    }));
    $(".panel__orientacion").innerHTML = interpretacion(clave);
    $(".ref-observado").textContent = `${fmt(m.observado[0])}–${fmt(m.observado[1])} % MS`;
    $(".ref-requerimiento").textContent = m.referencia[1] == null
      ? `≈ ${fmt(m.referencia[0])} % MS`
      : `${fmt(m.referencia[0])}–${fmt(m.referencia[1])} % MS`;
    const contenido = $(".panel__contenido");
    contenido.style.animation = "none";
    void contenido.offsetWidth;
    contenido.style.animation = "";
  };

  // ---------- lectura del valor bajo el cursor o el dedo ----------
  let mineralActual = "ca";
  const mostrarLectura = (e) => {
    const caja = lienzo.getBoundingClientRect();
    const fx = (e.clientX - caja.left) / caja.width;
    const fy = (e.clientY - caja.top) / caja.height;
    const x = Math.floor(fx * ANCHO), y = Math.floor(fy * ALTO);
    if (x < 0 || y < 0 || x >= ANCHO || y >= ALTO) return ocultarLectura();
    const v = datos[mineralActual].campo[y * ANCHO + x];
    const m = MINERALES[mineralActual];
    mira.hidden = false;
    mira.querySelector(".mira__h").setAttribute("y1", fy * ALTO);
    mira.querySelector(".mira__h").setAttribute("y2", fy * ALTO);
    mira.querySelector(".mira__v").setAttribute("x1", fx * ANCHO);
    mira.querySelector(".mira__v").setAttribute("x2", fx * ANCHO);
    mira.querySelector("circle").setAttribute("cx", fx * ANCHO);
    mira.querySelector("circle").setAttribute("cy", fy * ALTO);
    lectura.hidden = false;
    lectura.innerHTML = Number.isNaN(v)
      ? "Fuera del área analizada"
      : `<strong>${m.simbolo} ${fmt(v)} % MS</strong><span>${textoCategoria(m, categoria(m, v))} · simulado</span>`;
    const izquierda = fx > 0.6;
    lectura.style.left = `${fx * 100}%`;
    lectura.style.top = `${fy * 100}%`;
    lectura.classList.toggle("a-la-izquierda", izquierda);
    lectura.classList.toggle("abajo", fy < 0.22);
  };
  const ocultarLectura = () => { lectura.hidden = true; mira.hidden = true; };
  lienzo.addEventListener("pointermove", mostrarLectura);
  lienzo.addEventListener("pointerdown", mostrarLectura);
  lienzo.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") ocultarLectura(); });

  // ---------- selector ----------
  const seleccionar = (clave) => {
    mineralActual = clave;
    botones.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mineral === clave)));
    pintar(clave);
    pintarIsolineas(clave);
    pintarLeyenda(clave);
    pintarPanel(clave);
    if (!lectura.hidden) ocultarLectura();
  };
  botones.forEach((b) => b.addEventListener("click", () => seleccionar(b.dataset.mineral)));

  seleccionar("ca");
}
