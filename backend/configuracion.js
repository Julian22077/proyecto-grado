import { crearconfig, obetenerconfig, reservasVigentes } from "./firebase.js";
const form = document.getElementById("config")
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const metaingresos = Number(document.getElementById("metaingresos").value)
    const metageneral = Number(document.getElementById("metageneral").value)
    const minutoCobro = Number(document.getElementById("minutoCobro").value)
    const metaReservas = Number(document.getElementById("metareservas").value)
    const metaUsos = Number(document.getElementById("metausos").value)
    const ahora = new Date();
    const fehahoy = ahora.toLocaleDateString("sv-SE")
    const hay= await reservasVigentes();
    let dataconfig;

    const config = await obetenerconfig();
    if (config.exists()) {
        dataconfig = config.data();

    }
    if(hay){
         await Swal.fire({
            title: "Error",
            text: "No se pueden configurar si hay reservas pendientes o activas ",
            icon: "error",
        });
        return;
    }
    if (minutoCobro > 253) {
        await Swal.fire({
            title: "Error",
            text: "el valor no puede superar los 253",
            icon: "error",
        });
        return;
    }
    if (dataconfig.fechaConfigurado === fehahoy) {
        await Swal.fire({
            title: "Error",
            text: "Solo se permite una configuración por dia",
            icon: "error",
        });
        return;
    }
    try {
        if (metaingresos === 0 || metageneral === 0 || minutoCobro === 0||metageneral===0||metaUsos===0) {
            await Swal.fire({
                title: "Error",
                text: "Por favor rellene los de espacios a configurar",
                icon: "error",
            });
        } else {
            await crearconfig(metaingresos, metageneral, metaReservas,metaUsos, minutoCobro,);
            await Swal.fire({
                title: "Configuracion Guardada",
                text: "Se ha configurado las metas diarias",
                icon: "succes",
            });
            form.reset()
        }

    } catch (error) {
        console.error(error);
        await Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error",
        });
    }
})