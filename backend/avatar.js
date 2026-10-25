import { blobatar } from "./blobatar-lib.js";

export function avatar(nombre) {
    return blobatar(String(nombre || "usuario"));
}
