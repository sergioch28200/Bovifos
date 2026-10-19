// Número de WhatsApp de ventas (código de país + número, sin "+" ni espacios)
const WHATSAPP_NUMBER = "573203060322";

function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Botones "Cotizar" -> abren WhatsApp con el producto en el mensaje
document.querySelectorAll(".js-whatsapp").forEach((link) => {
  const product = link.dataset.product;
  const message = product
    ? `Hola Bovifos, quiero cotizar ${product}.`
    : "Hola Bovifos, quiero información sobre sus sales mineralizadas.";
  link.href = whatsappUrl(message);
  link.target = "_blank";
  link.rel = "noopener";
});

// Menú móvil
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open);
});

nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

// Formulario de cotización -> mensaje de WhatsApp
const form = document.getElementById("quote-form");
const error = document.getElementById("form-error");
const ready = document.getElementById("form-ready");
const readyLink = document.getElementById("form-whatsapp");

form.addEventListener("input", () => { ready.hidden = true; });

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const required = ["nombre", "telefono", "ubicacion"];
  let valid = true;

  required.forEach((name) => {
    const field = form.elements[name];
    const ok = field.value.trim() !== "";
    field.classList.toggle("is-invalid", !ok);
    if (!ok) valid = false;
  });

  error.hidden = valid;
  if (!valid) return;

  const lines = [
    "Hola Bovifos, quiero una cotización.",
    `Nombre: ${data.get("nombre")}`,
    `Teléfono: ${data.get("telefono")}`,
    `Ubicación: ${data.get("ubicacion")}`,
  ];
  if (data.get("animales")) lines.push(`Número de animales: ${data.get("animales")}`);
  lines.push(`Producto: ${data.get("producto") || "Necesito asesoría"}`);
  if (data.get("mensaje").trim()) lines.push(`Mensaje: ${data.get("mensaje").trim()}`);

  readyLink.href = whatsappUrl(lines.join("\n"));
  ready.hidden = false;
  readyLink.focus();
});

document.getElementById("year").textContent = new Date().getFullYear();
