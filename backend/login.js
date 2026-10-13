import { loginUsusario, recuperarContraseña, auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
const loginForm = document.getElementById("LoginForm");
const recuperar = document.getElementById("recuperar");
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
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const correo = loginForm["correo"];
  const contraseña = loginForm["contraseña"];
  if(!correo?.value.trim() || !contraseña?.value.trim()){
    await Swal.fire({
        title: "Error",
        text: "Correo y contraseña son obligatorios",
        icon: "error"
    });
    return;
}
  try {
    await loginUsusario(correo.value, contraseña.value);
    await Swal.fire({
      title: "Inicio de sesión exitoso",
      text: "Bienvenido ",
      icon: "success",
      showConfirmButton: false,
      timer: 1500
    });
    if (correo.value === "julian.lozanoh@uniagustiniana.edu.co") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "usuario.html";
    }

  } catch (error) {
    console.error(error);
    Swal.fire({
      title: "Error al Iniciar Sesion",
      text: error.message,
      icon: "error",

    });
  }
});
recuperar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const correo = recuperar["correo"].value;
  if(!correo?.trim()){
    await Swal.fire({
        title: "Error",
        text: "El correo es obligatorio",
        icon: "error"
    });
    return;
}
  try {
    await recuperarContraseña(correo);
    await Swal.fire({
      tiitle: "Correo enviado",
      text: "Se ha enviado un correo para restablecer la contraseña",
      icon: "success",
    })
    recuperar.reset();
  } catch (error) {
    console.error(error);
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
})
onAuthStateChanged(auth, (usuario) => {
  if (!usuario) {
    return;
  }
  if (usuario.email === "julian.lozanoh@uniagustiniana.edu.co") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "usuario.html";
  }
})