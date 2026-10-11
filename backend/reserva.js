import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { auth, obtenerEstado } from "./firebase.js";
import { convertirHora } from "./utils.js";
const containerreser=document.getElementById("espa_reser")
const entrada = document.getElementById("horaEntrada");
const salida = document.getElementById("horaSalida");
const minutosSpan = document.getElementById("horas");
const precioSpan = document.getElementById("precio");
const fechaInput = document.getElementById("fechaReserva");
const ahora = new Date();
const fechaahora=ahora.toLocaleDateString("sv-SE");
const mañana = new Date();
mañana.setDate(mañana.getDate() + 1);
const fechamañana=mañana.toLocaleDateString("sv-SE");
fechaInput.min = fechaahora;
fechaInput.max = fechamañana;
let precio_minuto
let htmlreservas="";
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
function calcularTiempoYPrecio() {
    const hEntrada = entrada.value;
    const hSalida = salida.value;

    if (!hEntrada || !hSalida) {
        minutosSpan.textContent = 0;
        precioSpan.textContent = 0;
        return;
    }

    const inicio = convertirHora(hEntrada);
    const fin = convertirHora(hSalida);
    const diferencia = fin - inicio;

    if (diferencia <= 0) {
        minutosSpan.textContent = 0;
        precioSpan.textContent = 0;
        return;
    }

    minutosSpan.textContent = diferencia;
    precioSpan.textContent = diferencia * precio_minuto;
}

entrada.addEventListener("change", calcularTiempoYPrecio);
salida.addEventListener("change", calcularTiempoYPrecio);

onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
        window.location.href = "login.html";
    }
    const reservaForm = document.getElementById("reservacontainer");
    const token=await usuarioAuth.getIdToken()
    const usuarios = await fetch("http://localhost:3000/detalleusuario",{
          method: "GET",
                headers: {
                     "Authorization": `Bearer ${token}`
                },
    })
    const userData=await usuarios.json()
    if(!usuarios.ok){
        await Swal.fire({
            title:"Error",
            text:userData.error,
            icon:"error"
        })
        return;
    }
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
        return;
    }
    if(/^[A-Z]{3}[0-9]{3}$/.test(userData.placa)){
         precio_minuto=config.minutosCobro;
    }
    if(/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(userData.placa)){
         precio_minuto=config.minutosCobroMoto;
    }
    const reservasusuarios = await fetch("https://proyecto-grado-rouge.vercel.app/reservausuarios", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    const reservas = await reservasusuarios.json();
    if (!reservasusuarios.ok) {
        Swal.fire({
            title: "Error",
            text: reservas.error,
            icon: "error"
        });
        return;
    }
    const totalusuario = await fetch("https://proyecto-grado-rouge.vercel.app/parqueaderoreservas", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    const total = await totalusuario.json();
    if (!totalusuario.ok) {
        Swal.fire({
            title: "Error",
            text: total.error,
            icon: "error"
        });
        return;
    }
    let reservass=0;
     const espaciosReservados = new Set();
    reservas.forEach((data) => {
            const estado = obtenerEstado(
                data.fecha,
                data.horaEntrada,
                data.horaSalida,
                data.finalizadaAntes
            );
            if ( estado==="pendiente" || estado === "activa") {
                 espaciosReservados.add(data.parqueaderoId);
            }
    
        })
        reservass = espaciosReservados.size;
        const disponibles = total.total - reservass;
         htmlreservas = `
       <div class="espacio">
         <span class="reserva-meta-label">Disponibles</span>
         <span class="reserva-meta-value">${disponibles}</span>
       </div>`
      containerreser.innerHTML=htmlreservas;
    reservaForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const horaEntrada = reservaForm["horaEntrada"].value;
        const horaSalida = reservaForm["horaSalida"].value;
        const fecha = reservaForm["fechaReserva"].value;
        const precio = Number(precioSpan.textContent);

        if (precio <= 0) {
             Swal.fire({
                title: "Error",
                text: "Ingrese los campos solicitados correctamente",
                icon: "error"
            });
            return;
        }
        if(precio <=1500){
             Swal.fire({
                title: "Error",
                text: "solo se pueden hacer reservas mayores a 1500 pesos ",
                icon: "error"
            });
            return;
        }
        try{
        const reserva= await fetch("https://proyecto-grado-rouge.vercel.app/disponibilidad",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({fecha:fecha,horaEntrada:horaEntrada,horaSalida:horaSalida})
        })
        const disponibilidad=await reserva.json();
         if(reserva.status===409){
            if(fecha!==fechaahora){
                await Swal.fire({
                    title:"No hay espacios disponibles",
                    text:"No hay espacios disponibles para los horas que necesitas, intentalo de nuevo",
                    icon:"warning"
                })
                return;
            }
                 const perticion = await Swal.fire({
                    title: "No hay espacios disponibles",
                    text: "¿Desea unirse a la cola de espera?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, unirme",
                    cancelButtonText: "No, cancelar"
                });
                if(perticion.isConfirmed){
                    try {
                        const colaEspera=await fetch("https://proyecto-grado-rouge.vercel.app/colaespera",{
                             method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({fecha:fecha})
                        })
                        const colita=await colaEspera.json();
                        if(!colaEspera.ok){
                            await Swal.fire({
                                title:"Error",
                                text:colita.error,
                                icon:"error"
                            })
                            return;
                        }
                        await Swal.fire({
                            title: "Cola de espera ",
                            text: "Se ha unido a la cola de espera.",
                            icon: "success"
                        });
                    } catch (error) {
                        console.error(error);
                         await Swal.fire({
                            title: "Error",
                            text: error.message,
                            icon: "error"
                        });
                    }
                 }
                return;
        }
        if(!reserva.ok){
            await Swal.fire({
                title:"error",
                text:disponibilidad.error,
                icon:"error"
            })
            return;
        }
        const parqueaderoId=disponibilidad.bloqueoId;

        const firmas= await fetch("https://proyecto-grado-rouge.vercel.app/firma",{
             method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${token}`
            },
            body:JSON.stringify({horaEntrada:horaEntrada,horaSalida:horaSalida})

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
        check.open(async (resultado)=>{
            if(resultado.transaction?.status==="APPROVED"){
                const idtransaccion=resultado.transaction.id
                try{
                    const reservahecha=await fetch("https://proyecto-grado-rouge.vercel.app/hacerreserva",{
                     method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${token}`
            },
            body:JSON.stringify({nombre:usuarioAuth.displayName, bloqueoId:parqueaderoId, fecha:fecha, horaEntrada:horaEntrada,horaSalida:horaSalida,idtransaccion:idtransaccion, monto:monto, referencia:referencia})   
                    })
                    const datosreservas=await reservahecha.json();
                    if(!reservahecha.ok){
                        await Swal.fire({
                            tittle:"Error",
                            text:datosreservas.error,
                            icon:"error"
                        })
                        return;
                    }
                    const vaciarCola=await fetch("https://proyecto-grado-rouge.vercel.app/eliminarcola",{
                         method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({fecha:fecha})
                    })
                    const datosvaciar=await vaciarCola.json();
                    if(!vaciarCola.ok){
                        await Swal.fire({
                            title:"Error",
                            text: datosvaciar.error,
                            icon:"error"
                        })
                        return;
                    }
                    await Swal.fire({
                        title:"Reserva hecha",
                        text:"Su espacio ha isdo reservado con exito",
                        icon:"success"
                    })
                    window.location.href="usuario.html"
                }catch(error){
                    await Swal.fire({
                        tittle:"Error en creacion de reserva",
                        text:error.message,
                        icon:"error"
                    })
                    reservaForm.reset();
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
            title:"error",
            text:error.message,
            icon:"error"
          }) 
    }
        
})
});