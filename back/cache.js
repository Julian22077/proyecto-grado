const memoria = new Map();

export function leerCache(clave) {
    const entrada = memoria.get(clave);
    if (!entrada) return null;
    if (Date.now() > entrada.vence) {
        memoria.delete(clave);
        return null;
    }
    return entrada.dato;
}

export function guardarCache(clave, dato, minutos) {
    memoria.set(clave, {
        dato,
        vence: Date.now() + minutos * 60 * 1000
    });
}

export function borrarCache(prefijo) {
    for (const clave of memoria.keys()) {
        if (clave === prefijo || clave.startsWith(`${prefijo}:`)) {
            memoria.delete(clave);
        }
    }
}
