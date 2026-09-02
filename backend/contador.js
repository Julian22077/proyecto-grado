import { obtenerEstado } from "./firebase.js";
import { convertirHoracomun } from "./utils.js";
export const iniciarContador = (
    fecha,
    horaEntrada,
    horaSalida,
    elemento
) => {

    setInterval(() => {

            const estado =
                obtenerEstado(
                    fecha,
                    horaEntrada,
                    horaSalida
                );
            const mañana = new Date();
            mañana.setDate(mañana.getDate() + 1);
            const ahora =
                new Date();
    

            const segundosActuales =
                ahora.getHours() * 3600 +
                ahora.getMinutes() * 60 +
                ahora.getSeconds();

            let objetivo;

            if (estado === "pendiente") {

                elemento.textContent = "Pendiente"
                return;
            }
            else if (estado === "activa") {

                const [h, m] =
                    horaSalida
                        .split(":")
                        .map(Number);

                objetivo =
                    h * 3600 + m * 60;
            }
            else if (estado === "finalizada") {
                elemento.textContent = "Finalizada"
                return;
            }

            let restante =
                objetivo -
                segundosActuales;

            const horas =
                Math.floor(restante / 3600);

            restante %= 3600;

            const minutos =
                Math.floor(restante / 60);

            const segundos =
                restante % 60;

            elemento.textContent =
                `${String(horas).padStart(2, "0")}:
         ${String(minutos).padStart(2, "0")}:
         ${String(segundos).padStart(2, "0")}`;

        }, 1000);

}

export const iniciarContadorUsoComun = (
    horaLlegada,
    estado,
    elemento
) => {

    setInterval(() => {

        const ahora = new Date();

        const segundosActuales =
            ahora.getHours() * 3600 +
            ahora.getMinutes() * 60 +
            ahora.getSeconds();

        const segundosLlegada = convertirHoracomun(horaLlegada);

        let transcurridos =
            segundosActuales - segundosLlegada;

        if (transcurridos < 0) {
            transcurridos += 24 * 3600;
        }
        if(estado==="finalizado"){
            elemento.textContent="Finalizado"
            return;
        }

        const horas = Math.floor(transcurridos / 3600);

        transcurridos %= 3600;

        const minutos = Math.floor(transcurridos / 60);

        const segundos = transcurridos % 60;

        elemento.textContent =
            `${String(horas).padStart(2, "0")}:` +
            `${String(minutos).padStart(2, "0")}:` +
            `${String(segundos).padStart(2, "0")}`;

    }, 1000);

};