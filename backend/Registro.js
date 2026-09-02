import { addUsuario } from "./firebase.js";
const registroForm = document.getElementById("registroForm");
registroForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = registroForm["nombre"];
  const correo = registroForm["correo"];
  const contrasena = registroForm["contraseña"];
  const cedula = registroForm["cedula"];
  const placa = registroForm["placa"];
  const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_\\-])[A-Za-z\d@$!%*?&.#_-]{8,30}$/;
if (!regexPassword.test(contrasena.value)) {
    await Swal.fire({
        icon: "error",
        title: "Contraseña inválida",
        text: "La contraseña debe tener entre 8 y 30 caracteres e incluir una mayúscula, una minúscula, un número y un carácter especial."
    });
    return;
}
  try {
    await addUsuario(
      nombre.value,
      correo.value,
      contrasena.value,
      cedula.value,
      placa.value
    );

    await Swal.fire({
      title: "Registro exitoso",
      text: "El usuario se ha registrado con exito ",
      icon: "success",
    });
    registroForm.reset();
  } catch (error) {
    console.error(error);
    Swal.fire({
      title: "Error",
      text: error.message,
      icon: "error"
    });
  }
});
