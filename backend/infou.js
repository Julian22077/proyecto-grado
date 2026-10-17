import { auth, obtenerEstado, NotificarUsuario,obtenertokenFCM } from "./firebase.js";
import { iniciarContador } from "./contador.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const usuarioContainer = document.getElementById("usuarioContainer");
const infoContainer = document.getElementById("infoForm");
const reservasContainer = document.getElementById("reservasContainer");
const reservasContainerMañana = document.getElementById("reservasContainerMañana");
const cambioContraseña = document.getElementById("CambioContraseña");
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
onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
        usuarioContainer.innerHTML = "<p>No hay sesión iniciada</p>";
        window.location.href = "login.html";
        return;
    }
    if (usuarioAuth.email === "julian.lozanoh@uniagustiniana.edu.co") {
        window.location.href = "admin.html";
        return;
    }
    const token=await usuarioAuth.getIdToken()

    const mañana = new Date();
    const tokenfcm=await obtenertokenFCM();
    if(tokenfcm){
        const tokenn=await fetch("https://proyecto-grado-rouge.vercel.app/guardartoken",{
             method: "POST",
                headers: {
                    "Content-Type": "application/json",
                     "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({tokenN:tokenfcm})
        })
        const datostoken=tokenn.json()
        if(!tokenn.ok){
            await Swal.fire({
                tiitle:"Error",
                text: datostoken.error,
                icon:"error"
            })
            return;
        }
    }   
    mañana.setDate(mañana.getDate() + 1);
    const fechaMañana = mañana.toLocaleDateString("sv-SE");
    const hoy = new Date();
    const fechahoy = hoy.toLocaleDateString("sv-SE");
     await NotificarUsuario(usuarioAuth.uid, fechahoy, async (data, id)=>{
      const noti = await Swal.fire({
            title: "Se libero un espacio en el parqueadero",
            html:`<p class="dash-sub">Se ha liberado un espacio en el parqueadero.</p><p class="reserva-meta-value">${data.horaDisponible} – ${data.horaLimite}</p>`,
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Ver",
            cancelButtonText: "Cancelar"
        })
        if(noti.isConfirmed){
            window.location.href = "reservar.html";
        }else{
            const cancelar=await fetch("https://proyecto-grado-rouge.vercel.app/cancelarCola", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                     "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ colaId:id,fecha:fechahoy, parqueaderoId:data.parqueaderoId })
            });
            const cancelarData = await cancelar.json();
            if(!cancelar.ok){
                Swal.fire({
                    title: "Error",
                    text: cancelarData.error,
                    icon: "error"
                });
            }
        }
    });
    try{
    const respuestareserva=await fetch("https://proyecto-grado-rouge.vercel.app/reserva",{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })
    const reservas = await respuestareserva.json();
    if(!respuestareserva.ok){
        Swal.fire({
        title: "Error",
        text: reservas.error,
        icon: "error"
    });
    return;
    }
    let html = "";
    let html2 = "";
    let datosContador = null;
    reservas.forEach((data) => {

        const estado = obtenerEstado(
            data.fecha,
            data.horaEntrada,
            data.horaSalida,
            data.finalizadaAntes
        );

        if (estado === "finalizada" || data.cancelado) {
            return;
        }
        if (data.fecha == fechahoy) {

            datosContador = {
                fecha: data.fecha,
                horaEntrada: data.horaEntrada,
                horaSalida: data.horaSalida
            };

            html += `
            <section class="mi-reserva">
              <header class="mi-reserva-heading">
                <p class="mi-reserva-kicker">Hoy</p>
                <h1 class="titu mi-reserva-title">Mi Reserva</h1>
              </header>
              <article class="reserva_hoy mi-reserva-card">
                <div class="info_reserva">
                  <div class="mi-reserva-card-head">
                    <span class="mi-reserva-cupo">Cupo ${data.parqueaderoId}</span>
                    <span class="mi-reserva-badge ok">Confirmada</span>
                  </div>
                  <div class="mi-reserva-grid">
                    <div class="fila mi-reserva-meta">
                      <span class="reserva-meta-label">Valor</span>
                      <p class="reserva-meta-value">${data.precio}</p>
                    </div>
                    <div class="fila mi-reserva-meta">
                      <span class="reserva-meta-label">Fecha</span>
                      <p class="reserva-meta-value">${data.fecha}</p>
                    </div>
                    <div class="fila mi-reserva-meta">
                      <span class="reserva-meta-label">Entrada</span>
                      <p class="reserva-meta-value">${data.horaEntrada}</p>
                    </div>
                    <div class="fila mi-reserva-meta">
                      <span class="reserva-meta-label">Salida</span>
                      <p class="reserva-meta-value">${data.horaSalida}</p>
                    </div>
                    <div class="fila mi-reserva-meta mi-reserva-code">
                      <span class="reserva-meta-label">Código de seguridad</span>
                      <p class="reserva-meta-value reserva-code">${data.uid.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div class="fila mi-reserva-actions">
                    <a class="boton_aumentar" href="aumentar.html">Aumentar Reserva</a>
                    <button type="button" class="boton_aumentar boton_cancelar" data-cancelar="${data.id}">Cancelar reserva</button>
                  </div>
                </div>
                <aside class="derecha mi-reserva-status">
                  <div class="mi-reserva-status-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  </div>
                  <h3 class="mi-reserva-status-title">Reserva confirmada</h3>
                  <p class="mi-reserva-status-sub">Tu espacio ha sido asegurado</p>
                  <p class="mi-reserva-timer-label">Tiempo restante</p>
                  <div id="contadoor" class="contador"></div>
                </aside>
              </article>
            </section>
        `;

        }
        if (data.fecha == fechaMañana) {



            html2 += `
            <section class="mi-reserva">
              <header class="mi-reserva-heading">
                <p class="mi-reserva-kicker">Mañana</p>
                <h1 class="titu mi-reserva-title">Reserva Mañana</h1>
              </header>
              <article class="reserva_mañana mi-reserva-card">
                <div class="info_reserva">
                  <div class="mi-reserva-card-head">
                    <span class="mi-reserva-cupo">Cupo ${data.parqueaderoId}</span>
                    <span class="mi-reserva-badge ok">Confirmada</span>
                  </div>
                  <div class="mi-reserva-grid">
                    <div class="fila mi-reserva-meta">
                      <span class="reserva-meta-label">Valor</span>
                      <p class="reserva-meta-value">${data.precio}</p>
                    </div>
                    <div class="fila mi-reserva-meta">
                      <span class="reserva-meta-label">Fecha</span>
                      <p class="reserva-meta-value">${data.fecha}</p>
                    </div>
                    <div class="fila mi-reserva-meta">
                      <span class="reserva-meta-label">Entrada</span>
                      <p class="reserva-meta-value">${data.horaEntrada}</p>
                    </div>
                    <div class="fila mi-reserva-meta">
                      <span class="reserva-meta-label">Salida</span>
                      <p class="reserva-meta-value">${data.horaSalida}</p>
                    </div>
                    <div class="fila mi-reserva-meta mi-reserva-code">
                      <span class="reserva-meta-label">Código de seguridad</span>
                      <p class="reserva-meta-value reserva-code">${data.uid.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div class="fila mi-reserva-actions">
                    <button type="button" class="boton_aumentar boton_cancelar" data-cancelar="${data.id}">Cancelar reserva</button>
                  </div>
                </div>
                <aside class="derecha mi-reserva-status mi-reserva-status--soon">
                  <div class="mi-reserva-status-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  </div>
                  <h3 class="mi-reserva-status-title">Reserva confirmada</h3>
                  <p class="mi-reserva-status-sub">Tu espacio ha sido asegurado</p>
                </aside>
              </article>
            </section>
        `;
        }

    });

    if (html === "" && html2 === "") {
        html += `
          <section class="mi-reserva mi-reserva-empty">
            <p class="mi-reserva-kicker">Sin actividad</p>
            <h1 class="titu mi-reserva-title">No hay reservas</h1>
            <p class="mi-reserva-empty-sub">Cuando reserves un cupo, aparecerá aquí con los detalles de la reserva realizada.</p>
            <p class="mi-reserva-empty-sub">Atención: Las reservas se podrán cancelar antes del inicio de las mismas, en caso de cancelación, por favor guardar comprobante de pago y comuniquese al correo calatrava.parqueadero@gmail.com, para el proceso de reembolso correspondiente.</p>
            <a class="boton_aumentar" href="reservar.html">Ir a reservar</a>
          </section>
        `;
    }

    reservasContainer.innerHTML = html;
    reservasContainerMañana.innerHTML = html2;
    document.querySelectorAll("[data-cancelar]").forEach((boton) => {
        boton.addEventListener("click", async () => {
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
            const respuesta = await fetch("https://proyecto-grado-rouge.vercel.app/cancelarreserva", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ reservaID: boton.dataset.cancelar })
            });
            const datos = await respuesta.json();
            if (!respuesta.ok) {
                await Swal.fire({
                    title: "Error",
                    text: datos.error,
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
        });
    });
    if (datosContador) {

        const contador =
            document.getElementById(
                "contadoor"
            );

        if (contador) {

            iniciarContador(
                datosContador.fecha,
                datosContador.horaEntrada,
                datosContador.horaSalida,
                contador
            );

        }

    }
    }catch(error){
    console.error(error);
    Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error"
    });
}

});
