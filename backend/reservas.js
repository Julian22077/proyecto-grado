import { obtenerEstado, auth } from "./firebase.js";
import { esAdmin } from "./rol.js";
import { avatar } from "./avatar.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const reservasUsuariosContainer = document.getElementById("reservasUsuarios");
const buscador = document.getElementById("buscarReserva");
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

  if (!(await esAdmin(usuarioAuth))) {
    window.location.href = "usuario.html";
    return;
  }
   const token=await usuarioAuth.getIdToken()

  const reservasadmin=await fetch("https://proyecto-grado-rouge.vercel.app/reservasadmin",{
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
      if (data.cancelado || data.finalizadaAntes || data.pagoPenalizacion) {
        return;
      }
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
            <span class="reserva-avatar" aria-hidden="true">${avatar(data.nombre)}</span>
            <div>
              <p class="nombree">${data.nombre}</p>
              <p class="reserva-cupo">Cupo ${data.parqueaderoId}</p>
            </div>
          </div>
          <div class="reserva-card-actions">
            <p class="estado ${estado}">${estado}</p>
          </div>
        </header>
        <div class="reservas_admin_totales reserva-card-body">
          <div class="prim">
            <div class="fill">
              <span class="reserva-meta-label">Costo adicional</span>
              <p class="reserva-meta-value">${data.costoAdicional||"—"}</p>
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
            <div class="fill">
              <span class="reserva-meta-label">Minutos pasados</span>
              <p class="reserva-meta-value">${data.minutosPasados||"—"}</p>
            </div>
          </div>
        </div>
        <footer class="reserva-card-actions">
          <form id="penalizar-${data.id}">
            <button type="submit" class="reserrrr">Finalizar Reserva</button>
          </form>
          <form id="pago-${data.id}">
            <button type="submit" class="reserrrr">Registrar Pago</button>
          </form>
          <button type="button" class="boton_cancelar" data-cancelar="${data.id}">Cancelar reserva</button>
        </footer>
      </article>
            `;
    });
    if (!html) {
      html = `
      <div class="dash-empty">
        <p class="dash-empty-title">Sin reservas</p>
        <p class="dash-empty-text">No hay resultados para mostrar en este momento.</p>
      </div>`;
    }
    reservasUsuariosContainer.innerHTML = html;
    lista.forEach((data) => {
      if (data.cancelado || data.finalizadaAntes || data.pagoPenalizacion) {
        return;
      }
      const penalizacion = document.getElementById(`penalizar-${data.id}`);
      penalizacion.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
         const penal=await fetch("https://proyecto-grado-rouge.vercel.app/penalizar",{
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
         const Gestionar=await fetch("https://proyecto-grado-rouge.vercel.app/gestionarcola",{
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
            text: "El usuario ha llegado y finalizado su reserva con éxito",
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
      const pago = document.getElementById(`pago-${data.id}`);
      pago.addEventListener("submit", async (e) => {
        e.preventDefault();
        Swal.fire({
          title: "Agregue el método de pago",
          html: `<div class="formulario">
            <label for="metodoPago">Método de pago</label>
        <select id="metodoPago" class="swal2-select">
            <option value="">Seleccione una opción</option>
            <option value="efectivo">Efectivo</option>
            <option value="nequi">Nequi</option>
            <option value="daviplata">Daviplata</option>
            <option value="tarjeta">Tarjeta</option>
        </select>
        </div>`,
          showCancelButton: true,
          confirmButtonText: "Confirmar Pago",
          cancelButtonText: "Cancelar",
          preConfirm: async () => {
            const metodoPago = document.getElementById("metodoPago").value;
            if (!metodoPago) {
              Swal.showValidationMessage("Por favor, seleccione un método de pago.");
              return;
            }
            return { metodoPago };
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            const metodoPago = result.value.metodoPago;
            try {
              const pagar = await fetch("https://proyecto-grado-rouge.vercel.app/validarpagoreserva", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ reservaID: data.id, metodoPago: metodoPago })
              })
              const datospago = await pagar.json();
              if (!pagar.ok) {
                await Swal.fire({
                  title: "Error",
                  text: datospago.error,
                  icon: "error"
                });
                return;
              }
              await Swal.fire({
                title: "Pago confirmado",
                text: "El pago se ha realizado con éxito",
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
          }
        })
      })
      const cancelar = document.querySelector(`[data-cancelar="${data.id}"]`);
      cancelar.addEventListener("click", async () => {
        const seguro = await Swal.fire({
          title: "Cancelar reserva",
          text: "¿Está seguro de cancelar esta reserva?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, cancelar",
          cancelButtonText: "No"
        });
        if (!seguro.isConfirmed) {
          return;
        }
        try {
          const respuesta = await fetch("https://proyecto-grado-rouge.vercel.app/cancelarreservaadmin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ reservaID: data.id })
          });
          const datosCancelar = await respuesta.json();
          if (!respuesta.ok) {
            await Swal.fire({
              title: "Error",
              text: datosCancelar.error,
              icon: "error"
            });
            return;
          }
          await Swal.fire({
            title: "Reserva cancelada",
            text: "El espacio ha sido liberado",
            icon: "success"
          });
          window.location.reload();
        } catch (error) {
          console.error(error);
          await Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error"
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
        data.nombre.toLowerCase().includes(texto)
      );
    });
    MostrarReserva(filtradas);
  });
});
