import { auth } from "./firebase.js";
import { esAdmin } from "./rol.js";
import { avatar } from "./avatar.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
const usuarioContainer = document.getElementById("usuarioContainer");
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
    const figura = avatar(userData.nombre);

    usuarioContainer.innerHTML = `
      <section class="cuenta">
        <header class="cuenta-hero">
          <div class="avatar">${figura}</div>
          <div class="cuenta-hero-text">
            <p class="cuenta-kicker">Mi cuenta</p>
            <h2 class="cuenta-nombre">${userData.nombre}</h2>
            <p class="cuenta-correo">${userData.correo}</p>
          </div>
        </header>

        <div class="perfil">
          <div class="info_usuario cuenta-grid">
            <div class="fila cuenta-meta">
              <span class="reserva-meta-label">Nombre</span>
              <p class="reserva-meta-value">${userData.nombre}</p>
            </div>
            <div class="fila cuenta-meta">
              <span class="reserva-meta-label">Correo</span>
              <p class="reserva-meta-value">${userData.correo}</p>
            </div>
            <div class="fila cuenta-meta">
              <span class="reserva-meta-label">Cédula</span>
              <p class="reserva-meta-value">${userData.cedula}</p>
            </div>
            <div class="fila cuenta-meta">
              <span class="reserva-meta-label">Placa</span>
              <p class="reserva-meta-value reserva-code">${userData.placa}</p>
            </div>
          </div>

          <div class="cuenta-actions">
            <a class="cuenta-btn cuenta-btn-primary" href="actualizacion.html">Actualizar datos</a>
            <a class="cuenta-btn cuenta-btn-secondary" href="contraseña.html">Actualizar contraseña</a>
          </div>
        </div>
      </section>
        `;
});



