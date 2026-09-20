import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { auth} from "./firebase.js";
const parametros= new URLSearchParams(window.location.search)
const id= parametros.get("id")
const containerusuario=document.getElementById("contenidousuario")
let html=""
onAuthStateChanged(auth, async (usuarioAuth) => {
       if (!usuarioAuth) {
    reservasUsuariosContainer.innerHTML = "<p>No hay sesión iniciada</p>";
    window.location.href = "login.html";
    return;
  }
  if (usuarioAuth.email !=="julian.lozanoh@uniagustiniana.edu.co" ) {
    window.location.href = "usuario.html";
    return;
  }
  const token=await usuarioAuth.getIdToken()
  const conusltausuario=await fetch(`http://localhost:3000/usuarios/${id}`,{
     method:"GET",
        headers:{
            "Authorization": `Bearer ${token}`
        },
  })
  const usuario=await conusltausuario.json();
  if(!conusltausuario.ok){
    await Swal.fire({
        title:"Error",
        text:usuario.error,
        icon:"error"
    })
    return;
  }
  const inicial = String(usuario.nombre || "?").charAt(0).toUpperCase();
  containerusuario.innerHTML=`
  <section class="cuenta ficha-usuario">
    <header class="cuenta-hero">
      <div class="avatar">${inicial}</div>
      <div class="cuenta-hero-text">
        <p class="cuenta-kicker">Administración</p>
        <h2 class="cuenta-nombre">${usuario.nombre}</h2>
        <p class="cuenta-correo">${usuario.correo}</p>
      </div>
    </header>

    <div class="perfil ficha-usuario-body">
      <header class="cuenta-form-head">
        <p class="cuenta-kicker">Detalle</p>
        <h1 class="titu mi-reserva-title">Ficha de usuario</h1>
      </header>
      <div class="info_usuario cuenta-grid">
        <div class="fila cuenta-meta">
          <span class="reserva-meta-label">Nombre</span>
          <p class="reserva-meta-value">${usuario.nombre}</p>
        </div>
        <div class="fila cuenta-meta">
          <span class="reserva-meta-label">Placa</span>
          <p class="reserva-meta-value reserva-code">${usuario.placa}</p>
        </div>
        <div class="fila cuenta-meta">
          <span class="reserva-meta-label">Correo</span>
          <p class="reserva-meta-value">${usuario.correo}</p>
        </div>
        <div class="fila cuenta-meta">
          <span class="reserva-meta-label">Cédula</span>
          <p class="reserva-meta-value">${usuario.cedula}</p>
        </div>
      </div>
    </div>
  </section>
  `

  
})