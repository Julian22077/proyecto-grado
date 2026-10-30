import { logoutUsuario } from './firebase.js';
const logoutButton = document.getElementById("logout");
logoutButton.addEventListener("click", async () => {
  try {
    await Swal.fire({
      title: "Sesión cerrada exitosamente",
      text: "Cerrando sesión",
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