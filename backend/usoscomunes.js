import { obtenerUsosAdmin, auth , SalioCarro} from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { iniciarContadorUsoComun } from "./contador.js";

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

  const re = await obtenerUsosAdmin();
  const comunes = re.docs;

  function MostrarReserva(lista) {
    let html = "";
    lista.forEach((doc) => {
      const data = doc.data();
      html += `
      <div class="datos_generales">
                   <div class="filll">
                    <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="30" height="30"  
fill="currentColor" viewBox="0 0 24 24" >
<!--Boxicons v3.0.8 https://boxicons.com | License  https://docs.boxicons.com/free-->
<path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5m0-8c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3M4 22h16c.55 0 1-.45 1-1v-1c0-3.86-3.14-7-7-7h-4c-3.86 0-7 3.14-7 7v1c0 .55.45 1 1 1m6-7h4c2.76 0 5 2.24 5 5H5c0-2.76 2.24-5 5-5"></path>
</svg>
                    <p class="nombree">${data.placa}</p>
                    <p id="contadorr-${doc.id}" class="estado ${data.estado}"></p>
                    <form id=salio-${doc.id}>
                    <button type="submit" class="reserrrr">Salió</button>
                    </form>
                    <form id=pago-${doc.id}>
                    <button type="submit" class="reserrrr">Pagar</button>
                    </form>
                      </div>
                <div class="reservas_admin_totales">
                <div class="prim">
                     <div class="fill">
                     <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M21 5H3c-.55 0-1 .45-1 1v3.55c0 .48.33.89.8.98a1.499 1.499 0 0 1 0 2.94c-.47.09-.8.5-.8.98V18c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3.55c0-.48-.33-.89-.8-.98a1.499 1.499 0 0 1 0-2.94c.47-.09.8-.5.8-.98V6c0-.55-.45-1-1-1m-1 3.84c-1.2.57-2 1.79-2 3.16s.8 2.59 2 3.16V17h-4v-2h-1v2H4v-1.84c1.2-.57 2-1.79 2-3.16s-.8-2.59-2-3.16V7h11v1h1V7h4z"></path><path d="M15 9h1v2h-1zm0 3h1v2h-1z"></path>
            </svg>
                    <p>Parqueadero ID: ${data.parqueaderoId}</p>
                     </div>
                      <div class="fill">
                       <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M19 4h-2V2h-2v2H9V2H7v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2M5 20V8h14V6v14z"></path><path d="M12 13h5v5h-5z"></path>
            </svg>
                    <p>Fecha: ${data.fecha}</p>
                      </div>
                      </div>
                      <div class="sec">
                        <div class="fill">
                        <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M12 2C6.58 2 2 6.58 2 12s4.58 10 10 10 10-4.58 10-10S17.42 2 12 2m0 18c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8-3.66 8-8 8"></path><path d="M13 7h-2v6h6v-2h-4z"></path>
            </svg> 
                    <p>Hora Entrada: ${data.horaEntrada}</p>
                      </div>
                      <div class="fill">
                      <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M12 2C6.58 2 2 6.58 2 12s4.58 10 10 10 10-4.58 10-10S17.42 2 12 2m0 18c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8-3.66 8-8 8"></path><path d="M13 7h-2v6h6v-2h-4z"></path>
            </svg> 
                    <p>Hora Salida: ${data.horaSalida}</p>
                      </div>
                      
                      </div>
                   
                </div>
                </div>
            `;
    });
    reservasUsuariosContainer.innerHTML = html;
    
       lista.forEach((doc) => {

    const data = doc.data();

    const contador = document.getElementById(`contadorr-${doc.id}`);

    if (contador) {
      iniciarContadorUsoComun(
        data.horaEntrada,
        data.estado,
        contador
      );
    }

  });
    lista.forEach((doc) => {
      const salio = document.getElementById(`salio-${doc.id}`);
      salio.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          const saliocomun=await fetch("http://localhost:3000/finalizarusoComun",{
             method: "POST",
                headers: {
                    "Content-Type": "application/json",
                     "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ comunId: doc.id})
        })
        const data=await saliocomun.json();
        if(!saliocomun.ok){
          await Swal.fire({
            title: "Error",
            text: data.error,
            icon: "error"
          });
          return;
        }
          await Swal.fire({
            title: "Uso finalizada",
            text: "El ususario ha llegado y finalizado su reserva con exito",
            icon: "success",
          });
        } catch (error) {
          console.error(error);
          await Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error",
          });
        }
      });
      const pago = document.getElementById(`pago-${doc.id}`);
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
                body: JSON.stringify({ comunId: doc.id, metodoPago: metodoPago})
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
    });
  }

  MostrarReserva(comunes);

  buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase();
    const filtradas = comunes.filter((doc) => {
      const data = doc.data();
      return data.placa.toLowerCase().includes(texto)
    });
    MostrarReserva(filtradas);
  });
});
