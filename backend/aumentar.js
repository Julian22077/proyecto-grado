import { auth,obtenerReservaAumentar, aumentarReserrva, Extender, obetenerconfig } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { iniciarContador } from "./contador.js";
const usuarioContainer = document.getElementById("usuarioContainer");
const infoContainer = document.getElementById("infoForm");
const reservasContainer = document.getElementById("reservasContainer");
const reservasContainerMañana = document.getElementById("reservasContainerMañana");
const cambioContraseña = document.getElementById("CambioContraseña");

onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
        usuarioContainer.innerHTML = "<p>No hay sesión iniciada</p>";
        window.location.href = "index.html";
    }
    if (usuarioAuth.email === "julian.lozanoh@uniagustiniana.edu.co") {
        window.location.href = "admin.html";
    }
    const token=await usuarioAuth.getIdToken();
    try{
    const aumentar=await fetch("http://localhost:3000/reservaaumento", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    const reservas = await aumentar.json();
    if (!aumentar.ok) { 
        Swal.fire({
            title: "Error",
            text: reservas.error,
            icon: "error"
        })
        return;
    }
    
    let datosContador = null;
    let html = "";

    reservas.forEach((data) => {

        datosContador = {
            fecha: data.fecha,
            horaEntrada: data.horaEntrada,
            horaSalida: data.horaSalida
        };

        html += `
            <section class="mi-reserva">
              <header class="mi-reserva-heading">
                <p class="mi-reserva-kicker">Extensión</p>
                <h1 class="titu mi-reserva-title">Aumentar tiempo</h1>
              </header>
              <article class="reserva_hoy mi-reserva-card mi-aumento-card">
                <div class="info_reserva">
                  <div class="mi-reserva-card-head">
                    <span class="mi-reserva-cupo">Cupo ${data.parqueaderoId}</span>
                    <span class="mi-reserva-badge ok">Activa</span>
                  </div>
                  <div class="mi-reserva-grid">
                    <div class="fila mi-reserva-meta">
                      <span class="reserva-meta-label">Parqueadero</span>
                      <p class="reserva-meta-value">${data.parqueaderoId}</p>
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
                  </div>
                </div>
                <aside class="derecha mi-reserva-status mi-aumento-panel">
                  <p class="mi-reserva-timer-label">Tiempo restante</p>
                  <div id="contadoor" class="contador"></div>
                  <div class="mi-aumento-divider" aria-hidden="true"></div>
                  <h3 class="mi-aumento-form-title">Aumentar tiempo</h3>
                  <p class="mi-aumento-form-sub">Indica los minutos adicionales a pagar</p>
                  <form id="aumento-${data.id}" class="mi-aumento-form">
                    <label class="mi-aumento-label" for="minutosExtra-${data.id}">Minutos extra</label>
                    <input type="number" id="minutosExtra-${data.id}" class="aumento" min="1" placeholder="Ej. 30">
                    <div class="mi-aumento-summary">
                      <div class="mi-aumento-row">
                        <span>Tiempo extra</span>
                        <strong><span id="extra">0</span> min</strong>
                      </div>
                      <div class="mi-aumento-row mi-aumento-cost">
                        <span>Costo</span>
                        <strong>$<span id="dextra">0</span></strong>
                      </div>
                    </div>
                    <button type="submit" class="reserr">Aumentar</button>
                  </form>
                </aside>
              </article>
            </section>
        `;

    });
    let precio_minuto
    const configg=await fetch("http://localhost:3000/configuracion",{
          method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        },
    })
    const config=await configg.json();
    if(!configg.ok){
        await Swal.fire({
            title:"error",
            text:config.error,
            icon:"error"
        })
        return 
    }
    precio_minuto=config;
    reservasContainer.innerHTML = html;
    reservas.forEach((data) => {
        const minutis = document.getElementById(`minutosExtra-${data.id}`)
        const span1 = document.getElementById("extra");
        const span2 = document.getElementById("dextra");
        function numeris() {
            const valor = minutis.value;
            span1.textContent = valor;
            span2.textContent = valor * precio_minuto.minutosCobro;

        }
        minutis.addEventListener("change", numeris)
    })

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

    reservas.forEach((data) => {
        const form = document.getElementById(`aumento-${data.id}`);
        const input = document.getElementById(`minutosExtra-${data.id}`);

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const minutosExtra = Number(input.value);
            try{

         
            const validacion= await fetch("http://localhost:3000/validaraumento",{
                 method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${token}`
            },
            body:JSON.stringify({reservaID:data.id, minutosExtra:minutosExtra})
            })
            const datos = await validacion.json();
            if(!validacion.ok){
                await Swal.fire({
                    title:"Error",
                    text: datos.error,
                    icon:"error"
                })
                return;
            }

            if(datos.nuevoPrecio<=1500){
                await Swal.fire({
                        title: "Error",
                        text: "solo se pueden aumentar reservas mayores a 1500  ",
                        icon: "error"
                });
                return;
            }
            const firmas=await fetch("http://localhost:3000/firmaaumento",{
                     method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({minutosExtra:minutosExtra})
            })
            const firm=await firmas.json();
        if(!firmas.ok){
            await Swal.fire({
                title:"error",
                text:firm.error,
                icon:error
            })
            return;
        }
        const {firma,referencia,monto}=firm
         const check=new WidgetCheckout({
            currency:"COP",
            amountInCents:monto,
            reference:referencia,
            publicKey:"pub_test_zU8mBm6AGOsa6D2DIdDW5BiVtn9kzhiX",
            signature:{integrity:firma}
        })
        check.open(async(resultado)=>{
            if(resultado.transaction?.status==="APPROVED"){
                const idtransaccion=resultado.transaction.id
                try{
                    const aumento=await fetch("http://localhost:3000/aumentar",{
                         method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({reservaID:datos.reservaID, idtransaccion:idtransaccion,minutosExtra:minutosExtra,referencia:referencia})
            })
            const aumentohecho=await aumento.json()
            if(!aumento.ok){
                await Swal.fire({
                    title:"error",
                    text: aumentohecho.message,
                    icon:"error"
                })
                return;
            }
            await Swal.fire({
                title:"Reserva auemntada con exito ",
                text:"La reserva se aumento con exito",
                icon:"success"
            })
             window.location.href="usuario.html"

                }catch(error){
                    await Swal.fire({
                        title:"Error",
                        text:error.message,
                        icon:"error"
                    })
                }
            }
            if(resultado.transaction?.status==="DECLINED"||resultado.transaction?.status==="ERROR"){
                await Swal.fire({
                    tittle:"Error en la transaccion",
                    text:"el pago no fue aprobado",
                    icon:"error"
                })
            }
        })
    }catch(error){
        await Swal.fire({
            title:"Error",
            text:error.message,
            icon:"error"
        })
    }
    });
        

    });
    }catch(error){
        console.error(error);
        Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error"
        });
    }
});
