import { ongetUsuario, updateUsusario, auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
        usuarioContainer.innerHTML = "<p>No hay sesión iniciada</p>";
        window.location.href = "index.html";
    }
    if (usuarioAuth.email === "julian.lozanoh@uniagustiniana.edu.co") {
        window.location.href = "admin.html";
    }


    const usuarios = await ongetUsuario(usuarioAuth.uid)
    const userData = usuarios.data();
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
        await updateUsusario(usuarioAuth.uid, { nombre, cedula, placa });
        await Swal.fire({
            title: "Información Actualizada con exito",
            text: "Su información ha sido actualizada",
            icon: "success",
        });
        infoContainer.reset();
        window.location.href = "perfil.html";

    });
});