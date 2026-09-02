export function convertirHora(hora) {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
}
export const convertirHoracomun = (hora) => {
    const [h, m, s] = hora.split(":").map(Number);
    return h * 3600 + m * 60 + s;
};
export function hayConflicto(
    nuevaEntrada,
    nuevaSalida,
    entradaExistente,
    salidaExistente
) {
    return (
        nuevaEntrada < salidaExistente &&
        nuevaSalida > entradaExistente
    );
}
export function minutosAHora(
    minutos
) {
    const horas =
        Math.floor(
            minutos / 60
        );
    const mins =
        minutos % 60;

    return (
        String(horas)
            .padStart(2, "0")
        +
        ":"
        +
        String(mins)
            .padStart(2, "0")
    );

}
export function generarPlaca(){
 const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const parteLetras =
        letras[Math.floor(Math.random() * 26)] +
        letras[Math.floor(Math.random() * 26)] +
        letras[Math.floor(Math.random() * 26)];

    const parteNumeros = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");

    return parteLetras + parteNumeros;
}