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
    return blobatar(String(nombre || "usuario")).replace(
        "<svg ",
        '<svg class="mo-root mo-always" '
    );
}
