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
            <center><h1 class="titu">Mi Reserva</h1></center>
            <div class="reserva_hoy">
            <div class="info_reserva">
            <div class="fila">
            <svg  xmlns="http://www.w3.org/2000/svg"  class="icono_principal" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="m19.94 7.68-.03-.09a.8.8 0 0 0-.2-.29l-5-5c-.09-.09-.19-.15-.29-.2l-.09-.03a.8.8 0 0 0-.26-.05c-.02 0-.04-.01-.06-.01H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-12s-.01-.04-.01-.06c0-.09-.02-.17-.05-.26ZM6 20V4h7v4c0 .55.45 1 1 1h4v11z"></path><path d="M8 11h8v2H8zm0 4h8v2H8zm0-8h3v2H8z"></path>
            </svg>
                <p>Detalles de la reserva</p> 
            </div>
            <div class="fila">
            <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M21 5H3c-.55 0-1 .45-1 1v3.55c0 .48.33.89.8.98a1.499 1.499 0 0 1 0 2.94c-.47.09-.8.5-.8.98V18c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3.55c0-.48-.33-.89-.8-.98a1.499 1.499 0 0 1 0-2.94c.47-.09.8-.5.8-.98V6c0-.55-.45-1-1-1m-1 3.84c-1.2.57-2 1.79-2 3.16s.8 2.59 2 3.16V17h-4v-2h-1v2H4v-1.84c1.2-.57 2-1.79 2-3.16s-.8-2.59-2-3.16V7h11v1h1V7h4z"></path><path d="M15 9h1v2h-1zm0 3h1v2h-1z"></path>
            </svg>
                <p> Parqueadero: ${data.parqueaderoId} </p> 
            </div>
            <div class="fila">
            <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M19 4h-2V2h-2v2H9V2H7v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2M5 20V8h14V6v14z"></path><path d="M12 13h5v5h-5z"></path>
            </svg>
                <p>  Fecha: ${data.fecha}</p> 
            </div>  
            <div class="fila"> 
            <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M12 2C6.58 2 2 6.58 2 12s4.58 10 10 10 10-4.58 10-10S17.42 2 12 2m0 18c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8-3.66 8-8 8"></path><path d="M13 7h-2v6h6v-2h-4z"></path>
            </svg> 
                <p>Hora Entrada: ${data.horaEntrada} </p>
            </div>
            <div class="fila">
             <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M12 2C6.58 2 2 6.58 2 12s4.58 10 10 10 10-4.58 10-10S17.42 2 12 2m0 18c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8-3.66 8-8 8"></path><path d="M13 7h-2v6h6v-2h-4z"></path>
            </svg> 
                <p> Hora Salida: ${data.horaSalida} </p>
            </div>
            <div class="fila">
               
            </div>
            </div>
            <div class="derecha">
            <center><h3>Tiempo Restante</h3></center>
                <center><div id="contadoor" class="contador"></div></center>
                <p>Aumentar Tiempo</p>
                 <form id="aumento-${data.id}" >
                <input type="number"id="minutosExtra-${data.id}" class="aumento">
                <p>Tiempo extra :<span id="extra"> 0 </span> minutos</p>
                <p>Costo: $<span id="dextra">0</span></p>
                <center><button type="submit" class="reserr"> Aumentar </button></center>
                </form>
                
            </div>
            </div>
              
        `;

    });
    let precio_minuto
    const config = await obetenerconfig();
    if (config.exists()) {
        precio_minuto = config.data();

    }
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
