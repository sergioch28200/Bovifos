// Número de WhatsApp de ventas (código de país + número, sin "+" ni espacios)
const WHATSAPP_NUMBER = "573203060322";
const DEFAULT_MSG = "Hola Bovifos, quiero información sobre sus sales mineralizadas.";
const STORAGE_KEY = "bovifos-pedido";

const whatsappUrl = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const bultos = (n) => `${n} ${n === 1 ? "bulto" : "bultos"}`;

// Enlaces de cotización: el href base ya funciona sin JS; aquí se añade el mensaje
document.querySelectorAll(".js-wa").forEach((link) => {
  link.href = whatsappUrl(link.dataset.msg || DEFAULT_MSG);
  link.target = "_blank";
  link.rel = "noopener";
});

// Menú móvil
const menuBtn = document.querySelector(".menu-btn");
const menu = document.getElementById("menu");

const setMenu = (open) => {
  menu.classList.toggle("is-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
};
menuBtn.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu.classList.contains("is-open")) {
    setMenu(false);
    menuBtn.focus();
  }
});

// Filtro por etapa
const filtros = document.querySelector(".filtros");
const filtroEstado = document.getElementById("filtro-estado");
const cards = [...document.querySelectorAll(".card[data-etapa]")];

const applyFilter = (value) => {
  filtros.querySelectorAll("button").forEach((b) => {
    const active = b.dataset.filter === value;
    b.setAttribute("aria-pressed", String(active));
    // en móvil la fila de filtros se desplaza en horizontal: centrar el activo
    if (active && filtros.scrollWidth > filtros.clientWidth) {
      filtros.scrollLeft = b.offsetLeft - (filtros.clientWidth - b.offsetWidth) / 2;
    }
  });
  cards.forEach((card) => {
    card.hidden = value !== "todas" && card.dataset.etapa !== value;
  });
  const shown = cards.filter((c) => !c.hidden).length;
  filtroEstado.textContent = `Mostrando ${shown} de ${cards.length} fórmulas`;
};

filtros.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-filter]");
  if (btn) applyFilter(btn.dataset.filter);
});

// Accesos rápidos del hero: van al catálogo ya filtrado
document.querySelectorAll("[data-go]").forEach((link) =>
  link.addEventListener("click", () => applyFilter(link.dataset.go))
);

// Pedido por bultos -> mensaje de WhatsApp
const pedido = document.getElementById("pedido");
const total = document.getElementById("pedido-total");
const detalle = document.getElementById("pedido-detalle");
const enviar = document.getElementById("pedido-enviar");
const floatBtn = document.querySelector(".wa-float");
const formPedido = document.getElementById("form-pedido");
const productCards = [...document.querySelectorAll(".card[data-product]")];

const getItems = () =>
  productCards
    .map((card) => ({
      name: card.dataset.product,
      qty: parseInt(card.querySelector(".qty__input").value, 10) || 0,
    }))
    .filter((item) => item.qty > 0);

const pedidoLines = (items) => items.map((i) => `- ${i.name}: ${bultos(i.qty)} de 40 kg`);

const savePedido = (items) => {
  try {
    if (items.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    else localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* almacenamiento no disponible: el pedido sigue funcionando sin guardarse */ }
};

const updatePedido = () => {
  const items = getItems();
  const sum = items.reduce((acc, item) => acc + item.qty, 0);
  savePedido(items);

  pedido.hidden = sum === 0;
  floatBtn.hidden = sum > 0;
  formPedido.hidden = sum === 0;
  document.body.classList.toggle("has-pedido", sum > 0);
  if (sum === 0) return;

  const resumen = items.map((i) => `${i.name} × ${i.qty}`).join(" · ");
  total.textContent = bultos(sum);
  detalle.textContent = `de 40 kg · ${resumen}`;
  formPedido.textContent = `Tu pedido (${bultos(sum)}): ${resumen}. Se incluye en el mensaje.`;

  const lines = ["Hola Bovifos, quiero cotizar este pedido:"].concat(pedidoLines(items));
  enviar.href = whatsappUrl(lines.join("\n"));
};

const setQty = (input, value) => {
  const n = Math.min(999, Math.max(0, parseInt(value, 10) || 0));
  input.value = n;
  input.closest(".card").classList.toggle("is-selected", n > 0);
};

document.querySelectorAll(".qty").forEach((qty) => {
  const input = qty.querySelector(".qty__input");
  qty.querySelectorAll(".qty__btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      setQty(input, (parseInt(input.value, 10) || 0) + Number(btn.dataset.step));
      updatePedido();
    })
  );
  input.addEventListener("change", () => { setQty(input, input.value); updatePedido(); });
});

document.getElementById("pedido-vaciar").addEventListener("click", () => {
  document.querySelectorAll(".qty__input").forEach((input) => setQty(input, 0));
  updatePedido();
});

// Recuperar el pedido si la persona vuelve a la página (por ejemplo, desde WhatsApp)
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  saved.forEach(({ name, qty }) => {
    const card = productCards.find((c) => c.dataset.product === name);
    if (card) setQty(card.querySelector(".qty__input"), qty);
  });
} catch (e) { /* sin pedido guardado */ }
updatePedido();

// Formulario de cotización -> mensaje de WhatsApp (no envía datos a ningún servidor)
const form = document.getElementById("quote-form");
const error = form.querySelector(".form__error");
const ready = form.querySelector(".form__ready");
const send = form.querySelector(".form__send");

form.addEventListener("input", () => { ready.hidden = true; });

// Enlaces que llevan al formulario con un servicio ya elegido (p. ej. análisis con dron)
document.querySelectorAll("[data-servicio]").forEach((link) =>
  link.addEventListener("click", () => { form.elements.producto.value = link.dataset.servicio; ready.hidden = true; })
);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(form);
  let firstInvalid = null;

  ["nombre", "telefono", "ubicacion"].forEach((name) => {
    const field = form.elements[name];
    const ok = field.value.trim() !== "";
    field.classList.toggle("is-invalid", !ok);
    field.setAttribute("aria-invalid", String(!ok));
    if (!ok && !firstInvalid) firstInvalid = field;
  });

  error.hidden = !firstInvalid;
  if (firstInvalid) { firstInvalid.focus(); return; }

  const items = getItems();
  const lines = [
    "Hola Bovifos, quiero una cotización.",
    `Nombre: ${data.get("nombre").trim()}`,
    `Teléfono: ${data.get("telefono").trim()}`,
    `Ubicación: ${data.get("ubicacion").trim()}`,
  ];
  if (data.get("animales")) lines.push(`Número de animales: ${data.get("animales")}`);
  if (items.length) lines.push("Pedido:", ...pedidoLines(items));
  if (data.get("producto")) lines.push(`Me interesa: ${data.get("producto")}`);
  else if (!items.length) lines.push("Producto: necesito asesoría");
  if (data.get("mensaje").trim()) lines.push(`Mensaje: ${data.get("mensaje").trim()}`);

  send.href = whatsappUrl(lines.join("\n"));
  ready.hidden = false;
  send.focus();
});

document.querySelectorAll(".js-year").forEach((el) => { el.textContent = new Date().getFullYear(); });
