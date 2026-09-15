import { auth, obtenerReserva,obtenerEstado, NotificarUsuario, cancelarNotificacion, obtenertokenFCM } from "./firebase.js";
import { iniciarContador } from "./contador.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const usuarioContainer = document.getElementById("usuarioContainer");
const infoContainer = document.getElementById("infoForm");
const reservasContainer = document.getElementById("reservasContainer");
const reservasContainerMañana = document.getElementById("reservasContainerMañana");
const cambioContraseña = document.getElementById("CambioContraseña");

onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
        usuarioContainer.innerHTML = "<p>No hay sesión iniciada</p>";
        window.location.href = "login.html";
    }
    if (usuarioAuth.email === "julian.lozanoh@uniagustiniana.edu.co") {
        window.location.href = "admin.html";
    }
    const token=await usuarioAuth.getIdToken()

    const mañana = new Date();
    const tokenfcm=await obtenertokenFCM();
    if(tokenfcm){
        const tokenn=await fetch("http://localhost:3000/guardartoken",{
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
            html:`<p>Se ha liberado un espacio en el parqueadero</p> <p>horario dsiponible: ${data.horaDisponible} - ${data.horaLimite}</p>`,
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Ver",
            cancelButtonText: "Cancelar"
        })
        if(noti.isConfirmed){
            window.location.href = "reservar.html";
        }else{
            const cancelar=await fetch("http://localhost:3000/cancelarCola", {
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
    const respuestareserva=await fetch("http://localhost:3000/reserva",{
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

        if (estado === "finalizada") {
            return;
        }
        if (data.fecha == fechahoy) {

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
             <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M12 2a2 2 0 1 0 0 4 2 2 0 1 0 0-4m-2 20h4v-7h2V8c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v7h2z"></path>
            </svg>
                <p> Código Seguridad: ${data.uid.slice(0, 8)} </p>
            </div>
            <div class="fila">
                <a href="aumentar.html"><button class="boton_aumentar">Aumentar</button></a>
                </div>
            </div>
            <div class="derecha">
                <center><svg  xmlns="http://www.w3.org/2000/svg" class="icono_derecha_reserva"
                fill="currentColor" viewBox="0 0 24 24" >
                <path d="M19 3h-2c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1H5c-1.1 0-2 .9-2 2v15c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 17H5V5h2v2h10V5h2z"></path><path d="M11 14.09 8.71 11.8 7.3 13.21l3 3c.2.2.45.29.71.29s.51-.1.71-.29l5-5-1.41-1.41-4.29 4.29Z"></path>
                </svg></center>
                <center><h3>Reserva confirmada<h3></center>
                <center><p>Tu espacio ha sido asegurado</p></center>
                 <center><div id="contadoor" class="contador"></div></center>
            <div>
           
             </div>
        `;

        }
        if (data.fecha == fechaMañana) {



            html2 += `
              
              <center><h1 class="titu">Reserva Mañana</h1></center>
             <div class="reserva_mañana">
            <div class="info_reserva">
            <div class="fila">
            <svg  xmlns="http://www.w3.org/2000/svg"  class="iconi" width="24" height="24"  
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
             <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M12 2a2 2 0 1 0 0 4 2 2 0 1 0 0-4m-2 20h4v-7h2V8c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v7h2z"></path>
            </svg>
                <p> Código Seguridad: ${data.uid.slice(0, 8)} </p>
            </div>
            </div>
              <div class="derecha">
                <center><svg  xmlns="http://www.w3.org/2000/svg" class="icono_derecha_reserva"
                fill="currentColor" viewBox="0 0 24 24" >
                <path d="M19 3h-2c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1H5c-1.1 0-2 .9-2 2v15c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 17H5V5h2v2h10V5h2z"></path><path d="M11 14.09 8.71 11.8 7.3 13.21l3 3c.2.2.45.29.71.29s.51-.1.71-.29l5-5-1.41-1.41-4.29 4.29Z"></path>
                </svg></center>
                <center><h3>Reserva confirmada<h3></center>
                 <center><p>Tu espacio ha sido asegurado</p></center>
            <div>
             </div>
        `;
        }

    });

    if (html === "" && html2 === "") {
        html += "<center><h1>No hay reservas</h1><center>"
    }

    reservasContainer.innerHTML = html;
    reservasContainerMañana.innerHTML = html2;
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
