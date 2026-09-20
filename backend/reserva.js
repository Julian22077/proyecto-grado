import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { auth, reservarParqueadero, hacerReserva, obetenerconfig, colaEspera, reservacola, obtenerEstado } from "./firebase.js";
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
    precioSpan.textContent = diferencia * precio_minuto.minutosCobro;
}

entrada.addEventListener("change", calcularTiempoYPrecio);
salida.addEventListener("change", calcularTiempoYPrecio);

onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
        window.location.href = "login.html";
    }
    const reservaForm = document.getElementById("reservacontainer");
    const token=await usuarioAuth.getIdToken()
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
    precio_minuto=config;
    const reservasusuarios = await fetch("http://localhost:3000/reservausuarios", {
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
    const totalusuario = await fetch("http://localhost:3000/parqueaderoreservas", {
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
    reservas.forEach((data) => {
            const estado = obtenerEstado(
                data.fecha,
                data.horaEntrada,
                data.horaSalida,
                data.finalizadaAntes
            );
            if (estado === "pendiente" || estado === "activa") {
                reservass++;
            }
    
        })
        const disponibles = total.total - reservass;
         htmlreservas = `
       <div>
      <p>Espacios Disponibles: ${disponibles}</p>
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
                text: "seleccione horas validas",
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
        const reserva= await fetch("http://localhost:3000/disponibilidad",{
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
                        const colaEspera=await fetch("http://localhost:3000/colaespera",{
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

        const firmas= await fetch("http://localhost:3000/firma",{
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
                    const reservahecha=await fetch("http://localhost:3000/hacerreserva",{
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
                    const vaciarCola=await fetch("http://localhost:3000/eliminarcola",{
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