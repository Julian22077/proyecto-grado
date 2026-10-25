import {  auth, obtenerEstado } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { convertirHora, convertirHoracomun } from "./utils.js";
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
        window.location.href = "login.html";
        return;
    }
    if (usuarioAuth.email !== "julian.lozanoh@uniagustiniana.edu.co") {
        window.location.href = "usuario.html";
        return;
    }
    const token = await usuarioAuth.getIdToken();

let dataconfig;

 const configg=await fetch("https://proyecto-grado-rouge.vercel.app/configuracion",{
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
const usosadmin=await fetch("https://proyecto-grado-rouge.vercel.app/totalusos",{
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
const reservasadmin=await fetch("https://proyecto-grado-rouge.vercel.app/totalreservas",{
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
const fechahoyy = new Date().toLocaleDateString("sv-SE");
const siguiente = new Date();
siguiente.setDate(siguiente.getDate() - 30);
const fechaSiguiente = siguiente.toLocaleDateString("sv-SE");
inputt.min = fechaSiguiente;
inputt.max = fechahoyy;
let grafica = null;
let grafica2 = null;
let graficaa = null;
let grafica3 = null;
let graficahoras = null;
let graficausocomun = null;
let graficareservas = null;
let graficaComparacionuso = null;
let graficaComparacionIngre = null;
/* Paleta visual (solo diseño) */
const C = {
    ink: "#c4a484",
    steel: "#d4894a",
    steelDeep: "#b56d34",
    track: "#314556",
    grid: "rgba(231, 238, 244, 0.1)",
    muted: "#93a6b6",
    white: "#f3eee6",
};
const doughnutLook = {
    cutout: "68%",
    responsive: true,
    maintainAspectRatio: true,
    layout: { padding: 4 },
};
const barScaleLook = {
    x: {
        ticks: {
            color: C.muted,
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
            font: { family: "IBM Plex Mono, monospace", size: 10, weight: "500" },
        },
        grid: { display: false, drawBorder: false },
        border: { display: false },
    },
    y: {
        beginAtZero: true,
        ticks: {
            precision: 0,
            stepSize: 1,
            color: C.muted,
            font: { family: "IBM Plex Mono, monospace", size: 10, weight: "500" },
        },
        grid: { color: C.grid, drawBorder: false },
        border: { display: false },
    },
};
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
htmlusos = `<span class="kpi-num">${conteouso[fechahoy] || 0}</span>`
htmlComparacionuso = ``
htmlComparacionIngre = ``
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
htmlreservas = `<span class="kpi-num">${conteodia[fechahoy] || 0}</span>`
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
htmldia = `<span class="kpi-num">$${ingresosTotales}</span>`
htmldi = `<span class="kpi-num">${Usostotales}</span>`
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
            backgroundColor: [C.steel, C.track],
            borderWidth: 0,
            hoverOffset: 4,
        }]
    },
    plugins: [ChartDataLabels],

    options: {
        ...doughnutLook,
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
                color: C.white,
                font: {
                    size: 14,
                    weight: "700",
                    family: "Manrope, sans-serif"
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
            backgroundColor: [C.steel, C.track],
            borderWidth: 0,
            hoverOffset: 4,
        }]
    },
    plugins: [ChartDataLabels],

    options: {
        ...doughnutLook,
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
                color: C.white,
                font: {
                    size: 14,
                    weight: "700",
                    family: "Manrope, sans-serif"
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
            label: "Reservas",
            data: ocupacion,
            backgroundColor: C.steel,
            borderColor: C.steelDeep,
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 16,
            categoryPercentage: 0.7,
            barPercentage: 0.85,
        },
        {
            label: "Uso común",
            data: uso,
            backgroundColor: C.ink,
            borderColor: "#8f7964",
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 16,
            categoryPercentage: 0.7,
            barPercentage: 0.85,
        }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: {
                display: true,
                position: "top",
                align: "end",
                labels: {
                    color: C.ink,
                    boxWidth: 12,
                    boxHeight: 12,
                    padding: 16,
                    font: { family: "Manrope, sans-serif", size: 12, weight: "600" },
                    usePointStyle: true,
                    pointStyle: "rectRounded",
                }
            },
            datalabels: { display: false }
        },
        scales: barScaleLook
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
            backgroundColor: [C.steel, C.track],
            borderWidth: 0,
            hoverOffset: 4,
        }]
    },
    plugins: [ChartDataLabels],

    options: {
        ...doughnutLook,
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
                color: C.white,
                font: {
                    size: 14,
                    weight: "700",
                    family: "Manrope, sans-serif"
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
            data: [totalReservas, Math.max(dataconfig.metaReservas - totalReservas, 0)],
            backgroundColor: [C.steel, C.track],
            borderWidth: 0,
            hoverOffset: 4,
        }]
    },
    plugins: [ChartDataLabels],

    options: {
        ...doughnutLook,
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
                color: C.white,
                font: {
                    size: 14,
                    weight: "700",
                    family: "Manrope, sans-serif"
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
        labels: ["Reserva", "Uso común"],
        datasets: [{
            data: [totalReservas, totalUsos],
            backgroundColor: [C.ink, C.steel],
            borderWidth: 0,
            hoverOffset: 4,
        }]
    },
    plugins: [ChartDataLabels],

    options: {
        ...doughnutLook,
        plugins: {
            legend: {
                display: true,
                position: "bottom",
                labels: {
                    color: C.ink,
                    boxWidth: 10,
                    padding: 12,
                    font: { family: "Manrope, sans-serif", size: 11, weight: "600" },
                    usePointStyle: true,
                    pointStyle: "circle",
                }
            },
            datalabels: {
                formatter: (value) => {
                    const porcentaje = Usostotales === 0 ? 0 : (value / Usostotales) * 100;
                    return porcentaje.toFixed(0) + "%";
                },
                color: C.white,
                font: {
                    weight: "700",
                    size: 12,
                    family: "Manrope, sans-serif"
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
        labels: ["Reserva", "Uso común"],
        datasets: [{
            data: [reservacontodo, totalUso],
            backgroundColor: [C.ink, C.steel],
            borderWidth: 0,
            hoverOffset: 4,
        }]
    },
    plugins: [ChartDataLabels],

    options: {
        ...doughnutLook,
        plugins: {
            legend: {
                display: true,
                position: "bottom",
                labels: {
                    color: C.ink,
                    boxWidth: 10,
                    padding: 12,
                    font: { family: "Manrope, sans-serif", size: 11, weight: "600" },
                    usePointStyle: true,
                    pointStyle: "circle",
                }
            },
            datalabels: {
                formatter: (value) => {
                    const porcentaje = ingresosTotales === 0 ? 0 : (value / ingresosTotales) * 100;
                    return porcentaje.toFixed(0) + "%";
                },
                color: C.white,
                font: {
                    weight: "700",
                    size: 12,
                    family: "Manrope, sans-serif"
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
    htmlusos = `<span class="kpi-num">${conteousoper[valor] || 0}</span>`
    htmlreservas = `<span class="kpi-num">${conteodiaper[valor] || 0}</span>`
    htmlComparacionuso = ``
    htmlComparacionIngre = ``
    const totalReservasPer = Object.values(conteodiaper).reduce((a, b) => a + b, 0);
    const totalIngresosReservasPer = Object.values(conteodiaperingre).reduce((a, b) => a + b, 0);
    const totalUsoper = Object.values(conteousoper).reduce((a, b) => a + b, 0);
    const totalUsoIngresoper = Object.values(conteousoperingre).reduce((a, b) => a + b, 0);
    const totalExtensionIngresoper = Object.values(conteoExtensionper).reduce((a, b) => a + b, 0);
    const totalPenalIngresoper = Object.values(conteoMultaper).reduce((a, b) => a + b, 0);
    const totalUsosper = totalUsoper + totalReservasPer;
    const totalReservaContodo=totalIngresosReservasPer+totalExtensionIngresoper+totalPenalIngresoper;
    const totalIngresosPer = totalIngresosReservasPer + totalUsoIngresoper + totalExtensionIngresoper + totalPenalIngresoper;
    htmldia = `<span class="kpi-num">$${totalIngresosPer}</span>`
    htmldi = `<span class="kpi-num">${totalUsosper}</span>`

    if (graficaa) {
        graficaa.destroy();
    }
    graficaa = new Chart(graficaingresos, {
        type: "doughnut",
        data: {
            labels: ["ingresos", "meta"],
            datasets: [{
                data: [totalIngresosPer, Math.max(dataconfig.metaIngreso - totalIngresosPer, 0)],
                backgroundColor: [C.steel, C.track],
            borderWidth: 0,
            hoverOffset: 4,
            }]
        },
        plugins: [ChartDataLabels],

        options: {
            ...doughnutLook,
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
                    color: C.white,
                    font: {
                        size: 14,
                        weight: "700",
                        family: "Manrope, sans-serif"
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
                backgroundColor: [C.steel, C.track],
            borderWidth: 0,
            hoverOffset: 4,
            }]
        },
        plugins: [ChartDataLabels],

        options: {
            ...doughnutLook,
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
                    color: C.white,
                    font: {
                        size: 14,
                        weight: "700",
                        family: "Manrope, sans-serif"
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
                label: "Reservas",
                data: ocupacion1,
                backgroundColor: C.steel,
                borderColor: C.steelDeep,
                borderWidth: 1,
                borderRadius: 4,
                maxBarThickness: 16,
                categoryPercentage: 0.7,
                barPercentage: 0.85,
            },
            {
                label: "Uso común",
                data: uso1,
                backgroundColor: C.ink,
                borderColor: "#8f7964",
                borderWidth: 1,
                borderRadius: 4,
                maxBarThickness: 16,
                categoryPercentage: 0.7,
                barPercentage: 0.85,
            }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: {
                    display: true,
                    position: "top",
                    align: "end",
                    labels: {
                        color: C.ink,
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 16,
                        font: { family: "Manrope, sans-serif", size: 12, weight: "600" },
                        usePointStyle: true,
                        pointStyle: "rectRounded",
                    }
                },
                datalabels: { display: false }
            },
            scales: barScaleLook
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
                backgroundColor: [C.steel, C.track],
            borderWidth: 0,
            hoverOffset: 4,
            }]
        },
        plugins: [ChartDataLabels],

        options: {
            ...doughnutLook,
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
                    color: C.white,
                    font: {
                        size: 14,
                        weight: "700",
                        family: "Manrope, sans-serif"
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
                backgroundColor: [C.steel, C.track],
            borderWidth: 0,
            hoverOffset: 4,
            }]
        },
        plugins: [ChartDataLabels],

        options: {
            ...doughnutLook,
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
                    color: C.white,
                    font: {
                        size: 14,
                        weight: "700",
                        family: "Manrope, sans-serif"
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
                backgroundColor: [C.ink, C.steel],
            borderWidth: 0,
            hoverOffset: 4,
            }]
        },
        plugins: [ChartDataLabels],

        options: {
            ...doughnutLook,
            plugins: {
                legend: {
                    display: true,
                    position: "bottom",
                    labels: {
                        color: C.ink,
                        boxWidth: 10,
                        padding: 12,
                        font: { family: "Manrope, sans-serif", size: 11, weight: "600" },
                        usePointStyle: true,
                        pointStyle: "circle",
                    }
                },
                datalabels: {
                    formatter: (value) => {
                        const porcentaje = totalUsosper === 0 ? 0 : (value / totalUsosper) * 100;
                        return porcentaje.toFixed(0) + "%";
                    },
                    color: C.white,
                    font: {
                        weight: "700",
                        size: 12,
                        family: "Manrope, sans-serif"
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
            labels: ["Reserva", "Uso común"],
            datasets: [{
                data: [totalReservaContodo, totalUsoIngresoper],
                backgroundColor: [C.ink, C.steel],
            borderWidth: 0,
            hoverOffset: 4,
            }]
        },
        plugins: [ChartDataLabels],

        options: {
            ...doughnutLook,
            plugins: {
                legend: {
                    display: true,
                    position: "bottom",
                    labels: {
                        color: C.ink,
                        boxWidth: 10,
                        padding: 12,
                        font: { family: "Manrope, sans-serif", size: 11, weight: "600" },
                        usePointStyle: true,
                        pointStyle: "circle",
                    }
                },
                datalabels: {
                    formatter: (value) => {
                        const porcentaje = totalIngresosPer === 0 ? 0 : (value / totalIngresosPer) * 100;
                        return porcentaje.toFixed(0) + "%";
                    },
                    color: C.white,
                    font: {
                        weight: "700",
                        size: 12,
                        family: "Manrope, sans-serif"
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
const rango1= document.getElementById("fechaInicio");
const rango2= document.getElementById("fechaFin");
rango1.min= fechaSiguiente
rango1.max= fechahoyy
rango2.min= fechaSiguiente
rango2.max= fechahoyy
boton.addEventListener("click", async () => {
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
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No hay datos disponibles para el rango de fechas seleccionado.',
        });
        return;
    }
    if (Object.keys(conteo1).length == 0) {
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No hay datos disponibles para el rango de fechas seleccionado.',
        });
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
                data: datos,
                borderColor: C.steel,
                backgroundColor: "rgba(212, 137, 74, 0.2)",
                borderWidth: 2.5,
                pointBackgroundColor: C.steel,
                pointBorderColor: C.white,
                pointBorderWidth: 2,
                pointRadius: 4,
                tension: 0.25,
                fill: true,
            },
            {
                label: "Uso común",
                data: datos2,
                borderColor: C.ink,
                backgroundColor: "rgba(196, 164, 132, 0.16)",
                borderWidth: 2.5,
                pointBackgroundColor: C.ink,
                pointBorderColor: C.white,
                pointBorderWidth: 2,
                pointRadius: 4,
                tension: 0.25,
                fill: true,
            }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: C.ink,
                        font: { family: "Manrope, sans-serif", size: 12, weight: "600" },
                        usePointStyle: true,
                    }
                },
                datalabels: { display: false }
            },
            scales: barScaleLook
        }
    })
    grafica2 = new Chart(ctx1, {
        type: "bar",
        data: {
            labels: labels1,
            datasets: [{
                label: "Ingresos reservas",
                data: datos1,
                backgroundColor: C.steel,
                borderColor: C.steelDeep,
                borderWidth: 1,
                borderRadius: 4,
                maxBarThickness: 28,
            },
            {
                label: "Ingresos uso común",
                data: datos3,
                backgroundColor: C.ink,
                borderRadius: 4,
                maxBarThickness: 28,
            }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: C.ink,
                        font: { family: "Manrope, sans-serif", size: 12, weight: "600" },
                        usePointStyle: true,
                        pointStyle: "rectRounded",
                    }
                },
                datalabels: { display: false }
            },
            scales: barScaleLook
        }
    })
})
const botonexport = document.getElementById("exportar");
botonexport.addEventListener("click", async () => {
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
    const dias = Math.round((new Date(fin) - new Date(inicio)) / 86400000);
    if (dias < 15) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El rango de exportación debe ser de al menos 15 días.',
        });
        return;
    }
    if (dias > 30) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El rango de exportación no puede superar los 30 días.',
        });
        return;
    }
    reservas.forEach((data) => {
        const estado = obtenerEstado(
            data.fecha,
            data.horaEntrada,
            data.horaSalida,
            data.finalizadaAntes
        )
        if (data.fecha >= inicio && data.fecha <= fin) {
            if(estado=="finalizada"){
                datosexcel.push({
                Tipo: "Reserva",
                Fecha: data.fecha,
                HoraEntrada: data.horaEntrada,
                HoraSalida: data.horaSalida,
                Precio: data.precio,
                PrecioExtension: data.PrecioExtension || 0,
                CostoAdicional: data.costoAdicional || 0,
            });
            }
            
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
const nombre = `estadisticas_${inicio}_a_${fin}.xlsx`;
if (window.Capacitor?.isNativePlatform?.()) {
    try {
        const base64 = XLSX.write(libro, { bookType: "xlsx", type: "base64" });
        const guardado = await window.Capacitor.Plugins.Filesystem.writeFile({
            path: nombre,
            data: base64,
            directory: "CACHE"
        });
        await window.Capacitor.Plugins.Share.share({
            title: nombre,
            files: [guardado.uri],
            dialogTitle: "Exportar Excel"
        });
    } catch (error) {
        const mensaje = String(error?.message || error).toLowerCase();
        if (mensaje.includes("cancel") || mensaje.includes("abort")) return;
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo exportar el archivo."
        });
    }
    return;
}
XLSX.writeFile(libro, nombre);
});
});




