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
      <p class="dash-kicker">Sesión administrativa</p>
      <h1 class="titu dash-title">Bienvenido, ${userData.nombre}</h1>
      <p class="dash-sub">Resumen operativo del parqueadero en tiempo real.</p>
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
    htmlusu = `<a class="kpi-link" href="usuarios.html"><span class="kpi-num">${usuarios.total}</span></a>`
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
                backgroundColor: ["#5b8fa8", "#d8e0e8"],
                borderWidth: 0,
            }]
        },
        plugins: [ChartDataLabels],

        options: {
            cutout: "72%",
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
                    color: "#ffffff",
                    font: {
                        size: 18,
                        weight: "700",
                        family: "Manrope"
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
      <article class="dos_ultimas">
        <header class="reserva-card-head">
          <span class="reserva-badge">Cupo ${data.parqueaderoId}</span>
          <time class="reserva-fecha">${data.fecha}</time>
        </header>
        <dl class="reserva-meta">
          <div>
            <dt>Entrada</dt>
            <dd>${data.horaEntrada}</dd>
          </div>
          <div>
            <dt>Salida</dt>
            <dd>${data.horaSalida}</dd>
          </div>
        </dl>
      </article>
                    `
        }

    })
    if (html2 === "") {
        html2 = `<div class="dash-empty">
      <p class="dash-empty-title">Sin reservas hoy</p>
      <p class="dash-empty-text">Cuando se registren reservas del día aparecerán aquí.</p>
    </div>`
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
    html_usos = `<a class="kpi-link" href="usoscomunes.html"><span class="kpi-num">${us}</span></a>`
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
    html3 = `<span class="kpi-num">${disponibles}</span>`
    html_reservas = `<a class="kpi-link" href="reservas.html"><span class="kpi-num">${reser}</span></a>`
    general.innerHTML = html3;
    general_reservas.innerHTML = html_reservas;
});



