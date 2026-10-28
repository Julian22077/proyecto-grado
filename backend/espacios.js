import { auth } from "./firebase.js";
import { esAdmin } from "./rol.js";
const inputReserva = document.getElementById("espaciosReserva");
const spanComunes = document.getElementById("espaciosComunes");
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
let htmlreservas="";
const containerreser=document.getElementById("espa_reser")
inputReserva.addEventListener("input", () => {
    const reserva = Number(inputReserva.value) || 0;
    const comunes = 100 - reserva;

    spanComunes.textContent = comunes;

    const kpiReserva = document.getElementById("kpiReservaVista");
    const kpiComunes = document.getElementById("kpiComunesVista");
    const barraReserva = document.getElementById("barraReserva");
    const barraComunes = document.getElementById("barraComunes");
    const labelReservaBar = document.getElementById("labelReservaBar");
    const asideReserva = document.getElementById("asideReserva");
    const asideComunes = document.getElementById("asideComunes");

    if (kpiReserva) kpiReserva.textContent = reserva;
    if (kpiComunes) kpiComunes.textContent = comunes;
    if (barraReserva) barraReserva.style.width = `${Math.min(Math.max(reserva, 0), 100)}%`;
    if (barraComunes) barraComunes.style.width = `${Math.min(Math.max(comunes, 0), 100)}%`;
    if (labelReservaBar) labelReservaBar.textContent = reserva;
    if (asideReserva) asideReserva.textContent = reserva;
    if (asideComunes) asideComunes.textContent = comunes;
});
const form = document.getElementById("espaciosForm");
const infoEspacios = document.getElementById("infoespacios");
window.addEventListener("offline",()=>{
        Swal.fire({
            title: "Error",
            text: "No hay conexión a internet, los servcios no estarán disponibles, revise su conexión y vuelva a intentarlo",
            icon: "error"
        });
    })
    window.addEventListener("online",()=>{
        Swal.fire({
            title: "Conexión restablecida",
            text: "Se ha restablecido la conexión a internet",
            icon: "success"
        });
    })
onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
        window.location.href = "login.html";
        return;
    }
    if (!(await esAdmin(usuarioAuth))) {
        window.location.href = "usuario.html";
        return;
    }
    const token=await usuarioAuth.getIdToken()
    const totalusuario = await fetch("https://proyecto-grado-rouge.vercel.app/parqueaderoreservasadmin", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    const total = await totalusuario.json();
    if (!totalusuario.ok) {
        Swal.fire({
            title: "Error",
            text: total.error,
            icon: "error"
        });
        return;
    }
      htmlreservas = `<span class="kpi-num">${total.total}</span>`
      containerreser.innerHTML=htmlreservas;
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
        const vigencia = await fetch("https://proyecto-grado-rouge.vercel.app/reservasvigentes",{
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
        const asignaciones = await fetch("https://proyecto-grado-rouge.vercel.app/asignacionesactivas", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            },
        });
        const hayasignaciones = await asignaciones.json();
        if (!asignaciones.ok) {
            await Swal.fire({
                title: "Error",
                text: hayasignaciones.error,
                icon: "error"
            });
            return;
        }
        if (hayreservas || hayasignaciones) {
            await Swal.fire({
                title: "Error",
                text: "No puedes actualizar los espacios si hay reservas o asignaciones, activas o pendientes",
                icon: "error",
            });
            return;
        }
        const totaladmin = await fetch("https://proyecto-grado-rouge.vercel.app/parqueaderos", {
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
            const actualizarpar=await fetch("https://proyecto-grado-rouge.vercel.app/actualizarparqueaderos",{
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
        const crearparqueaderos= await fetch("https://proyecto-grado-rouge.vercel.app/crearparqueaderos",{
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