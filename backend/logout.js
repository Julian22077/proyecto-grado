import { logoutUsuario } from './firebase.js';
const logoutButton = document.getElementById("logout");
logoutButton.addEventListener("click", async () => {
  try {
    await Swal.fire({
      title: "Sesion cerrada Exitosamente",
      text: "Cerrando Sesion",
      icon: "success",
      showConfirmButton: false,
      timer: 1500
    });
    await logoutUsuario();

    window.location.href = "login.html";
  } catch (error) {
    console.error(error);
    Swal.fire({
      title: "Error",
      text: error.message,
      icon: "error",

    });
  }
});