import { loginUsusario, recuperarContraseña, auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
const loginForm = document.getElementById("LoginForm");
const recuperar = document.getElementById("recuperar");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const correo = loginForm["correo"];
  const contraseña = loginForm["contraseña"];
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
  try {
    await recuperarContraseña(correo);
    alert("Se ha enviado un eamil para recuperar contraseña");
    recuperar.reset();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
})
onAuthStateChanged(auth, (usuario) => {
  if (usuario.email === "julian.lozanoh@uniagustiniana.edu.co") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "usuario.html";
  }
})