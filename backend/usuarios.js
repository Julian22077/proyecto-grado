import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { auth} from "./firebase.js";
const containerusuarios=document.getElementById("listausuarios")
const buscador = document.getElementById("buscarReserva");



containerusuarios.addEventListener("click", (e) => {
    if (e.target.classList.contains("tarjeta_usuario")) {
        const idUsuario = e.target.dataset.id;

        window.location.href = `informacionusuario.html?id=${idUsuario}`;
    }
});
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
  const usuarioconsulta=await fetch("http://localhost:3000/usuariostotales",{
    method:"GET",
        headers:{
            "Authorization": `Bearer ${token}`
        },
  })
  const usuarios= await usuarioconsulta.json()
  if(!usuarioconsulta.ok){
    await Swal.fire({
        title:"Error",
        text:usuarios.error,
        icon:"error"
    })
    return; 
  }
  
  function MostrarUsuarios (lista){
  let html=""
  lista.forEach((data)=>{
      const inicial = data.nombre.charAt(0).toUpperCase();
      html+=`
      <div class="tarjeta_usuario" data-id="${data.id}">
       <div class="incial_usuario">
            ${inicial}
            </div>
      <p>
        ${data.nombre}
    </p>
    </div>`
  }) 
  containerusuarios.innerHTML=html
}
  MostrarUsuarios(usuarios);
  buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase();
    const filtradas = usuarios.filter((data) => {
      return data.nombre.toLowerCase().includes(texto)
    });
    MostrarUsuarios(filtradas);
  });

})