export async function esAdmin(usuario) {
    if (!usuario) return false;
    try {
        const resultado = await usuario.getIdTokenResult(true);
        return resultado.claims.admin === true;
    } catch (error) {
        if (error?.code !== "auth/network-request-failed") {
            console.error(error);
            return false;
        }
        try {
            const guardado = await usuario.getIdTokenResult(false);
            return guardado.claims.admin === true;
        } catch (segundo) {
            console.error(segundo);
            return false;
        }
    }
}
