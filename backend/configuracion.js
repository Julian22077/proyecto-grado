import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
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
 const token=await usuarioAuth.getIdToken()
const form = document.getElementById("config")
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const metaingresos = Number(document.getElementById("metaingresos").value)
    const metageneral = Number(document.getElementById("metageneral").value)
    const minutoCobro = Number(document.getElementById("minutoCobro").value)
    const metaReservas = Number(document.getElementById("metareservas").value)
    const metaUsos = Number(document.getElementById("metausos").value)
    const minutoCobroMoto = Number(document.getElementById("minutoCobroMoto").value)
    const ahora = new Date();
    const fehahoy = ahora.toLocaleDateString("sv-SE")
    const vigencia = await fetch("https://proyecto-grado-rouge.vercel.app/reservasvigentes",{
            method:"GET",
             headers:{
            "Authorization": `Bearer ${token}`
        },
        })
        const hay=await vigencia.json();
        if(!vigencia.ok){
            await Swal.fire({
                title:"Error",
                text:hay.error,
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
    let dataconfig;

    const configg=await fetch("https://proyecto-grado-rouge.vercel.app/configuracion",{
          method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        },
    })
    const config=await configg.json();
    if(!configg.ok){
        await Swal.fire({
            title:"error",
            text:config.error,
            icon:"error"
        })
        return 
    }
    dataconfig=config;
    
    if(hay || hayasignaciones){
         await Swal.fire({
            title: "Error",
            text: "No se pueden configurar si hay asignaciones o reservas, pendientes o activas ",
            icon: "error",
        });
        return;
    }
    if (minutoCobro > 253) {
        await Swal.fire({
            title: "Error",
            text: "el valor no puede superar los 253",
            icon: "error",
        });
        return;
    }
    if (dataconfig.fechaConfigurado === fehahoy) {
        await Swal.fire({
            title: "Error",
            text: "Solo se permite una configuración por dia",
            icon: "error",
        });
        return;
    }
    try {
        if (metaingresos === 0 || metageneral === 0 || minutoCobro === 0||metageneral===0||metaUsos===0 || minutoCobroMoto===0) {
            await Swal.fire({
                title: "Error",
                text: "Por favor rellene los de espacios a configurar",
                icon: "error",
            });
        } else {
            const crearconfig=await fetch("https://proyecto-grado-rouge.vercel.app/crearconfiguracion",{
                method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body:JSON.stringify({metaIngreso:metaingresos, metaGeneral:metageneral, metaReservas:metaReservas, metaUsos:metaUsos, minutosCobro:minutoCobro, minutosCobroMoto:minutoCobroMoto})
            })
            const configuracioncreada=await crearconfig.json()
            if(!crearconfig.ok){
                await Swal.fire({
                    title:"error",
                    text: configuracioncreada.error,
                    icon:"error"
                })
                return;
            }
            await Swal.fire({
                title: "Configuracion Guardada",
                text: "Se ha configurado las metas diarias",
                icon: "succes",
            });
            form.reset()
        }

    } catch (error) {
        console.error(error);
        await Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error",
        });
    }
})
});