import { obtenerReservasAdmin, penalizar, obtenerEstado, gestionarCola, auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const reservasUsuariosContainer = document.getElementById("reservasUsuarios");
const buscador = document.getElementById("buscarReserva");

onAuthStateChanged(auth, async (usuarioAuth) => {
  if (!usuarioAuth) {
    reservasUsuariosContainer.innerHTML = "<p>No hay sesión iniciada</p>";
    window.location.href = "login.html";
    return;
  }

  if (usuarioAuth.email !== "julian.lozanoh@uniagustiniana.edu.co") {
    window.location.href = "usuario.html";
    return;
  }
   const token=await usuarioAuth.getIdToken()

  const reservasadmin=await fetch("http://localhost:3000/reservasadmin",{
        method:"GET",
        headers:{
            "Content-Type":"application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    const reservas = await reservasadmin.json();
    if (!reservasadmin.ok) {
        Swal.fire({
            title: "Error",
            text: reservas.error,
            icon: "error"
        });
        return;
    }

  function MostrarReserva(lista) {
    let html = "";
    lista.forEach((data) => {
      const estado = obtenerEstado(
        data.fecha,
        data.horaEntrada,
        data.horaSalida,
        data.finalizadaAntes
      );
      html += `
      <article class="datos_generales reserva-card">
        <header class="filll reserva-card-top">
          <div class="reserva-card-user">
            <span class="reserva-avatar" aria-hidden="true">${String(data.nombre || "?").charAt(0).toUpperCase()}</span>
            <div>
              <p class="nombree">${data.nombre}</p>
              <p class="reserva-cupo">Cupo ${data.parqueaderoId}</p>
            </div>
          </div>
          <div class="reserva-card-actions">
            <p class="estado ${estado}">${estado}</p>
            <form id="penalizar-${data.id}">
              <button type="submit" class="reserrrr">Salió</button>
            </form>
          </div>
        </header>
        <div class="reservas_admin_totales reserva-card-body">
          <div class="prim">
            <div class="fill">
              <span class="reserva-meta-label">Parqueadero</span>
              <p class="reserva-meta-value">${data.parqueaderoId}</p>
            </div>
            <div class="fill">
              <span class="reserva-meta-label">Fecha</span>
              <p class="reserva-meta-value">${data.fecha}</p>
            </div>
            <div class="fill">
              <span class="reserva-meta-label">Código</span>
              <p class="reserva-meta-value reserva-code">${data.uid.slice(0, 8)}</p>
            </div>
          </div>
          <div class="sec">
            <div class="fill">
              <span class="reserva-meta-label">Entrada</span>
              <p class="reserva-meta-value">${data.horaEntrada}</p>
            </div>
            <div class="fill">
              <span class="reserva-meta-label">Salida</span>
              <p class="reserva-meta-value">${data.horaSalida}</p>
            </div>
          </div>
        </div>
      </article>
            `;
    });
    reservasUsuariosContainer.innerHTML = html;
    lista.forEach((data) => {
      const penalizacion = document.getElementById(`penalizar-${data.id}`);
      penalizacion.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
         const penal=await fetch("http://localhost:3000/penalizar",{
           method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({reservaID:data.id})
            
         })
         const datos= await penal.json();
         if(!penal.ok){
          await Swal.fire({
            title:"Error",
            text:datos.error,
            icon:"error"
          })
          return;
         }
         const parqueaderoId=datos.parqueaderoId
         const Gestionar=await fetch("http://localhost:3000/gestionarcola",{
           method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({fecha:data.fecha,parqueaderoId:parqueaderoId})
         })
         const datosgestios=Gestionar.json();
         if(!Gestionar.ok){
          await Swal.fire({
            title:"Error",
            text: datosgestios.error,
            icon:"error"
          })
          return;
         }
          await Swal.fire({
            title: "Reserva finalizada",
            text: "El ususario ha llegado y finalizado su reserva con exito",
            icon: "success",
          });
          window.location.reload();
        } catch (error) {
          console.error(error);
          await Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error",
          });
        }
      });
    });
  }

  MostrarReserva(reservas);

  buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase();
    const filtradas = reservas.filter((data) => {
      return (
        data.uid.toLowerCase().includes(texto) ||
        String(data.nombre).includes(texto)
      );
    });
    MostrarReserva(filtradas);
  });
});
