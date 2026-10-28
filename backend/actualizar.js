import { auth } from "./firebase.js";
import { esAdmin } from "./rol.js";
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
    if (!usuarioAuth) {
        window.location.href = "login.html";
        return;
    }
    if (await esAdmin(usuarioAuth)) {
        window.location.href = "admin.html";
        return;
    }
    const token=await usuarioAuth.getIdToken()
    const usuarios = await fetch("https://proyecto-grado-rouge.vercel.app/detalleusuario",{
          method: "GET",
                headers: {
                     "Authorization": `Bearer ${token}`
                },
    })
    const userData=await usuarios.json()
    if(!usuarios.ok){
        await Swal.fire({
            title:"Error",
            text:userData.error,
            icon:"error"
        })
        return;
    }
    const infoContainer = document.getElementById("infoForm");
    infoContainer["nombre"].value = userData.nombre;
    infoContainer["cedula"].value = userData.cedula;
    infoContainer["placa"].value = userData.placa;
    infoContainer.addEventListener("submit", async (e) => {
        e.preventDefault();
         const nombre = infoContainer["nombre"].value;
        const cedula = infoContainer["cedula"].value;
        const placa = infoContainer["placa"].value
        if(userData.nombre===nombre&&userData.cedula===cedula&&userData.placa===placa){
            await Swal.fire({
            title: "error",
            text: "Debe actualizar al menos un dato",
            icon: "error",
        }); 
        return;
        }
        if(!nombre?.trim() || !cedula?.trim() || !placa?.trim()){
            await Swal.fire({
            title: "error",
            text: "Todos los campos son obligatorios",
            icon: "error",
        }); 
        return;
        }
        if(!/^[A-Z]{3}[0-9]{3}$/.test(placa)&&!/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(placa)){
            await Swal.fire({
            title: "error",
            text: "La placa debe tener el formato ABC123 o ABC12D",
            icon: "error",
        }); 
        return;
        }
        try{
             const actualizado = await fetch("https://proyecto-grado-rouge.vercel.app/actualizarusuario", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nombre: nombre.trim(), cedula: cedula.trim(), placa: placa.trim() })
             });
             const resultado = await actualizado.json();
             if (!actualizado.ok) {
                await Swal.fire({
                    title: "Error",
                    text: resultado.error,
                    icon: "error"
                });
                return;
            }
             }catch(error){
            await Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error",
        });
        return;
        }
       
        await Swal.fire({
            title: "Información Actualizada con exito",
            text: "Su información ha sido actualizada",
            icon: "success",
        });
        infoContainer.reset();
        window.location.href = "perfil.html";

    });
});