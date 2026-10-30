import { cambiarContraseña, auth } from "./firebase.js";
import { esAdmin } from "./rol.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
const cambioContraseña = document.getElementById("CambioContraseña");
window.addEventListener("offline",()=>{
        Swal.fire({
            title: "Error",
            text: "No hay conexión a internet, los servicios no estarán disponibles, revise su conexión y vuelva a intentarlo",
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
    cambioContraseña.addEventListener("submit", async (e) => {
        e.preventDefault();
        const actual = cambioContraseña["contraseñaActual"].value;
        const nueva = cambioContraseña["nuevaContraseña"].value;
        const confirmar = cambioContraseña["confirmarContraseña"].value;
        if(!actual?.trim() || !nueva?.trim() || !confirmar?.trim()){
            await Swal.fire({
                icon: "error",
                title: "Campos vacíos",
                text: "Todos los campos son obligatorios."
            });
            return;
        }
        const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,30}$/;
        if (!regexPassword.test(nueva)) {
            await Swal.fire({
                icon: "error",
                title: "Contraseña inválida",
                text: "La contraseña debe tener entre 8 y 30 caracteres e incluir una mayúscula, una minúscula, un número y un carácter especial."
            });
            return;
        }
        if(actual === nueva){
            await Swal.fire({
                icon: "error",
                title: "Contraseña inválida",
                text: "La nueva contraseña no puede ser igual a la actual."
            });
            return;
        }
        if (confirmar !== nueva) {
            await Swal.fire({
                icon: "error",
                title: "Contraseñas no coinciden",
                text: "La nueva contraseña y la confirmación no coinciden."
            })
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
                const contraseñaIncorrecta = error.code === "auth/invalid-credential"
                    || error.code === "auth/wrong-password"
                    || error.code === "auth/invalid-login-credentials";
                await Swal.fire({
                    title: contraseñaIncorrecta ? "Contraseña incorrecta" : "Error",
                    text: contraseñaIncorrecta ? "La contraseña actual es incorrecta." : error.message,
                    icon: "error",
                });
            }

        }
    })
});