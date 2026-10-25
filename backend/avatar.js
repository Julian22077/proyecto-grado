import { blobatar } from "./blobatar-lib.js";
import { gaze } from "./blobatar-gaze.js";

function hoja(nombre, archivo) {
    if (document.querySelector(`link[data-blobatar="${nombre}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = new URL(archivo, import.meta.url).href;
    link.dataset.blobatar = nombre;
    document.head.appendChild(link);
}

hoja("motion", "./blobatar-motion.css");
hoja("gaze", "./blobatar-gaze.css");

function seguir(svg) {
    if (!(svg instanceof SVGElement) || svg.dataset.mirada) return;
    svg.dataset.mirada = "1";
    gaze(svg, { target: "pointer" });
}

function enganchar(raiz) {
    if (!(raiz instanceof Element)) return;
    if (raiz.classList.contains("mo-root")) seguir(raiz);
    raiz.querySelectorAll(".mo-root").forEach(seguir);
}

const observador = new MutationObserver((cambios) => {
    for (const cambio of cambios) {
        for (const nodo of cambio.addedNodes) enganchar(nodo);
    }
});
observador.observe(document.documentElement, { childList: true, subtree: true });
enganchar(document);

export function avatar(nombre) {
    const svg = blobatar(String(nombre || "usuario"));
    const colores = [...svg.matchAll(/fill="(#[0-9a-fA-F]{6})"/g)].map((coincidencia) => coincidencia[1]);
    const cabeza = colores[0] || "#e08a4a";
    const ojo = colores[1] || "#101820";
    return svg.replace(
        "<svg ",
        `<svg class="mo-root mo-always" style="--mo-head:${cabeza};--mo-eye:${ojo};--mo-track-travel:8px" `
    );
}
