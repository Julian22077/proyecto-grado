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
  containerusuario.innerHTML=`
  <p>Nombre:${usuario.nombre}</p>
  <p>Placa:${usuario.placa}</p>
  <p>Correo:${usuario.correo}</p>
  <p>Cedula:${usuario.cedula}</p>

  `

  
})