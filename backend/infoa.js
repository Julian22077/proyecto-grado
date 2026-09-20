import { auth, getUsuario, obtenerReservasAdmin, obtenerTotalParqueaderos, ultimasreservas, obtenerEstado, obtenerUsuarios, obetenerconfig, obtenerUsosAdmin } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
const adminContainer = document.getElementById("adminContainer");
const cuentasContainer = document.getElementById("cuentas");
const ultimass = document.getElementById("ultimass")
const usu = document.getElementById("usu");
onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
        adminContainer.innerHTML = "<p>No hay sesión iniciada</p>";
        window.location.href = "index.html";
    }
    if (usuarioAuth.email !== "julian.lozanoh@uniagustiniana.edu.co") {
        window.location.href = "usuario.html";
    }
 
    const token = await usuarioAuth.getIdToken();
    const usuariosa = await fetch("http://localhost:3000/detalleusuario",{
          method: "GET",
                headers: {
                     "Authorization": `Bearer ${token}`
                },
    })
    const userData=await usuariosa.json()
    if(!usuariosa.ok){
        await Swal.fire({
            title:"Error",
            text:userData.error,
            icon:"error"
        })
        return;
    }
        adminContainer.innerHTML = `
      <h1 class="titu">Bienvenido, ${userData.nombre}</h1>
    `;
    
    let dataconfig;

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
    dataconfig=config;
    console.log(dataconfig.metaIngreso);
    const reservasadmin = await fetch("http://localhost:3000/reservasadmin", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
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
    const usosadmin = await fetch("http://localhost:3000/usoscomunes", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    const usos = await usosadmin.json();
    if (!usosadmin.ok) {
        Swal.fire({
            title: "Error",
            text: usos.error,
            icon: "error"
        });
        return;
    }
    const totaladmin = await fetch("http://localhost:3000/parqueaderos", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    const total = await totaladmin.json();
    if (!totaladmin.ok) {
        Swal.fire({
            title: "Error",
            text: total.error,
            icon: "error"
        });
        return;
    }
    const usuariosadmin = await fetch("http://localhost:3000/usuarios", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    const usuarios = await usuariosadmin.json();
    if (!usuariosadmin.ok) {
        Swal.fire({
            title: "Error",
            text: usuarios.error,
            icon: "error"
        });
        return;
    }
    const ahora = new Date();
    console.log(ahora)
    const fechahoy = ahora.toLocaleDateString("sv-SE")
    let reservass = 0;
    let usoss = 0;
    let us = 0;
    let reser = 0;
    let htmlusu = "";
    let grafica = null;
    const conteo = {};
    const conteouso = {};
    const contedoextension = {};
    const conteoMulta = {};
    htmlusu = ` <a href="usuarios.html"><div class="fil">
    <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
fill="currentColor" viewBox="0 0 24 24" >
<!--Boxicons v3.0.8 https://boxicons.com | License  https://docs.boxicons.com/free-->
<path d="M12 11c1.71 0 3-1.29 3-3s-1.29-3-3-3-3 1.29-3 3 1.29 3 3 3m0-4c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1m1 5h-2c-2.76 0-5 2.24-5 5v.5c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5V17c0-2.76-2.24-5-5-5m-5 5c0-1.65 1.35-3 3-3h2c1.65 0 3 1.35 3 3zm-1.5-6c.47 0 .9-.12 1.27-.33a5.03 5.03 0 0 1-.42-4.52C7.09 6.06 6.8 6 6.5 6 5.06 6 4 7.06 4 8.5S5.06 11 6.5 11m-.39 1H5.5C3.57 12 2 13.57 2 15.5v1c0 .28.22.5.5.5H4c0-1.96.81-3.73 2.11-5m11.39-1c1.44 0 2.5-1.06 2.5-2.5S18.94 6 17.5 6c-.31 0-.59.06-.85.15a5.03 5.03 0 0 1-.42 4.52c.37.21.79.33 1.27.33m1 1h-.61A6.97 6.97 0 0 1 20 17h1.5c.28 0 .5-.22.5-.5v-1c0-1.93-1.57-3.5-3.5-3.5"></path>
</svg>
    ${usuarios.total} Ususarios Totales
    </div></a>`
    usu.innerHTML = htmlusu;
    usos.forEach((data) => {

        if (!conteouso[data.fecha]) {
            conteouso[data.fecha] = 0;
        }
        conteouso[data.fecha] += data.precio;

    })
    reservas.forEach((data) => {

        if (!conteo[data.fecha]) {
            conteo[data.fecha] = 0;
        }
        if (data.extensionMinutos) {
            if (!contedoextension[data.fecha]) {
                contedoextension[data.fecha] = 0;
            }
            contedoextension[data.fecha] += data.PrecioExtension;
        }
        if (data.penalizado) {
            if (data.finalizadaAntes === false) {
                if (!conteoMulta[data.fecha]) {
                    conteoMulta[data.fecha] = 0;
                }
                conteoMulta[data.fecha] += data.costoAdicional;
            }
        }
        conteo[data.fecha] += data.precio;

    });
    const ctx = document.getElementById("grafica");
    const totalReservasingresos = Object.values(conteo).reduce((a, b) => a + b, 0);
    const totalExtension = Object.values(contedoextension).reduce((a, b) => a + b, 0);
    const totalMulta = Object.values(conteoMulta).reduce((a, b) => a + b, 0);
    const totalIngresosUsos = Object.values(conteouso).reduce((a, b) => a + b, 0);
    const IngreososTotales = totalIngresosUsos + totalReservasingresos + totalMulta + totalExtension;
    if (grafica) {
        grafica.destroy();
    }
    grafica = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["ingresos", "meta"],
            datasets: [{
                data: [Math.min(IngreososTotales),
                Math.max(dataconfig.metaIngreso - IngreososTotales, 0)],
                backgroundColor: ["#120992", "#ffffff"]
            }]
        },
        plugins: [ChartDataLabels],

        options: {
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    formatter: (value, context) => {
                        if (context.dataIndex === 0) {
                            return Math.min(
                                (IngreososTotales / dataconfig.metaIngreso) * 100, 100
                            ).toFixed(0) + "%";
                        }
                        return "";
                    },
                    color: "white",
                    font: {
                        size: 20,
                        weight: "bold"
                    }
                }
            }
        }
    })
    const ultimasadmin = await fetch("http://localhost:3000/ultimasreservas", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    })
    const ultimas = await ultimasadmin.json();
    if (!ultimasadmin.ok) {
        Swal.fire({
            title: "Error",
            text: ultimas.error,
            icon: "error"
        });
        return;
    }
    let html2 = ""
    ultimas.forEach((data) => {
        if (data.fecha === fechahoy) {
            html2 += `
      
      <div class="dos_ultimas">
     <div class="fil">
            <svg  xmlns="http://www.w3.org/2000/svg"  class="icono_principal" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="m19.94 7.68-.03-.09a.8.8 0 0 0-.2-.29l-5-5c-.09-.09-.19-.15-.29-.2l-.09-.03a.8.8 0 0 0-.26-.05c-.02 0-.04-.01-.06-.01H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-12s-.01-.04-.01-.06c0-.09-.02-.17-.05-.26ZM6 20V4h7v4c0 .55.45 1 1 1h4v11z"></path><path d="M8 11h8v2H8zm0 4h8v2H8zm0-8h3v2H8z"></path>
            </svg>
                <p>Detalles de la reserva</p> 
            </div>
            <div class="fil">
            <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M21 5H3c-.55 0-1 .45-1 1v3.55c0 .48.33.89.8.98a1.499 1.499 0 0 1 0 2.94c-.47.09-.8.5-.8.98V18c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3.55c0-.48-.33-.89-.8-.98a1.499 1.499 0 0 1 0-2.94c.47-.09.8-.5.8-.98V6c0-.55-.45-1-1-1m-1 3.84c-1.2.57-2 1.79-2 3.16s.8 2.59 2 3.16V17h-4v-2h-1v2H4v-1.84c1.2-.57 2-1.79 2-3.16s-.8-2.59-2-3.16V7h11v1h1V7h4z"></path><path d="M15 9h1v2h-1zm0 3h1v2h-1z"></path>
            </svg>
                <p> Parqueadero: ${data.parqueaderoId} </p> 
            </div>
            <div class="fil">
            <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M19 4h-2V2h-2v2H9V2H7v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2M5 20V8h14V6v14z"></path><path d="M12 13h5v5h-5z"></path>
            </svg>
                <p>  Fecha: ${data.fecha}</p> 
            </div>  
            <div class="fil"> 
            <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M12 2C6.58 2 2 6.58 2 12s4.58 10 10 10 10-4.58 10-10S17.42 2 12 2m0 18c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8-3.66 8-8 8"></path><path d="M13 7h-2v6h6v-2h-4z"></path>
            </svg> 
                <p>Hora Entrada: ${data.horaEntrada} </p>
            </div>
            <div class="fil">
             <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
            fill="currentColor" viewBox="0 0 24 24" >
            <path d="M12 2C6.58 2 2 6.58 2 12s4.58 10 10 10 10-4.58 10-10S17.42 2 12 2m0 18c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8-3.66 8-8 8"></path><path d="M13 7h-2v6h6v-2h-4z"></path>
            </svg> 
                <p> Hora Salida: ${data.horaSalida} </p>
            </div>
              </div>
                    `
        }

    })
    if (html2 === "") {
        html2 = `<center><svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="200" height="200"  
fill="currentColor" viewBox="0 0 24 24" >
<path d="M14.29 8.29 12 10.59l-2.29-2.3-1.42 1.42 2.3 2.29-2.3 2.29 1.42 1.42 2.29-2.3 2.29 2.3 1.42-1.42-2.3-2.29 2.3-2.29z"></path><path d="M12 2C6.49 2 2 6.49 2 12c0 2.12.68 4.19 1.93 5.9l-1.75 2.53c-.21.31-.24.7-.06 1.03.17.33.51.54.89.54h9c5.51 0 10-4.49 10-10S17.51 2 12 2m0 18H4.91L6 18.43c.26-.37.23-.88-.06-1.22A7.98 7.98 0 0 1 4.01 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8Z"></path>
</svg><h3>No hay Reservas de dia</h3></center>`
    }
    ultimass.innerHTML = html2;
    const general = document.getElementById("general");
    const general_reservas = document.getElementById("general_reservas")
    const general_usos = document.getElementById("general_usos")
    let html3 = "";
    let html_reservas = "";
    let html_usos = "";
    usos.forEach((data) => {
        if (data.fecha === fechahoy) {
            if (data.estado === "activo") {
                usoss++;
            }
            us++
        }
    })
    html_usos = `   <a href="usoscomunes.html"><div class="fil">
      <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
fill="currentColor" viewBox="0 0 24 24" >
<!--Boxicons v3.0.8 https://boxicons.com | License  https://docs.boxicons.com/free-->
<path d="M21 8h-2V3a1 1 0 0 0-1.37-.93l-15 6c-.09.04-.16.1-.24.16-.03.02-.06.03-.09.06-.04.04-.05.08-.08.12-.05.06-.1.12-.13.19-.01.02 0 .05-.02.08-.03.1-.06.2-.06.31v3.55c0 .48.33.89.8.98a1.499 1.499 0 0 1 0 2.94c-.47.09-.8.5-.8.98v3.55c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3.55c0-.48-.33-.89-.8-.98a1.499 1.499 0 0 1 0-2.94c.47-.09.8-.5.8-.98V8.99c0-.55-.45-1-1-1Zm-4 0H8.19L17 4.48zm3 3.84c-1.2.57-2 1.79-2 3.16s.8 2.59 2 3.16V20h-4v-2h-1v2H4v-1.84c1.2-.57 2-1.79 2-3.16s-.8-2.59-2-3.16V10h11v1h1v-1h4z"></path><path d="M15 12h1v2h-1zm0 3h1v2h-1z"></path>
</svg>
        <p>Usos del dia: ${us}</p>
      </div></a>`
    general_usos.innerHTML = html_usos
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
        reser++;

    })
    const disponibles = total.total - (reservass + usoss);
    html3 = `
       <center><div class="fil">
     <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
fill="currentColor" viewBox="0 0 24 24" >
<!--Boxicons v3.0.8 https://boxicons.com | License  https://docs.boxicons.com/free-->
<path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2m0 2c3.71 0 6.82 2.54 7.73 5.97l-4.01-.5c-2.47-.31-4.97-.31-7.44 0l-4.01.5C5.17 6.54 8.29 4 12 4m1.5 8c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5M4 12l1.67.28c2.58.43 4.58 2.48 4.95 5.07l.37 2.58C7.06 19.43 4 16.07 4 12m9.01 7.93.37-2.58a5.995 5.995 0 0 1 4.95-5.07L20 12c0 4.07-3.05 7.43-6.99 7.93"></path>
</svg>
      <p>Espacios Disponibles: ${disponibles}</p>
      </div></center>`
    html_reservas = `   <a href="reservas.html"><div class="fil">
      <svg  xmlns="http://www.w3.org/2000/svg" class="mini_icono" width="24" height="24"  
fill="currentColor" viewBox="0 0 24 24" >
<!--Boxicons v3.0.8 https://boxicons.com | License  https://docs.boxicons.com/free-->
<path d="M21 8h-2V3a1 1 0 0 0-1.37-.93l-15 6c-.09.04-.16.1-.24.16-.03.02-.06.03-.09.06-.04.04-.05.08-.08.12-.05.06-.1.12-.13.19-.01.02 0 .05-.02.08-.03.1-.06.2-.06.31v3.55c0 .48.33.89.8.98a1.499 1.499 0 0 1 0 2.94c-.47.09-.8.5-.8.98v3.55c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-3.55c0-.48-.33-.89-.8-.98a1.499 1.499 0 0 1 0-2.94c.47-.09.8-.5.8-.98V8.99c0-.55-.45-1-1-1Zm-4 0H8.19L17 4.48zm3 3.84c-1.2.57-2 1.79-2 3.16s.8 2.59 2 3.16V20h-4v-2h-1v2H4v-1.84c1.2-.57 2-1.79 2-3.16s-.8-2.59-2-3.16V10h11v1h1v-1h4z"></path><path d="M15 12h1v2h-1zm0 3h1v2h-1z"></path>
</svg>
        <p>Reservas del dia: ${reser}</p>
      </div></a>`
    general.innerHTML = html3;
    general_reservas.innerHTML = html_reservas;
});



