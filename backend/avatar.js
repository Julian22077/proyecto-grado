import { blobatar } from "./blobatar-lib.js";

const estilo = new URL("./blobatar-motion.css", import.meta.url).href;
if (!document.querySelector(`link[data-blobatar]`)) {
    const hoja = document.createElement("link");
    hoja.rel = "stylesheet";
    hoja.href = estilo;
    hoja.dataset.blobatar = "1";
    document.head.appendChild(hoja);
}

export function avatar(nombre) {
    const svg = blobatar(String(nombre || "usuario"));
    const colores = [...svg.matchAll(/fill="(#[0-9a-fA-F]{6})"/g)].map((coincidencia) => coincidencia[1]);
    const cabeza = colores[0] || "#e08a4a";
    const ojo = colores[1] || "#101820";
    return svg.replace(
        "<svg ",
        `<svg class="mo-root mo-always" style="--mo-head:${cabeza};--mo-eye:${ojo}" `
    );
}
