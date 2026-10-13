import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { auth} from "./firebase.js";
const containerusuarios=document.getElementById("listausuarios")
const buscador = document.getElementById("buscarReserva");
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
containerusuarios.addEventListener("click", (e) => {
    if (e.target.classList.contains("tarjeta_usuario")) {
        const idUsuario = e.target.dataset.id;

        window.location.href = `informacionusuario.html?id=${idUsuario}`;
    }
});
onAuthStateChanged(auth, async (usuarioAuth) => {
     if (!usuarioAuth) {
    containerusuarios.innerHTML = "<p>No hay sesión iniciada</p>";
    window.location.href = "login.html";
    return;
  }
  if (usuarioAuth.email !=="julian.lozanoh@uniagustiniana.edu.co" ) {
    window.location.href = "usuario.html";
    return;
  }
  const token=await usuarioAuth.getIdToken()
  const usuarioconsulta=await fetch("https://proyecto-grado-rouge.vercel.app/usuariostotales",{
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
      const placa = data.placa ? `<span class="usuario-meta">${data.placa}</span>` : "";
      const correo = data.correo ? `<span class="usuario-meta usuario-meta-mail">${data.correo}</span>` : "";
      html+=`
      <div class="tarjeta_usuario" data-id="${data.id}" role="button" tabindex="0">
       <div class="incial_usuario">${inicial}</div>
       <div class="usuario-card-text">
         <p class="usuario-nombre">${data.nombre}</p>
         ${placa}${correo}
       </div>
    </div>`
  })
  if (!html) {
    html = `
      <div class="dash-empty">
        <p class="dash-empty-title">Sin usuarios</p>
        <p class="dash-empty-text">No hay cuentas que coincidan con la búsqueda.</p>
      </div>`;
  }
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