import { ObtenerReservasA, auth, obtenerEstado, obetenerconfig, ObtenerUsosA } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { convertirHora, convertirHoracomun } from "./utils.js";
onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
        adminContainer.innerHTML = "<p>No hay sesión iniciada</p>";
        window.location.href = "index.html";
    }
    const token = await usuarioAuth.getIdToken();

let dataconfig;

const config = await obetenerconfig();
if (config.exists()) {
    dataconfig = config.data();

}
const usosadmin=await fetch("http://localhost:3000/totalusos",{
        method:"GET",
        headers:{
            "Authorization": `Bearer ${token}`
        },
})
const usos = await usosadmin.json();
if(!usosadmin.ok){
    Swal.fire({
        title: "Error",
        text: usos.error,
        icon: "error"
    });
    return;
}
const reservasadmin=await fetch("http://localhost:3000/totalreservas",{
     method:"GET",
    headers:{
         "Authorization": `Bearer ${token}`
    },
})
const reservas = await reservasadmin.json();
if(!reservasadmin.ok){
    Swal.fire({
        title: "Error",
        text: reservas.error,
        icon: "error"
    });
    return;
}
const boton = document.getElementById("verGrafico");
const inputt = document.getElementById("fechaInicio1");

let grafica = null;
let grafica2 = null;
let graficaa = null;
let grafica3 = null;
let graficahoras = null;
let graficausocomun = null;
let graficareservas = null;
let graficaComparacionuso = null;
let graficaComparacionIngre = null;
let htmlComparacionuso = "";
let htmlComparacionIngre = "";
let htmlusos = "";
let htmlreservas = "";
let htmldi = "";
let htmldia = "";
const ocupacion = new Array(24).fill(0);
const uso = new Array(24).fill(0);
const uso1 = new Array(24).fill(0);
const ocupacion1 = new Array(24).fill(0);
const dia = document.getElementById("dia");
const diaa = document.getElementById("diaa");
const diausos = document.getElementById("diausos");
const diareservas = document.getElementById("diareservas")
const diaComparacion = document.getElementById("diaComparacion")
const diaComparacion1 = document.getElementById("diaComparacion1")
const hoy = new Date();
const fechahoy = hoy.toLocaleDateString("sv-SE");
const conteodiaingre = {};
const conteousoingre = {};
const conteouso = {};
const conteodia = {};
usos.forEach((data) => {
    if (fechahoy === data.fecha) {
        if (data.estado === "finalizado") {

            if (!conteousoingre[data.fecha]) {
                conteousoingre[data.fecha] = 0;
            }
            if (!conteouso[data.fecha]) {
                conteouso[data.fecha] = 0;
            }
            conteousoingre[data.fecha] += data.precio
            conteouso[data.fecha]++
            const inicio = Math.floor(convertirHoracomun(data.horaEntrada) / 3600);
            const fin = Math.ceil(convertirHoracomun(data.horaSalida) / 3600);
            for (let h = inicio; h < fin; h++) {
                uso[h]++;
            }

        }

    }

});
htmlusos = `<svg  xmlns="http://www.w3.org/2000/svg" class="icono_principal" width="24" height="24"  
                fill="currentColor" viewBox="0 0 24 24" >
                <path d="M20 7h-3V3c0-.33-.16-.64-.43-.82a.98.98 0 0 0-.92-.11L3.28 6.82C2.51 7.11 2 7.87 2 8.69V20c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m-5-2.54V7H8.39zM4 20V9h16v2h-5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h5v2zm16-4h-5v-3h5z"></path>
                </svg>
                 <center><h4>Usos Comunes</h4> 
                 <h2> ${conteouso[fechahoy] || 0}</h2></center>`
htmlComparacionuso = `<svg  xmlns="http://www.w3.org/2000/svg" class="icono_principal" width="24" height="24"  
                fill="currentColor" viewBox="0 0 24 24" >
                <path d="M20 7h-3V3c0-.33-.16-.64-.43-.82a.98.98 0 0 0-.92-.11L3.28 6.82C2.51 7.11 2 7.87 2 8.69V20c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m-5-2.54V7H8.39zM4 20V9h16v2h-5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h5v2zm16-4h-5v-3h5z"></path>
                </svg>
                 <center><h4>Comparacion Uso </h4> 
                 `
htmlComparacionIngre = `<svg  xmlns="http://www.w3.org/2000/svg" class="icono_principal" width="24" height="24"  
                fill="currentColor" viewBox="0 0 24 24" >
                <path d="M20 7h-3V3c0-.33-.16-.64-.43-.82a.98.98 0 0 0-.92-.11L3.28 6.82C2.51 7.11 2 7.87 2 8.69V20c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m-5-2.54V7H8.39zM4 20V9h16v2h-5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h5v2zm16-4h-5v-3h5z"></path>
                </svg>
                 <center><h4>Comparacion Ingresos </h4> 
                 `
diausos.innerHTML = htmlusos;
diaComparacion.innerHTML = htmlComparacionuso
diaComparacion1.innerHTML = htmlComparacionIngre;
const graficaComparacion = document.getElementById("graficaComparacion")
const graficaComparacion1 = document.getElementById("graficaComparacion1")
const graficaUsos = document.getElementById("graficadiausos");
const contedoextension = {};
const conteoMulta = {};
reservas.forEach((data) => {
    const estado = obtenerEstado(
        data.fecha,
        data.horaEntrada,
        data.horaSalida,
        data.finalizadaAntes
    );
    if (fechahoy === data.fecha) {
        if (estado === "activa" || estado === "finalizada") {
            const inicio = Math.floor(convertirHora(data.horaEntrada) / 60);
            const fin = Math.ceil(convertirHora(data.horaSalida) / 60);
            for (let h = inicio; h < fin; h++) {
                ocupacion[h]++;
            }
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
        if (!conteodiaingre[data.fecha]) {
            conteodiaingre[data.fecha] = 0;
        }
        if (!conteodia[data.fecha]) {
            conteodia[data.fecha] = 0;
        }
        conteodia[data.fecha]++;
        conteodiaingre[data.fecha] += data.precio;
    }
})
htmlreservas = `<svg  xmlns="http://www.w3.org/2000/svg" class="icono_principal" width="24" height="24"  
                fill="currentColor" viewBox="0 0 24 24" >
                <path d="M20 7h-3V3c0-.33-.16-.64-.43-.82a.98.98 0 0 0-.92-.11L3.28 6.82C2.51 7.11 2 7.87 2 8.69V20c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m-5-2.54V7H8.39zM4 20V9h16v2h-5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h5v2zm16-4h-5v-3h5z"></path>
                </svg>
                 <center><h4>Reservas</h4> 
                 <h2>${conteodia[fechahoy] || 0}</h2></center>`
diareservas.innerHTML = htmlreservas
const graficaReservas = document.getElementById("graficadiareservas")
const totalReserva = Object.values(conteodiaingre).reduce((a, b) => a + b, 0);
const totalUso = Object.values(conteousoingre).reduce((a, b) => a + b, 0);
const totalReservas = Object.values(conteodia).reduce((a, b) => a + b, 0);
const totalUsos = Object.values(conteouso).reduce((a, b) => a + b, 0);
const totalExtension = Object.values(contedoextension).reduce((a, b) => a + b, 0);
const totalMulta = Object.values(conteoMulta).reduce((a, b) => a + b, 0);
const ingresosTotales = totalReserva + totalUso + totalExtension + totalMulta;
const Usostotales = totalReservas + totalUsos;
const reservacontodo=totalReserva+totalExtension+totalMulta;
htmldia = `<svg  xmlns="http://www.w3.org/2000/svg" class="icono_principal" width="24" height="24"  
                fill="currentColor" viewBox="0 0 24 24" >
                <path d="M20 7h-3V3c0-.33-.16-.64-.43-.82a.98.98 0 0 0-.92-.11L3.28 6.82C2.51 7.11 2 7.87 2 8.69V20c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m-5-2.54V7H8.39zM4 20V9h16v2h-5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h5v2zm16-4h-5v-3h5z"></path>
                </svg>
                 <center><h4>Ingresos</h4> 
                 <h2> $${ingresosTotales}</h2></center>`
htmldi = `<svg  xmlns="http://www.w3.org/2000/svg" class="icono_principal" width="24" height="24"  
                    fill="currentColor" viewBox="0 0 24 24" >
                    <path d="M21 11h-3V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v13c0 1.65 1.35 3 3 3h14c1.65 0 3-1.35 3-3v-6c0-.55-.45-1-1-1M5 19c-.55 0-1-.45-1-1V5h12v13a3 3 0 0 0 .17 1zm15-1c0 .55-.45 1-1 1s-1-.45-1-1v-5h2z"></path><path d="M6 7h8v2H6zm0 4h8v2H6zm5 4h3v2h-3z"></path>
                    </svg>
                 <center><h4>Uso General</h4> 
                 <h2> ${Usostotales}</h2></center>`
const horas = [];
for (let i = 0; i < 24; i++) {
    horas.push(i.toString().padStart(2, "0") + ":00");
}
dia.innerHTML = htmldia;
diaa.innerHTML = htmldi;
console.log(htmldia)
const horass = document.getElementById("graficahoras");
const graficaingresos = document.getElementById("graficadia")
const graficadiauso = document.getElementById("graficadiaa");

if (graficaa) {
    graficaa.destroy();
}
graficaa = new Chart(graficaingresos, {
    type: "doughnut",
    data: {
        labels: ["ingresos", "meta"],
        datasets: [{
            data: [ingresosTotales, Math.max(dataconfig.metaIngreso - ingresosTotales, 0)],
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
                        return Math.min((ingresosTotales / dataconfig.metaIngreso) * 100, 100).toFixed(0) + "%";
                    }
                    return "";
                },
                color: "white",
                font: {
                    size: 11,
                    weight: "bold"
                }
            }
        }
    }
})
if (grafica3) {
    grafica3.destroy();
}
grafica3 = new Chart(graficadiauso, {
    type: "doughnut",
    data: {
        labels: ["ingresos", "meta"],
        datasets: [{
            data: [Usostotales, Math.max(dataconfig.metaGeneral - Usostotales, 0)],
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
                            (Usostotales / dataconfig.metaGeneral) * 100, 100
                        ).toFixed(0) + "%";
                    }
                    return "";
                },
                color: "white",
                font: {
                    size: 11,
                    weight: "bold"
                }
            }
        }
    }
})
if (graficahoras) {
    graficahoras.destroy();
}
graficahoras = new Chart(horass, {
    type: "bar",
    data: {
        labels: horas,
        datasets: [{
            label: "reservas",
            data: ocupacion
        },
        {
            label: "Uso común",
            data: uso
        }
        ]
    }
})
if (graficausocomun) {
    graficausocomun.destroy();
}
graficausocomun = new Chart(graficaUsos, {
    type: "doughnut",
    data: {
        labels: ["ingresos", "meta"],
        datasets: [{
            data: [totalUsos, Math.max(dataconfig.metaUsos - totalUsos, 0)],
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
                        return Math.min((totalUsos / dataconfig.metaUsos) * 100, 100).toFixed(0) + "%";
                    }
                    return "";
                },
                color: "white",
                font: {
                    size: 11,
                    weight: "bold"
                }
            }
        }
    }
})
if (graficareservas) {
    graficausocomun.destroy();
}
graficareservas = new Chart(graficaReservas, {
    type: "doughnut",
    data: {
        labels: ["ingresos", "meta"],
        datasets: [{
            data: [totalReservas, Math.max(dataconfig.metaReservas - totalReservas, 0)],
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
                        return Math.min((totalReservas / dataconfig.metaReservas) * 100, 100).toFixed(0) + "%";
                    }
                    return "";
                },
                color: "white",
                font: {
                    size: 11,
                    weight: "bold"
                }
            }
        }
    }
})
if (graficaComparacionuso) {
    graficaComparacionuso.destroy();
}
graficaComparacionuso = new Chart(graficaComparacion, {
    type: "doughnut",
    data: {
        labels: ["Reserva", "Uso comun"],
        datasets: [{
            data: [totalReservas, totalUsos],
            backgroundColor: ["#120992", "#278fd4"]
        }]
    },
    plugins: [ChartDataLabels],

    options: {
        plugins: {
            legend: {
                display: false
            },
            datalabels: {
                formatter: (value) => {
                    const porcentaje = Usostotales === 0 ? 0 : (value / Usostotales) * 100;
                    return porcentaje.toFixed(1) + "%";
                },
                color: "white",
                font: {
                    weight: "bold",
                    size: 11
                }
            }
        }
    }
})
if (graficaComparacionIngre) {
    graficaComparacionIngre.destroy();
}
graficaComparacionIngre = new Chart(graficaComparacion1, {
    type: "doughnut",
    data: {
        labels: ["Reserva", "Uso comun"],
        datasets: [{
            data: [reservacontodo, totalUso],
            backgroundColor: ["#120992", "#278fd4"]
        }]
    },
    plugins: [ChartDataLabels],

    options: {
        plugins: {
            legend: {
                display: false
            },
            datalabels: {
                formatter: (value) => {
                    const porcentaje = ingresosTotales === 0 ? 0 : (value / ingresosTotales) * 100;
                    return porcentaje.toFixed(1) + "%";
                },
                color: "white",
                font: {
                    weight: "bold",
                    size: 12
                }
            }
        }
    }
})
inputt.addEventListener("change", () => {
    ocupacion1.fill(0)
    uso1.fill(0);
    const valor = inputt.value;
    const conteodiaper = {};
    const conteodiaperingre = {};
    const conteousoper = {};
    const conteousoperingre = {};
    const conteoExtensionper = {};
    const conteoMultaper = {};
    usos.forEach((data) => {
        if (data.fecha === valor) {
            if (data.estado === "finalizado") {
                const inicio = Math.floor(convertirHoracomun(data.horaEntrada) / 3600);
                const fin = Math.ceil(convertirHoracomun(data.horaSalida) / 3600);
                for (let h = inicio; h < fin; h++) {
                    uso1[h]++;
                }
                if (!conteousoper[data.fecha]) {
                    conteousoper[data.fecha] = 0;
                }
                if (!conteousoperingre[data.fecha]) {
                    conteousoperingre[data.fecha] = 0;
                }
                conteousoper[data.fecha]++
                conteousoperingre[data.fecha] += data.precio
            }
        }
    })
    reservas.forEach((data) => {
        const estado = obtenerEstado(
            data.fecha,
            data.horaEntrada,
            data.horaSalida,
            data.finalizadaAntes
        )
        if (data.fecha === valor) {
            if (estado === "activa" || estado === "finalizada") {
                const inicio = Math.floor(convertirHora(data.horaEntrada) / 60);
                const fin = Math.ceil(convertirHora(data.horaSalida) / 60);
                for (let h = inicio; h < fin; h++) {
                    ocupacion1[h]++;
                }
            }
            if (data.extensionMinutos) {
                if (!conteoExtensionper[data.fecha]) {
                    conteoExtensionper[data.fecha] = 0;
                }
                conteoExtensionper[data.fecha] += data.PrecioExtension;
            }
            if (data.penalizado) {
                if (data.finalizadaAntes === false) {
                    if (!conteoMultaper[data.fecha]) {
                        conteoMultaper[data.fecha] = 0;
                    }
                    conteoMultaper[data.fecha] += data.costoAdicional;
                }
            }
            if (!conteodiaper[data.fecha]) {
                conteodiaper[data.fecha] = 0;
            }
            if (!conteodiaperingre[data.fecha]) {
                conteodiaperingre[data.fecha] = 0;
            }
            conteodiaper[data.fecha]++;
            conteodiaperingre[data.fecha] += data.precio;

        }

    });
    htmlusos = `<svg  xmlns="http://www.w3.org/2000/svg" class="icono_principal" width="24" height="24"  
                fill="currentColor" viewBox="0 0 24 24" >
                <path d="M20 7h-3V3c0-.33-.16-.64-.43-.82a.98.98 0 0 0-.92-.11L3.28 6.82C2.51 7.11 2 7.87 2 8.69V20c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m-5-2.54V7H8.39zM4 20V9h16v2h-5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h5v2zm16-4h-5v-3h5z"></path>
                </svg>
                 <center><h4>Usos Comunes</h4> 
                 <h2>${conteousoper[valor] || 0}</h2></center>`
    htmlreservas = `<svg  xmlns="http://www.w3.org/2000/svg" class="icono_principal" width="24" height="24"  
                fill="currentColor" viewBox="0 0 24 24" >
                <path d="M20 7h-3V3c0-.33-.16-.64-.43-.82a.98.98 0 0 0-.92-.11L3.28 6.82C2.51 7.11 2 7.87 2 8.69V20c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m-5-2.54V7H8.39zM4 20V9h16v2h-5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h5v2zm16-4h-5v-3h5z"></path>
                </svg>
                 <center><h4>Reservas</h4> 
                 <h2>${conteodiaper[valor] || 0}</h2></center>`
    htmlComparacionuso = `<svg  xmlns="http://www.w3.org/2000/svg" class="icono_principal" width="24" height="24"  
                fill="currentColor" viewBox="0 0 24 24" >
                <path d="M20 7h-3V3c0-.33-.16-.64-.43-.82a.98.98 0 0 0-.92-.11L3.28 6.82C2.51 7.11 2 7.87 2 8.69V20c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m-5-2.54V7H8.39zM4 20V9h16v2h-5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h5v2zm16-4h-5v-3h5z"></path>
                </svg>
                 <center><h4>Comparacion Uso </h4> 
                 `
    htmlComparacionIngre = `<svg  xmlns="http://www.w3.org/2000/svg" class="icono_principal" width="24" height="24"  
                fill="currentColor" viewBox="0 0 24 24" >
                <path d="M20 7h-3V3c0-.33-.16-.64-.43-.82a.98.98 0 0 0-.92-.11L3.28 6.82C2.51 7.11 2 7.87 2 8.69V20c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m-5-2.54V7H8.39zM4 20V9h16v2h-5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h5v2zm16-4h-5v-3h5z"></path>
                </svg>
                 <center><h4>Comparacion Ingresos </h4> 
                 `
    const totalReservasPer = Object.values(conteodiaper).reduce((a, b) => a + b, 0);
    const totalIngresosReservasPer = Object.values(conteodiaperingre).reduce((a, b) => a + b, 0);
    const totalUsoper = Object.values(conteousoper).reduce((a, b) => a + b, 0);
    const totalUsoIngresoper = Object.values(conteousoperingre).reduce((a, b) => a + b, 0);
    const totalExtensionIngresoper = Object.values(conteoExtensionper).reduce((a, b) => a + b, 0);
    const totalPenalIngresoper = Object.values(conteoMultaper).reduce((a, b) => a + b, 0);
    const totalUsosper = totalUsoper + totalReservasPer;
    const totalReservaContodo=totalIngresosReservasPer+totalExtensionIngresoper+totalPenalIngresoper;
    const totalIngresosPer = totalIngresosReservasPer + totalUsoIngresoper + totalExtensionIngresoper + totalPenalIngresoper;
    htmldia = `<svg  xmlns="http://www.w3.org/2000/svg" class="icono_principal" width="24" height="24"  
                fill="currentColor" viewBox="0 0 24 24" >
                <path d="M20 7h-3V3c0-.33-.16-.64-.43-.82a.98.98 0 0 0-.92-.11L3.28 6.82C2.51 7.11 2 7.87 2 8.69V20c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m-5-2.54V7H8.39zM4 20V9h16v2h-5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h5v2zm16-4h-5v-3h5z"></path>
                </svg>
                 <center><h4>Ingresos</h4> 
                 <h2> $${totalIngresosPer}</h2></center>`
    htmldi = `<svg  xmlns="http://www.w3.org/2000/svg" class="icono_principal" width="24" height="24"  
                    fill="currentColor" viewBox="0 0 24 24" >
                    <path d="M21 11h-3V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v13c0 1.65 1.35 3 3 3h14c1.65 0 3-1.35 3-3v-6c0-.55-.45-1-1-1M5 19c-.55 0-1-.45-1-1V5h12v13a3 3 0 0 0 .17 1zm15-1c0 .55-.45 1-1 1s-1-.45-1-1v-5h2z"></path><path d="M6 7h8v2H6zm0 4h8v2H6zm5 4h3v2h-3z"></path>
                    </svg>
                 <center><h4>Uso</h4> 
                 <h2> ${totalUsosper}</h2></center>`

    if (graficaa) {
        graficaa.destroy();
    }
    graficaa = new Chart(graficaingresos, {
        type: "doughnut",
        data: {
            labels: ["ingresos", "meta"],
            datasets: [{
                data: [totalIngresosPer, Math.max(dataconfig.metaIngreso - totalIngresosPer, 0)],
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
                            return Math.min((totalIngresosPer / dataconfig.metaIngreso) * 100, 100).toFixed(0) + "%";
                        }
                        return "";
                    },
                    color: "white",
                    font: {
                        size: 11,
                        weight: "bold"
                    }
                }
            }
        }
    })
    if (grafica3) {
        grafica3.destroy();
    }
    grafica3 = new Chart(graficadiauso, {
        type: "doughnut",
        data: {
            labels: ["ingresos", "meta"],
            datasets: [{
                data: [totalUsosper, Math.max(dataconfig.metaGeneral - totalUsosper, 0)],
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
                                (totalUsosper / dataconfig.metaGeneral) * 100, 100
                            ).toFixed(0) + "%";
                        }
                        return "";
                    },
                    color: "white",
                    font: {
                        size: 11,
                        weight: "bold"
                    }
                }
            }
        }
    })
    if (graficahoras) {
        graficahoras.destroy();
    }
    graficahoras = new Chart(horass, {
        type: "bar",
        data: {
            labels: horas,
            datasets: [{
                label: "Ocupaciones del dia ",
                data: ocupacion1
            },
            {
                label: "Uso común",
                data: uso1
            }
            ]
        }
    })
    if (graficausocomun) {
        graficausocomun.destroy();
    }
    graficausocomun = new Chart(graficaUsos, {
        type: "doughnut",
        data: {
            labels: ["ingresos", "meta"],
            datasets: [{
                data: [totalUsoper, Math.max(dataconfig.metaUsos - totalUsoper, 0)],
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
                            return Math.min((totalUsoper / dataconfig.metaUsos) * 100, 100).toFixed(0) + "%";
                        }
                        return "";
                    },
                    color: "white",
                    font: {
                        size: 11,
                        weight: "bold"
                    }
                }
            }
        }
    })
    if (graficareservas) {
        graficareservas.destroy();
    }
    graficareservas = new Chart(graficaReservas, {
        type: "doughnut",
        data: {
            labels: ["ingresos", "meta"],
            datasets: [{
                data: [totalReservasPer, Math.max(dataconfig.metaReservas - totalReservasPer, 0)],
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
                            return Math.min((totalReservasPer / dataconfig.metaReservas) * 100, 100).toFixed(0) + "%";
                        }
                        return "";
                    },
                    color: "white",
                    font: {
                        size: 11,
                        weight: "bold"
                    }
                }
            }
        }
    })
    if (graficaComparacionuso) {
        graficaComparacionuso.destroy();
    }
    graficaComparacionuso = new Chart(graficaComparacion, {
        type: "doughnut",
        data: {
            labels: ["Reserva", "Uso Comun"],
            datasets: [{
                data: [totalReservasPer, totalUsoper],
                backgroundColor: ["#120992", "#77bbe9"]
            }]
        },
        plugins: [ChartDataLabels],

        options: {
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    formatter: (value) => {
                        const porcentaje = totalUsosper === 0 ? 0 : (value / totalUsosper) * 100;
                        return porcentaje.toFixed(1) + "%";
                    },
                    color: "white",
                    font: {
                        weight: "bold",
                        size: 11
                    }
                }
            }
        }
    })
    if (graficaComparacionIngre) {
        graficaComparacionIngre.destroy();
    }
    graficaComparacionIngre = new Chart(graficaComparacion1, {
        type: "doughnut",
        data: {
            labels: ["Reserva", "Uso comun"],
            datasets: [{
                data: [totalReservaContodo, totalUsoIngresoper],
                backgroundColor: ["#120992", "#278fd4"]
            }]
        },
        plugins: [ChartDataLabels],

        options: {
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    formatter: (value) => {
                        const porcentaje = totalIngresosPer === 0 ? 0 : (value / totalIngresosPer) * 100;
                        return porcentaje.toFixed(1) + "%";
                    },
                    color: "white",
                    font: {
                        weight: "bold",
                        size: 11
                    }
                }
            }
        }
    })

    dia.innerHTML = htmldia;
    diaa.innerHTML = htmldi;
    diareservas.innerHTML = htmlreservas;
    diausos.innerHTML = htmlusos;
    diaComparacion.innerHTML = htmlComparacionuso
    diaComparacion1.innerHTML = htmlComparacionIngre

});
boton.addEventListener("click", () => {
    const inicio = document.getElementById("fechaInicio").value;
    const fin = document.getElementById("fechaFin").value;
    const conteo = {}
    const conteo1 = {}
    const conteo2 = {}
    const conteo3 = {}
    usos.forEach((data) => {
        if (data.fecha >= inicio && data.fecha <= fin) {
            if (data.estado === "finalizado") {
                if (!conteo2[data.fecha]) {
                    conteo2[data.fecha] = 0;
                }
                if (!conteo3[data.fecha]) {
                    conteo3[data.fecha] = 0;
                }
            }
            conteo2[data.fecha]++;
            conteo3[data.fecha] += data.precio;
        }
    })
    reservas.forEach((data) => {
        if (data.fecha >= inicio && data.fecha <= fin) {
            if (!conteo[data.fecha]) {
                conteo[data.fecha] = 0;
            }
            if (!conteo1[data.fecha]) {
                conteo1[data.fecha] = 0;
            }
            conteo[data.fecha]++;
            conteo1[data.fecha] += data.precio;
        }
    });

    if (Object.keys(conteo).length == 0) {
        alert("no hay reservas")
        return;
    }
    if (Object.keys(conteo1).length == 0) {
        alert("no hay reservas")
        return;
    }
    const labels = Object.keys(conteo);
    const datos = Object.values(conteo);
    const labels1 = Object.keys(conteo1);
    const datos1 = Object.values(conteo1);
    const datos2 = Object.values(conteo2)
    const datos3 = Object.values(conteo3)
    if (grafica) {
        grafica.destroy();
    }
    if (grafica2) {
        grafica2.destroy();
    }
    const ctx = document.getElementById("grafica");
    const ctx1 = document.getElementById("grafica1");
    grafica = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Reservas",
                data: datos
            },
            {
                label: "Uso comun",
                data: datos2
            }
            ]
        }
    })
    grafica2 = new Chart(ctx1, {
        type: "bar",
        data: {
            labels: labels1,
            datasets: [{
                label: "Ingresos Reservas",
                data: datos1
            },
            {
                label: "Ingresos Uso Comun",
                data: datos3
            }
            ]
        }
    })
})
const botonexport = document.getElementById("exportar");
botonexport.addEventListener("click", () => {
    const inicio = document.getElementById("fechaInicio").value;    
    const fin = document.getElementById("fechaFin").value;
    const datosexcel = [];
    if(!inicio||!fin){
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor, selecciona un rango de fechas válido.',
        });
        return;
    } 
    if (inicio > fin) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'La fecha de inicio no puede ser mayor que la fecha de fin.',
        });
        return;
    }
    reservas.forEach((data) => {
        if (data.fecha >= inicio && data.fecha <= fin) {
            datosexcel.push({
                Tipo: "Reserva",
                Fecha: data.fecha,
                HoraEntrada: data.horaEntrada,
                HoraSalida: data.horaSalida,
                Precio: data.precio,
                PrecioExtension: data.PrecioExtension || 0,
                CostoAdicional: data.costoAdicional || 0,
            });
        };
        
    });
    usos.forEach((data) => {
        if (data.fecha >= inicio && data.fecha <= fin) {
            if(data.estado==="finalizado"){
                datosexcel.push({
                    Tipo: "Uso comun",
                    Fecha: data.fecha,
                    HoraEntrada: data.horaEntrada,
                    HoraSalida: data.horaSalida,
                    Precio: data.precio,
                });
            }
        }
    });
const hojita =XLSX.utils.json_to_sheet(datosexcel);
const libro = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(libro, hojita, "Estadisticas");
XLSX.writeFile(libro, `estadisticas_${inicio}_a_${fin}.xlsx`);
});
});




