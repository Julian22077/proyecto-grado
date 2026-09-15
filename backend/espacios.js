import { crearParqueaderos, obtenerTotalParqueaderos, actualizarParqueaderos, reservasVigentes, auth } from "./firebase.js";
const inputReserva = document.getElementById("espaciosReserva");
const spanComunes = document.getElementById("espaciosComunes");
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
inputReserva.addEventListener("input", () => {
    const reserva = Number(inputReserva.value) || 0;

    spanComunes.textContent = 100 - reserva;
});
const form = document.getElementById("espaciosForm");
const infoEspacios = document.getElementById("infoespacios");

onAuthStateChanged(auth, async (usuarioAuth) => {

    const token=await usuarioAuth.getIdToken()
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const espaciosReserva = Number(document.getElementById("espaciosReserva").value);
    if (espaciosReserva < 0 || espaciosReserva > 100) {
    await Swal.fire({
        title: "Valor no válido",
        text: "Los espacios de reserva deben estar entre 0 y 100.",
        icon: "error"
    });
    return;
}
    try {
        const vigencia = await fetch("http://localhost:3000/reservasvigentes",{
            method:"GET",
             headers:{
            "Authorization": `Bearer ${token}`
        },
        })
        const hayreservas=await vigencia.json();
        if(!vigencia.ok){
            await Swal.fire({
                title:"Error",
                text:hayreservas.error,
                icon:"error"
            })
            return;
        }
        if (hayreservas) {
            await Swal.fire({
                title: "Error",
                text: "No puedes modificar espacios si hay reservas activas o pendientes",
                icon: "error",
            });
            return;
        }
        const totaladmin = await fetch("http://localhost:3000/parqueaderos", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    const espacios=await totaladmin.json();
    if(!totaladmin.ok){
        await Swal.fire({
            title:"Error",
            text:espacios.error,
            icon:"error"
        })
        return; 
    }
        if (espacios.total>0) {
            const actualizarpar=await fetch("http://localhost:3000/actualizarparqueaderos",{
                method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({espaciosReserva:espaciosReserva})
            })
            const parqueaderosactulizados= await actualizarpar.json();
            if(!actualizarpar.ok){
                await Swal.fire({
                    title: "error",
                    text: parqueaderosactulizados.error,
                    icon:"error"
                })
                return;
            }
            await Swal.fire({
                title: "Parqueaderos configurado correctamente",
                text: "Los  han sido configurados de manera exitosa",
                icon: "success"
            });
            return;
        }
        const crearparqueaderos= await fetch("http://localhost:3000/crearparqueaderos",{
            method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({espaciosReserva:espaciosReserva})
        })
        const parqueaderoscreados= await crearparqueaderos.json();
        if(!crearparqueaderos.ok){
            await Swal.fire({
                title: "error",
                text: parqueaderoscreados.error,
                icon:"error"
            })
            return;
        }
        await Swal.fire({
            title: "Parqueaderos configurado correctamente",
            text: "Los  han sido configurados de manera exitosa",
            icon: "success",
        });
        return;
    } catch (error) {
        console.error(error);
        await Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error",
        });
    }
});
});