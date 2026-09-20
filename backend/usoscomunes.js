import { obtenerUsosAdmin, auth , SalioCarro} from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { iniciarContadorUsoComun } from "./contador.js";
const { jsPDF } = window.jspdf;

const ADMIN_EMAIL = "julian.lozanoh@uniagustiniana.edu.co";
const reservasUsuariosContainer = document.getElementById("usosUsuarios");
const buscador = document.getElementById("buscarReserva");

onAuthStateChanged(auth, async (usuarioAuth) => {
  if (!usuarioAuth) {
    reservasUsuariosContainer.innerHTML = "<p>No hay sesión iniciada</p>";
    window.location.href = "login.html";
    return;
  }
  const token = await usuarioAuth.getIdToken();
  if (usuarioAuth.email !== ADMIN_EMAIL) {
    window.location.href = "usuario.html";
    return;
  }

  const usosadmin=await fetch("http://localhost:3000/usoscomunes",{
        method:"GET",
        headers:{
            "Content-Type":"application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    const comunes = await usosadmin.json();
    if (!usosadmin.ok) {
        Swal.fire({
            title: "Error",
            text: comunes.error,
            icon: "error"
        });
        return;
    }
  function MostrarReserva(lista) {
    let html = "";
    lista.forEach((data) => {
      html += `
      <article class="datos_generales reserva-card">
        <header class="filll reserva-card-top">
          <div class="reserva-card-user">
            <span class="reserva-avatar" aria-hidden="true">${String(data.placa || "?").charAt(0).toUpperCase()}</span>
            <div>
              <p class="nombree">${data.placa}</p>
              <p class="reserva-cupo">Cupo ${data.parqueaderoId}</p>
            </div>
          </div>
          <div class="reserva-card-actions">
            <p id="contadorr-${data.id}" class="estado ${data.estado}"></p>
            <form id="salio-${data.id}">
              <button type="submit" class="reserrrr">Salió</button>
            </form>
            <form id="pago-${data.id}">
              <button type="submit" class="reserrrr">Pagar</button>
            </form>
            <form id="imprimir-${data.id}">
              <button type="submit" class="reserrrr">Imprimir</button>
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
          </div>
          <div class="sec">
            <div class="fill">
              <span class="reserva-meta-label">Entrada</span>
              <p class="reserva-meta-value">${data.horaEntrada}</p>
            </div>
            <div class="fill">
              <span class="reserva-meta-label">Salida</span>
              <p class="reserva-meta-value">${data.horaSalida || "—"}</p>
            </div>
          </div>
        </div>
      </article>
            `;
    });
    reservasUsuariosContainer.innerHTML = html;
    
       lista.forEach((data) => {

    const contador = document.getElementById(`contadorr-${data.id}`);

    if (contador) {
      iniciarContadorUsoComun(
        data.horaEntrada,
        data.estado,
        contador
      );
    }

  });
    lista.forEach((data) => {
      const salio = document.getElementById(`salio-${data.id}`);
      salio.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          const saliocomun=await fetch("http://localhost:3000/finalizarusoComun",{
             method: "POST",
                headers: {
                    "Content-Type": "application/json",
                     "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ comunId: data.id})
        })
        const datacomun=await saliocomun.json();
        if(!saliocomun.ok){
          await Swal.fire({
            title: "Error",
            text: datacomun.error,
            icon: "error"
          });
          return;
        }
          await Swal.fire({
            title: "Uso finalizada",
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
      const pago = document.getElementById(`pago-${data.id}`);
      pago.addEventListener("submit", async (e) => {
        e.preventDefault();
        Swal.fire({
          title: "Agregue el metodo de pago",
          html: ` <label for="metodoPago">
            Selecciona el método de pago:
        </label>
        <select id="metodoPago" class="swal2-select">
            <option value="">Seleccione una opción</option>
            <option value="efectivo">Efectivo</option>
            <option value="nequi">Nequi</option>
            <option value="daviplata">Daviplata</option>
            <option value="tarjeta">Tarjeta</option>
        </select>`,
          showCancelButton: true,
          confirmButtonText: "Confirmar Pago",
          cancelButtonText: "Cancelar",
          preConfirm: async () => {
            const metodoPago = document.getElementById("metodoPago").value;
            if (!metodoPago) {
              Swal.showValidationMessage("Por favor, selecciona un método de pago.");
              return;
            }
            return { metodoPago };
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            const metodoPago = result.value.metodoPago;
            try{
              const pagar=await fetch("http://localhost:3000/validarpago",{
                 method: "POST",
                headers: {
                    "Content-Type": "application/json",
                     "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ comunId: data.id, metodoPago: metodoPago})
             } )
             const datos=await pagar.json();
             if(!pagar.ok){
              await Swal.fire({
                title: "Error",
                text: datos.error,
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
            }catch(error){
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
      const imprimir= document.getElementById(`imprimir-${data.id}`)
      imprimir.addEventListener("submit",(e)=>{
        e.preventDefault()
        if(data.estado==="activo"){
          Swal.fire({
            title:"Error",
            text:"El usuario aun no ha salido",
            icon:"error"
          })
          return; 
        }
        const pdf=new jsPDF({
          orientation:"portrait",
          unit:"mm",
          format:[80,150]

        })
        pdf.setFont("helvetica","bold")
        pdf.setFontSize(16)
        pdf.text("Parqueadero",40,12,{align:"center"})
        pdf.text("Calatrava",40,19,{align:"center"})
        pdf.setFont("helvetica","normal")
        pdf.setFontSize(10)
        pdf.line(5,24,75,24)
        pdf.text(`Placa:${data.placa}`,5,32)
        pdf.text(`Parqueadero:${data.parqueaderoId}`,5,40)
        pdf.text(`Fecha: ${data.fecha}`,5,48)
        pdf.text(`Hora entrada: ${data.horaEntrada}`,5,56)
        pdf.text(`Hora salida: ${data.horaSalida}`,5,64)
        pdf.text(`Precio: ${data.precio}`,5,72)
        pdf.text(`Metodo Pago: ${data.metodoPago}`,5,80)
        pdf.line(5,88,75,88)
        pdf.setFont("helvetica","bold");
        pdf.text("Gracias por su vista",40,96,{align:"center"})
        const pdfurl=pdf.output("bloburl")
        const ventana=window.open(pdfurl,"_blank")
         if (!ventana) {
        Swal.fire({
            title: "Ventana bloqueada",
            text: "Permita las ventanas emergentes para imprimir el comprobante.",
            icon: "warning"
        });
       }
      })

    });
  }

  MostrarReserva(comunes);

  buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase();
    const filtradas = comunes.filter((data) => {
      return data.placa.toLowerCase().includes(texto)
    });
    MostrarReserva(filtradas);
  });
});
