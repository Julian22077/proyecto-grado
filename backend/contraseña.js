import { cambiarContraseña, auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
const cambioContraseña = document.getElementById("CambioContraseña");

onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
        usuarioContainer.innerHTML = "<p>No hay sesión iniciada</p>";
        window.location.href = "index.html";
    }
    if (usuarioAuth.email === "julian.lozanoh@uniagustiniana.edu.co") {
        window.location.href = "admin.html";
    }
    cambioContraseña.addEventListener("submit", async (e) => {
        e.preventDefault();
        const actual = cambioContraseña["contraseñaActual"].value;
        const nueva = cambioContraseña["nuevaContraseña"].value;
        const confirmar = cambioContraseña["confirmarContraseña"].value;
        const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,30}$/;
        if (!regexPassword.test(nueva)) {
            await Swal.fire({
                icon: "error",
                title: "Contraseña inválida",
                text: "La contraseña debe tener entre 8 y 30 caracteres e incluir una mayúscula, una minúscula, un número y un carácter especial."
            });
            return;
        }
        if (confirmar !== nueva) {
            alert("las contraseñas con coinciden");
        } else {
            try {
                await cambiarContraseña(actual, nueva);
                await Swal.fire({
                    title: "Contraseña Actualizada",
                    text: "Su contraseña ha sido actualizada",
                    icon: "success",
                });
                cambioContraseña.reset();
                window.location.href = "perfil.html";
            } catch (error) {
                console.error(error);
                await Swal.fire({
                    title: "Error",
                    text: error.message,
                    icon: "error",
                });
            }

        }
    })
});