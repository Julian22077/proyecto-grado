import { crearParqueaderos, obtenerTotalParqueaderos, actualizarParqueaderos, reservasVigentes } from "./firebase.js";
const inputReserva = document.getElementById("espaciosReserva");
const spanComunes = document.getElementById("espaciosComunes");

inputReserva.addEventListener("input", () => {
    const reserva = Number(inputReserva.value) || 0;

    spanComunes.textContent = 100 - reserva;
});
const form = document.getElementById("espaciosForm");
const infoEspacios = document.getElementById("infoespacios");


form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const espaciosReserva = Number(document.getElementById("espaciosReserva").value);
    try {
        const hayreservas = await reservasVigentes();
        if (hayreservas) {
            await Swal.fire({
                title: "Error",
                text: "No puedes modificar espacios si hay reservas activas o pendientes",
                icon: "error",
            });
        }
        const espacios = await obtenerTotalParqueaderos();
        if (espacios) {
            await actualizarParqueaderos(espaciosReserva);
            await Swal.fire({
                title: "Parqueaderos configurado correctamente",
                text: "Los  han sido configurados de manera exitosa",
                icon: "success",
            });
            return;
        }
        await crearParqueaderos(espaciosReserva);
        await Swal.fire({
            title: "Parqueaderos configurado correctamente",
            text: "Los  han sido configurados de manera exitosa",
            icon: "success",
        });

    } catch (error) {
        console.error(error);
        await Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error",
        });
    }
});