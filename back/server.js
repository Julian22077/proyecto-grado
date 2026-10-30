import "./zonahoraria.js";
import express from "express";
import crypto from "crypto"
import { getAuth } from "firebase-admin/auth"
import dotenv from "dotenv";
import cors from "cors"
import rateLimit from "express-rate-limit"
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { convertirHora, hayConflicto, minutosAHora, convertirHoracomun, precioPorMinutos } from "../backend/utils.js";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import multer from "multer"
import { leerCache, guardarCache, borrarCache } from "./cache.js"
const app = express();
const upload = multer({
    storage: multer.memoryStorage()
});
const limite = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => {
        return req.uid
    },
    message: {
        error: "Muchas solicitudes "
    },
    standardHeaders: true,
    legacyHeaders: false
})
dotenv.config();
app.use(cors({ origin: ["https://calatrava-parqueadero-para-ti.vercel.app", "http://127.0.0.1:5500", "https://localhost", "http://localhost", "capacitor://localhost"] }))
const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
);
if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}
const db = getFirestore();
const adminauth = getAuth();
app.use(express.json())
const verficarUsuario = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Token invalido" });
        }
        const token = header.split("Bearer ")[1];
        const tokenfinal = await adminauth.verifyIdToken(token, true);
        const usuario = await adminauth.getUser(tokenfinal.uid);
        req.uid = tokenfinal.uid;
        req.email = tokenfinal.email
        req.admin = tokenfinal.admin === true
        req.displayName = usuario.displayName
        next();
    } catch (error) {
        return res.status(401).json({ error: error.message })
    }
}

async function esCuentaAdmin(correo) {
    if (!correo) return false;
    try {
        const cuenta = await adminauth.getUserByEmail(correo);
        return cuenta.customClaims?.admin === true;
    } catch (error) {
        return false;
    }
}

app.post("/disponibilidad", verficarUsuario, limite, async (req, res) => {
    try {
        const uid = req.uid;
        const { fecha, horaEntrada, horaSalida } = req.body;
        if (!fecha || !horaEntrada || !horaSalida) {
            return res.status(400).json({ error: "Faltan datos requeridos" });
        }
        const nuevaEntrada = convertirHora(horaEntrada);
        const nuevaSalida = convertirHora(horaSalida);
        const horaabren = 4 * 60 + 30;
        const horacierra = 23 * 60;
        if (nuevaEntrada < horaabren || nuevaSalida > horacierra) {
            return res.status(400).json({ error: "La hora de entrada o salida está fuera de los horaios de uso del parqueadero" });
        }
        const ahora = new Date();
        const fechahoy = ahora.toLocaleDateString("sv-SE");
        const mañana = new Date();
        mañana.setDate(ahora.getDate() + 1);
        const fechamañana = mañana.toLocaleDateString("sv-SE");
        if (fecha !== fechahoy && fecha !== fechamañana) {
            return res.status(400).json("La fecha dde reserva debe ser entre hoy y mañana ");
        }
        if (fecha === fechahoy) {
            const horaactual = ahora.getHours() * 60 + ahora.getMinutes();
            if (nuevaEntrada < horaactual) {
                return res.status(400).json({ error: "La hora de entrada no ya culmino" });
            }
        }

        const parqueaderos = await db.collection("parqueaderos").where("tipo", "==", "reserva").get();
        if (parqueaderos.empty) {
            return res.status(400).json({ error: "No hay espacios con reservas" })
        }
        const verficacion = await db.runTransaction(async (transaccion) => {
            const reservashoy = db.collection("reservas").where("fecha", "==", fecha)
            const reserva = await transaccion.get(reservashoy);
            const colita = db.collection("colaespera").where("fecha", "==", fecha).where("estado", "==", "prioritario")
            const cola = await transaccion.get(colita);
            const bloqueos = db.collection("bloqueos").where("fecha", "==", fecha);
            const bloqueo = await transaccion.get(bloqueos);
            const tiempoahora = Date.now()
            for (const bloqueiinfo of bloqueo.docs) {
                const data = bloqueiinfo.data();
                if (data.uid !== uid) {
                    continue;
                }
                if (data.expira && data.expira.toMillis() <= tiempoahora) {
                    continue;
                }
                const entrablque = convertirHora(data.horaEntrada)
                const salidabloque = convertirHora(data.horaSalida);
                if (entrablque === nuevaEntrada && salidabloque === nuevaSalida) {
                    return {
                        bloqueoId: bloqueiinfo.id
                    }
                }

                transaccion.delete(bloqueiinfo.ref)
            }
            for (const parqueadero of parqueaderos.docs) {
                let disponible = true;
                for (const reservainfo of reserva.docs) {
                    const data = reservainfo.data();
                    if (data.cancelado) {
                        continue;
                    }
                    if (data.uid === uid) {
                        throw new Error(" Ya posees una reserva para este dia ")
                    }
                    if (data.parqueaderoId !== parqueadero.id) {
                        continue;
                    }
                    const horaentrada = convertirHora(data.horaEntrada);
                    let horasalida;
                    if (data.HoraSalidaReal) {
                        horasalida = convertirHora(data.HoraSalidaReal);
                    } else {
                        horasalida = convertirHora(data.horaSalida);
                    }
                    if (hayConflicto(nuevaEntrada, nuevaSalida, horaentrada, horasalida)) {
                        disponible = false;
                        break;
                    }
                }
                for (const colitaa of cola.docs) {
                    const data = colitaa.data();
                    if (data.parqueaderoId !== parqueadero.id) {
                        continue;
                    }
                    if (data.uid === uid) {
                        continue;
                    }
                    const inicio = convertirHora(data.horaDisponible)
                    const fin = convertirHora(data.horaLimite);
                    if (hayConflicto(nuevaEntrada, nuevaSalida, inicio, fin)) {
                        disponible = false;
                        break
                    }
                }

                for (const bloqueinfo of bloqueo.docs) {
                    const data = bloqueinfo.data();
                    if (data.uid === uid) {
                        continue;
                    }
                    if (data.parqueaderoId !== parqueadero.id) {
                        continue;
                    }
                    if (data.expira && data.expira.toMillis() <= tiempoahora) {
                        continue;
                    }
                    const iniciobloque = convertirHora(data.horaEntrada);
                    const finbloqueo = convertirHora(data.horaSalida);
                    if (hayConflicto(nuevaEntrada, nuevaSalida, iniciobloque, finbloqueo)) {
                        disponible = false;
                        break;
                    }
                }
                if (disponible) {
                    const refrenciabloque = db.collection("bloqueos").doc();
                    const expira = new Date(Date.now() + 5 * 60 * 1000);
                    transaccion.create(refrenciabloque, { uid, parqueaderoId: parqueadero.id, fecha, horaEntrada, horaSalida, creado: new Date(), expira })
                    return {
                        bloqueoId: refrenciabloque.id
                    }

                }

            }
            throw new Error("No hay espacios disponibles para esas horas");
        })
        return res.json(verficacion)
    } catch (error) {
        if (error.message === "Ya posees una reserva para este dia") {
            return res.status(400).json({ error: error.message })
        }
        if (error.message === "No hay espacios disponibles para esas horas") {
            return res.status(409).json({ error: error.message })
        }
        return res.status(500).json({ error: error.message });
    }
});

app.post("/firma", verficarUsuario, limite, async (req, res) => {
    try {
        const uid = req.uid
        const { horaEntrada, horaSalida, bloqueoId } = req.body
        if (!horaEntrada || !horaSalida || !bloqueoId) {
            return res.status(400).json({ error: "faltan datos " })
        }
        const bloqueoRef = db.collection("bloqueos").doc(bloqueoId);
        const bloqueoSnap = await bloqueoRef.get();
        if (!bloqueoSnap.exists || bloqueoSnap.data().uid !== uid || bloqueoSnap.data().horaEntrada !== horaEntrada || bloqueoSnap.data().horaSalida !== horaSalida) {
            return res.status(400).json({ error: "Los datos no coinciden " })
        }
        if (bloqueoSnap.data().expira && bloqueoSnap.data().expira.toMillis() <= Date.now()) {
            return res.status(400).json({ error: "El bloqueo ha expirado" })
        }
        const usuario = await db.collection("usuarios").doc(uid).get()
        const userData = usuario.data()
        const comfiguracion = await db.collection("configuracion").doc("general").get()
        const minuto = comfiguracion.data();
        const entrada = convertirHora(horaEntrada)
        const salida = convertirHora(horaSalida)
        const diferencia = salida - entrada
        let precio_minuto;
        if(/^[A-Z]{3}[0-9]{3}$/.test(userData.placa)){
             precio_minuto=minuto.minutosCobro;
        }
        if(/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(userData.placa)){
             precio_minuto=minuto.minutosCobroMoto;
        }
        const diferencia1 = precioPorMinutos(diferencia, precio_minuto);
        const monto = diferencia1 * 100;
        const moneda = "COP";
        const refrencia = "RES-" + uid + "-" + Date.now()

        const llaveintegridad = process.env.LLAVE_INTEGRIDAD_WOMPI;
        if (!llaveintegridad) {
            return res.status(500).json({ error: "mala llave " })
        }
        const texto = refrencia + monto + moneda + llaveintegridad
        const firma = crypto.createHash("sha256").update(texto).digest("hex");
        await bloqueoRef.update({ referencia: refrencia, monto, nombre: req.displayName || "" });
        return res.json({ firma, referencia: refrencia, monto });



    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message
        });
    }
})

app.post("/hacerreserva", verficarUsuario, limite, async (req, res) => {
    try {
        const uid = req.uid;
        const { nombre, bloqueoId, fecha, horaEntrada, horaSalida, idtransaccion, monto, referencia } = req.body
        if (!nombre || !bloqueoId || !fecha || !horaEntrada || !horaSalida) {
            return res.status(400).json({ error: "faltan datos " });
        }
        const yaHecha = await db.collection("reservas").where("referencia", "==", referencia).limit(1).get();
        if (!yaHecha.empty && yaHecha.docs[0].data().uid === uid) {
            return res.json({ reservaID: yaHecha.docs[0].id });
        }
        const comfiguracion = await db.collection("configuracion").doc("general").get()
        const usuario = await db.collection("usuarios").doc(uid).get()
        const userData = usuario.data()
        const minuto = comfiguracion.data();
        const entrada = convertirHora(horaEntrada)
        const salida = convertirHora(horaSalida)
        const diferencia = salida - entrada
        let precio_minuto;
        if(/^[A-Z]{3}[0-9]{3}$/.test(userData.placa)){
             precio_minuto=minuto.minutosCobro;
        }
        if(/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(userData.placa)){
             precio_minuto=minuto.minutosCobroMoto;
        }
        const precio = precioPorMinutos(diferencia, precio_minuto);
        const montoreal = precio * 100;
        const abre = 4 * 60 + 30
        const cierra = 23 * 60
        if (entrada < abre || salida > cierra || salida < entrada) {
            return res.status(400).json({ error: "Horarios no validos" })
        }
        if (Number(monto) !== montoreal) {
            return res.status(400).json({ error: "EL monto no coincide con el rango de horas seleccioandas" })
        }
        const wompi = await fetch(`https://sandbox.wompi.co/v1/transactions/${idtransaccion}`)
        if (!wompi.ok) {
            return res.status(400).json({ error: "erro ene verificacion" })
        }
        const datoswompi = await wompi.json()
        const transaccion = datoswompi.data
        if (transaccion.status !== "APPROVED") {
            return res.status(400).json({ error: "el pago no se aprobo" })
        }
        if (Number(transaccion.amount_in_cents) !== montoreal) {
            return res.status(400).json({ error: "Monto no coincide" })
        }
        if (transaccion.reference !== referencia) {
            return res.status(400).json({ error: "referencia no coincide" })
        }


        const reser = db.collection("reservas").doc();
        const refbloqueo = db.collection("bloqueos").doc(bloqueoId)
        await db.runTransaction(async (trans) => {
            const bloqueo = await trans.get(refbloqueo);
            if (!bloqueo.exists) {
                throw new Error("el bloqueo no existe o ya fue utilizado ")
            }
            const data = bloqueo.data();
            if (data.uid !== uid) {
                throw new Error("el bloqueo para reservra no pertenece al usuario")
            }
            if (data.expira && data.expira.toMillis() <= Date.now()) {
                throw new Error("El bloqueo ha expirado")
            }
            if (data.fecha !== fecha || data.horaEntrada !== horaEntrada || data.horaSalida !== horaSalida || data.referencia !== referencia) {
                throw new Error("Los datos no coinciden ")
            }
            const parqueaderoId = data.parqueaderoId;
            trans.set(reser, {
                nombre,
                uid,
                parqueaderoId,
                fecha,
                horaEntrada,
                horaSalida,
                precio,
                placa: userData.placa,
                referencia,
                idtransaccion,
                extensionMinutos: false,
                minutosExtra: 0,
                HoraSalidaReal: "",
                minutosPasados: 0,
                costoAdicional: 0,
                penalizado: false,
                pagoPenalizacion: false,
                finalizadaAntes: false,
                cancelado: false,
                creado: new Date()
            })
            trans.delete(refbloqueo);
        })
        const colita = await db.collection("colaespera").where("fecha", "==", fecha).where("estado", "==", "espera").where("uid", "==", uid).get();
        if (colita.size > 0) {
            for (const colo of colita.docs) {
                await db.collection("colaespera").doc(colo.id).delete();
            }
        }
        borrarCache("totalreservas");
        return res.json({ reservaID: reser.id })
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            error: error.message
        });
    }
})

app.post("/validaraumento", verficarUsuario, limite, async (req, res) => {
    try {
        const { reservaID, minutosExtra } = req.body
        if (!reservaID || !minutosExtra) {
            return res.status(400).json({ error: "faltan dattos" })
        }
        if (minutosExtra > 60) {
            return res.status(400).json({ error: "El aumento maximo es de 60 muntos" })
        }
        if (minutosExtra <= 0) {
            return res.status(400).json({ error: "El tiempo extra debe ser mayo de 0 minutos" })
        }
        const refreservas = db.collection("reservas").doc(reservaID);
        const configuracion = await db.collection("configuracion").doc("general").get()
        const minuto = configuracion.data();
        const reservas = await refreservas.get();
        if (!reservas.exists) {
            return res.status(400).json({ error: "La reserva no existe" })
        }
        const reserva = reservas.data();
        if (reserva.extensionMinutos) {
            return res.status(400).json({ error: "La reserva ya se ha aumentado" })
        }
        const ahora = new Date();
        const fechahoy = ahora.toLocaleDateString("sv-SE")
        if (reserva.fecha !== fechahoy) {
            return res.status(400).json({ error: "Solo se pueden auemntar reservas de hoy " })
        }
        const minutosactuales = ahora.getHours() * 60 + ahora.getMinutes();
        const entradaActual = convertirHora(reserva.horaEntrada)
        const salidaActual = convertirHora(reserva.horaSalida)
        const restante = salidaActual - minutosactuales;
        if (minutosactuales < entradaActual) {
            return res.status(400).json({ error: "La reserva aun no ha iniciado" })
        }
        if (restante <= 0) {
            return res.status(400).json({ error: "La reserva ya finalizó" })
        }
        if (restante > 15) {
            return res.status(400).json({ error: "Solo se pueden aumentar reservas que le queden 15 minutos " })
        }
        const nuevaSalida = salidaActual + minutosExtra;
        const cierre = 23 * 60;
        const reservasdeespacio = await db.collection("reservas").where("fecha", "==", reserva.fecha).where("parqueaderoId", "==", reserva.parqueaderoId).get();
        let siguientereserva = null
        for (const reservi of reservasdeespacio.docs) {
            const data = reservi.data();
            if (reservi.id === reservaID) {
                continue;
            }
            const entradaexistente = convertirHora(data.horaEntrada);
            if (entradaexistente >= salidaActual) {
                if (siguientereserva === null || entradaexistente < siguientereserva) {
                    siguientereserva = entradaexistente;
                }
            }

        }
        const maximores = cierre - salidaActual;
        const maximodiponible = siguientereserva - salidaActual
        if (siguientereserva !== null && nuevaSalida > siguientereserva) {
            if (maximodiponible <= 0) {
                return res.status(400).json({ error: "No es posible extender la reserva, hay una inmediatamente existente" })
            }
            return res.status(400).json({ error: `Solos puedes extender hasta ${maximodiponible} minutos` })
        }
        if (nuevaSalida > cierre) {
            if (maximores <= 0) {
                return res.status(400).json({ error: "No se pueden aumentar la reserva, es mas del limite de atencion" })
            }
            return res.status(400).json({ error: `Solo puedes aumnetar hasta ${maximores} minutos` })
        }
        let precio_minuto;
        if (/^[A-Z]{3}[0-9]{3}$/.test(reserva.placa)) {
            precio_minuto = minuto.minutosCobro;
        }
        if (/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(reserva.placa)) {
            precio_minuto = minuto.minutosCobroMoto;
        }
        const nuevoPrecio = precioPorMinutos(Number(minutosExtra), precio_minuto);
        res.json({ reservaID: reservaID, nuevoPrecio: nuevoPrecio })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})
app.post("/firmaaumento", verficarUsuario, limite, async (req, res) => {
    try {
        const uid = req.uid
        const { minutosExtra, reservaID } = req.body
        if (!minutosExtra || !reservaID) {
            return res.status(400).json({ error: "Faltan datos" })
        }
        const reservaAumento = await db.collection("reservas").doc(reservaID).get();
        if (!reservaAumento.exists || reservaAumento.data().uid !== uid) {
            return res.status(400).json({ error: "La reserva no existe" })
        }
        const configuracion = await db.collection("configuracion").doc("general").get()
        const usuario = await db.collection("usuarios").doc(uid).get()
        const userData = usuario.data()
        const minuto = configuracion.data();
        let precio_minuto;
        if(/^[A-Z]{3}[0-9]{3}$/.test(userData.placa)){
             precio_minuto=minuto.minutosCobro;
        }
        if(/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(userData.placa)){
             precio_minuto=minuto.minutosCobroMoto;
        }
        const precio = precioPorMinutos(Number(minutosExtra), precio_minuto)
        const monto = precio * 100;
        const referencia = "RES-" + uid + "-" + Date.now();
        const moneda = "COP"
        const llaveintegridad = process.env.LLAVE_INTEGRIDAD_WOMPI;
        if (!llaveintegridad) {
            return res.status(500).json({ error: "mala llave " })
        }
        const texto = referencia + monto + moneda + llaveintegridad
        const firma = crypto.createHash("sha256").update(texto).digest("hex");
        await db.collection("reservas").doc(reservaID).update({
            referenciaAumento: referencia,
            montoAumento: monto,
            minutosExtraPendiente: Number(minutosExtra)
        });
        return res.json({ firma, referencia: referencia, monto });

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.post("/aumentar", verficarUsuario, limite, async (req, res) => {
    try {
        const uid = req.uid;
        const { reservaID, idtransaccion, minutosExtra, referencia } = req.body
        if (!reservaID || !idtransaccion || !minutosExtra) {
            return res.status(400).json({ error: "faltan datos" })
        }
        const yaAumentada = await db.collection("reservas").doc(reservaID).get();
        if (yaAumentada.exists && yaAumentada.data().extensionMinutos && yaAumentada.data().referenciaAumento === referencia && yaAumentada.data().uid === uid) {
            return res.json({ message: "reserva aumentada con exito" })
        }
        const configuracion = await db.collection("configuracion").doc("general").get()
        const minuto = configuracion.data();
        const placaReserva = yaAumentada.exists ? yaAumentada.data().placa : "";
        let precio_minuto;
        if (/^[A-Z]{3}[0-9]{3}$/.test(placaReserva)) {
            precio_minuto = minuto.minutosCobro;
        }
        if (/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(placaReserva)) {
            precio_minuto = minuto.minutosCobroMoto;
        }
        const nuevoPrecio = precioPorMinutos(Number(minutosExtra), precio_minuto)
        const montoreal = nuevoPrecio * 100
        const wompi = await fetch(`https://sandbox.wompi.co/v1/transactions/${idtransaccion}`)
        if (!wompi.ok) {
            return res.status(400).json({ error: "erro ene verificacion" })
        }
        const datoswompi = await wompi.json()
        const transaccion = datoswompi.data
        if (transaccion.status !== "APPROVED") {
            return res.status(400).json({ error: "el pago no se aprobo" })
        }
        if (Number(transaccion.amount_in_cents) !== montoreal) {
            return res.status(400).json({ error: "Monto no coincide" })
        }
        if (transaccion.reference !== referencia) {
            return res.status(400).json({ error: "referencia no coincide" })
        }
        const refreserva = db.collection("reservas").doc(reservaID)
        const proceso = await db.runTransaction(async (trans) => {
            const reserva = await trans.get(refreserva);
            if (!reserva.exists) {
                throw new Error("La reserva no existe ")
            }
            const reservi = reserva.data();
            if (reservi.uid !== uid) {
                throw new Error("Esta reserva no te corresponde")
            }
            const horaSalida = convertirHora(reservi.horaSalida);
            const nuevaSalida = horaSalida + minutosExtra;
            trans.update(refreserva, { horaSalida: minutosAHora(nuevaSalida), minutosExtra: minutosExtra, extensionMinutos: true, PrecioExtension: nuevoPrecio, idtransaccionAumento: idtransaccion })
            return { message: "reserva aumentada con exito" }
        })
        borrarCache("totalreservas");
        return res.json(proceso)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

function firmaEventoWompiValida(evento, secreto) {
    const propiedades = evento?.signature?.properties;
    const checksum = evento?.signature?.checksum;
    const timestamp = evento?.timestamp;
    if (!Array.isArray(propiedades) || !checksum || timestamp === undefined || timestamp === null) {
        return false;
    }
    let texto = "";
    for (const propiedad of propiedades) {
        let valor = evento.data;
        for (const parte of String(propiedad).split(".")) {
            valor = valor?.[parte];
        }
        if (valor === undefined || valor === null) {
            return false;
        }
        texto += valor;
    }
    texto += timestamp;
    texto += secreto;
    const calculado = crypto.createHash("sha256").update(texto).digest("hex");
    return calculado === String(checksum).toLowerCase();
}

app.post("/eventowompi", async (req, res) => {
    try {
        const secreto = process.env.SECRETO_EVENTOS_WOMPI?.trim();
        if (!secreto) {
            return res.status(500).json({ error: "falta secreto de eventos" });
        }
        if (!firmaEventoWompiValida(req.body, secreto)) {
            return res.status(401).json({ error: "firma de evento invalida" });
        }
        if (req.body?.event !== "transaction.updated") {
            return res.json({ recibido: true });
        }
        const pago = req.body?.data?.transaction;
        if (!pago || pago.status !== "APPROVED") {
            return res.json({ recibido: true });
        }
        const baseWompi = req.body.environment === "prod" ? "https://production.wompi.co" : "https://sandbox.wompi.co";
        const wompi = await fetch(`${baseWompi}/v1/transactions/${pago.id}`);
        if (!wompi.ok) {
            return res.status(400).json({ error: "erro ene verificacion" });
        }
        const transaccion = (await wompi.json()).data;
        if (transaccion.status !== "APPROVED" || transaccion.reference !== pago.reference) {
            return res.status(400).json({ error: "el pago no se aprobo" });
        }

        const bloqueos = await db.collection("bloqueos").where("referencia", "==", transaccion.reference).limit(1).get();
        if (!bloqueos.empty) {
            const bloqueoDoc = bloqueos.docs[0];
            const data = bloqueoDoc.data();
            if (Number(transaccion.amount_in_cents) !== Number(data.monto)) {
                return res.status(400).json({ error: "Monto no coincide" });
            }
            if (data.expira && data.expira.toMillis() <= Date.now()) {
                return res.status(400).json({ error: "El bloqueo ha expirado" });
            }
            const usuario = await db.collection("usuarios").doc(data.uid).get();
            const userData = usuario.data();
            const reser = db.collection("reservas").doc();
            const refbloqueo = db.collection("bloqueos").doc(bloqueoDoc.id);
            const resultado = await db.runTransaction(async (trans) => {
                const existente = await trans.get(db.collection("reservas").where("referencia", "==", transaccion.reference).limit(1));
                if (!existente.empty) {
                    return { reservaID: existente.docs[0].id };
                }
                const bloqueo = await trans.get(refbloqueo);
                if (!bloqueo.exists) {
                    throw new Error("el bloqueo no existe o ya fue utilizado ");
                }
                const info = bloqueo.data();
                trans.set(reser, {
                    nombre: info.nombre || "",
                    uid: info.uid,
                    parqueaderoId: info.parqueaderoId,
                    fecha: info.fecha,
                    horaEntrada: info.horaEntrada,
                    horaSalida: info.horaSalida,
                    precio: Number(info.monto) / 100,
                    placa: userData.placa,
                    referencia: transaccion.reference,
                    idtransaccion: transaccion.id,
                    extensionMinutos: false,
                    minutosExtra: 0,
                    HoraSalidaReal: "",
                    minutosPasados: 0,
                    costoAdicional: 0,
                    penalizado: false,
                    pagoPenalizacion: false,
                    finalizadaAntes: false,
                    cancelado: false,
                    creado: new Date()
                });
                trans.delete(refbloqueo);
                return { reservaID: reser.id };
            });
            const colita = await db.collection("colaespera").where("fecha", "==", data.fecha).where("estado", "==", "espera").where("uid", "==", data.uid).get();
            for (const colo of colita.docs) {
                await db.collection("colaespera").doc(colo.id).delete();
            }
            const prioritario = await db.collection("colaespera").where("fecha", "==", data.fecha).where("estado", "==", "prioritario").where("uid", "==", data.uid).get();
            for (const colo of prioritario.docs) {
                await db.collection("colaespera").doc(colo.id).delete();
            }
            borrarCache("totalreservas");
            return res.json(resultado);
        }

        const aumentos = await db.collection("reservas").where("referenciaAumento", "==", transaccion.reference).limit(1).get();
        if (!aumentos.empty) {
            const reservaDoc = aumentos.docs[0];
            const reservi = reservaDoc.data();
            if (reservi.extensionMinutos) {
                return res.json({ message: "reserva aumentada con exito" });
            }
            if (Number(transaccion.amount_in_cents) !== Number(reservi.montoAumento)) {
                return res.status(400).json({ error: "Monto no coincide" });
            }
            const minutosExtra = Number(reservi.minutosExtraPendiente);
            const refreserva = db.collection("reservas").doc(reservaDoc.id);
            const proceso = await db.runTransaction(async (trans) => {
                const reserva = await trans.get(refreserva);
                if (!reserva.exists) {
                    throw new Error("La reserva no existe ");
                }
                const actual = reserva.data();
                if (actual.extensionMinutos) {
                    return { message: "reserva aumentada con exito" };
                }
                const horaSalida = convertirHora(actual.horaSalida);
                const nuevaSalida = horaSalida + minutosExtra;
                trans.update(refreserva, {
                    horaSalida: minutosAHora(nuevaSalida),
                    minutosExtra: minutosExtra,
                    extensionMinutos: true,
                    PrecioExtension: Number(actual.montoAumento) / 100,
                    idtransaccionAumento: transaccion.id
                });
                return { message: "reserva aumentada con exito" };
            });
            borrarCache("totalreservas");
            return res.json(proceso);
        }

        const ya = await db.collection("reservas").where("referencia", "==", transaccion.reference).limit(1).get();
        if (!ya.empty) {
            return res.json({ reservaID: ya.docs[0].id });
        }
        return res.status(404).json({ error: "no hay bloqueo para esa referencia" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
})

app.post("/penalizar", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const { reservaID } = req.body
        if (!reservaID) {
            return res.status(400).json({ error: "faltan datos " })
        }
        const penlizar = await db.runTransaction(async (transaccion) => {
            const refreserva = db.collection("reservas").doc(reservaID)
            const configref = db.collection("configuracion").doc("general")
            const reserva = await transaccion.get(refreserva);
            const config = await transaccion.get(configref);
            if (!reserva.exists) {
                throw new Error("la reserva no existe")
            }
            const infodata = reserva.data()
            const infconfig = config.data()
            if (infodata.penalizado) {
                throw new Error("El usuario ya salió")
            }
            const ahora = new Date();
            const fechahoy = ahora.toLocaleDateString("sv-SE");
            const minutosactuales = ahora.getHours() * 60 + ahora.getMinutes()
            const entrada = convertirHora(infodata.horaEntrada)
            const salida = convertirHora(infodata.horaSalida);
            if (fechahoy < infodata.fecha) {
                throw new Error("La reserva ya culmino")
            }
            if (fechahoy > infodata.fecha) {
                throw new Error("No se pueden modificar reservas porteriores")
            }
            if (minutosactuales < entrada) {
                throw new Error("La reserva aun no ha empezado")
            }
            if (minutosactuales === entrada) {
                throw new Error("No puede salir a la misma hora de entrada")
            }
            const minutospasados = minutosactuales - salida;
            const minutoscobrables = minutospasados - 5;
            let preciocostoAdicional
            if (minutospasados > 5) {
                if(/^[A-Z]{3}[0-9]{3}$/.test(infodata.placa)){
                    preciocostoAdicional=infconfig.minutosCobro;
                }
                if(/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(infodata.placa)){
                    preciocostoAdicional=infconfig.minutosCobroMoto;
                }
                const costoAdicional = precioPorMinutos(minutoscobrables, preciocostoAdicional)
                transaccion.update(refreserva, { HoraSalidaReal: minutosAHora(minutosactuales), minutosPasados: minutospasados, costoAdicional: costoAdicional, penalizado: true })
            } else {
                transaccion.update(refreserva, { HoraSalidaReal: minutosAHora(minutosactuales), penalizado: true, finalizadaAntes: true });
            }
            return infodata.parqueaderoId
        })
        borrarCache("totalreservas");
        return res.json({ parqueaderoId: penlizar });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message })
    }
})
app.post("/colaespera", verficarUsuario, limite, async (req, res) => {
    try {
        const nombre = req.displayName
        const uid = req.uid;
        const { fecha } = req.body
        if (!fecha) {
            return res.status(400).json({ error: "faltan datos" })
        }
        const colita = await db.runTransaction(async (transaccion) => {
            const col = db.collection("colaespera").where("fecha", "==", fecha).where("uid", "==", uid).where("estado", "==", "espera")
            const datacola = await transaccion.get(col);
            const refe = db.collection("colaespera").doc()
            if (datacola.size > 0) {
                throw new Error("Ya hace parte de la cola de espera")
            }
            transaccion.create(refe, { nombre: nombre, uid, fecha, estado: "espera", creado: new Date() })
            return { message: "Se ha introducido a la cola de manera exitosa" }
        })
        return res.json(colita)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }

})
app.post("/eliminarcola", verficarUsuario, limite, async (req, res) => {
    try {
        const uid = req.uid
        const { fecha } = req.body
        if (!fecha) {
            return res.status(400).json({ error: "Faltan datos" })
        }
        const reservacola = await db.runTransaction(async (transaccion) => {
            const cola = db.collection("colaespera").where("fecha", "==", fecha).where("uid", "==", uid).where("estado", "==", "prioritario")
            const datacola = await transaccion.get(cola)
            if (datacola.size > 0) {
                for (const cul of datacola.docs) {
                    transaccion.delete(cul.ref)
                }
                return { message: "se ha borrado de la cola prioritaria" }
            }
            return { message: "no hay nadie en la cola de espera" }
        })
        return res.json(reservacola);

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.post("/gestionarcola", verficarUsuario, limite, async (req, res) => {
    try {
        const { fecha, parqueaderoId } = req.body
        if (!fecha || !parqueaderoId) {
            return res.status(400).json({ error: "faltan datos " })
        }
        const ahora = new Date();
        const minutos = ahora.getHours() * 60 + ahora.getMinutes();
        const cierre = 23 * 60;
        const gestion = await db.runTransaction(async (trans) => {
            const reservas = db.collection("reservas").where("fecha", "==", fecha).where("parqueaderoId", "==", parqueaderoId)
            const reserva = await trans.get(reservas);
            let siguientereserva = cierre;
            for (const reservita of reserva.docs) {
                const data = reservita.data();
                if (data.cancelado) {
                    continue;
                }
                const entrada = convertirHora(data.horaEntrada);
                if (entrada >= minutos && entrada < siguientereserva) {
                    siguientereserva = entrada;
                }
            }
            const disponibleinicio = minutos;
            const disponiblefinal = siguientereserva;
            if (disponiblefinal <= disponibleinicio) {
                if (minutos >= cierre) {
                    const colab = db.collection("colaespera").where("fecha", "==", fecha).where("estado", "==", "espera");
                    const colabo = await trans.get(colab);
                    for (const personas of colabo.docs) {
                        trans.delete(personas.ref);
                    }
                    return { message: "cola de espera liberada" }
                }
                return null;
            }
            const cola = db.collection("colaespera").where("fecha", "==", fecha).where("estado", "==", "espera").orderBy("creado", "asc").limit(1)
            const colita = await trans.get(cola)
            if (colita.empty) {
                return null;
            }
            const primero = colita.docs[0];
            const datos = primero.data();
            trans.update(primero.ref, { estado: "prioritario", horaDisponible: minutosAHora(disponibleinicio), horaLimite: minutosAHora(disponiblefinal), parqueaderoId: parqueaderoId })
            return { uid: datos.uid, horaDisponible: disponibleinicio, horaLimite: disponiblefinal }


        })
        if (gestion) {
            await NotificarFirebase(gestion.uid, "Se libero un espacio", "Puedes reservar ahora")
        }
        return res.json(gestion);
    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ error: error.message })
    }
})
const gestionarcola = async (fecha, parqueaderoId) => {
    const ahora = new Date();
    const minutos = ahora.getHours() * 60 + ahora.getMinutes();
    const cierre = 23 * 60;
    const gestion = await db.runTransaction(async (trans) => {
        const reservas = db.collection("reservas").where("fecha", "==", fecha).where("parqueaderoId", "==", parqueaderoId)
        const reserva = await trans.get(reservas);
        let siguientereserva = cierre;
        for (const reservita of reserva.docs) {
            const data = reservita.data();
            if (data.cancelado) {
                continue;
            }
            const entrada = convertirHora(data.horaEntrada);
            if (entrada >= minutos && entrada < siguientereserva) {
                siguientereserva = entrada;
            }
        }
        const disponibleinicio = minutos;
        const disponiblefinal = siguientereserva;
        if (disponiblefinal <= disponibleinicio) {
            if (minutos >= cierre) {
                const colab = db.collection("colaespera").where("fecha", "==", fecha).where("estado", "==", "espera");
                const colabo = await trans.get(colab);
                for (const personas of colabo.docs) {
                    trans.delete(personas.ref);
                }
                return { message: "cola de espera liberada" }
            }
            return null;
        }
        const cola = db.collection("colaespera").where("fecha", "==", fecha).where("estado", "==", "espera").orderBy("creado", "asc").limit(1)
        const colita = await trans.get(cola)
        if (colita.empty) {
            return null;
        }
        const primero = colita.docs[0];
        const datos = primero.data();
        trans.update(primero.ref, { estado: "prioritario", horaDisponible: minutosAHora(disponibleinicio), horaLimite: minutosAHora(disponiblefinal), parqueaderoId: parqueaderoId })
        return { uid: datos.uid, horaDisponible: disponibleinicio, horaLimite: disponiblefinal }

    })
    if (gestion) {
        await NotificarFirebase(gestion.uid, "Se libero un espacio", `Tienes prioridad de reserva`)
    }
    return gestion;
}
app.post("/cancelarCola", verficarUsuario, limite, async (req, res) => {
    try {
        const { colaId, fecha, parqueaderoId } = req.body
        if (!colaId || !fecha || !parqueaderoId) {
            return res.status(400).json({ error: "faltan datos" })
        }
        const refecola = db.collection("colaespera").doc(colaId)
        await db.runTransaction(async (transaccion) => {
            const cola = await transaccion.get(refecola);
            if (!cola.exists) {
                throw new Error("La cola no existe")
            }
            const data = cola.data();
            if (data.uid !== req.uid) {
                throw new Error("La cola no pertenece al usuario")
            }
            if (data.estado !== "prioritario") {
                throw new Error("La cola no esta en estado prioritario")
            }
            transaccion.update(refecola, { estado: "cancelado" })
        })
        const resultado = await gestionarcola(fecha, parqueaderoId)
        await refecola.delete()
        return res.json({ message: "Se ha cancelado la cola y se ha gestionado la siguiente", gestion: resultado })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.post("/cancelarreserva", verficarUsuario, limite, async (req, res) => {
    try {
        const uid = req.uid;
        const { reservaID } = req.body;
        if (!reservaID) {
            return res.status(400).json({ error: "faltan datos" });
        }
        const refreserva = db.collection("reservas").doc(reservaID);
        const datos = await db.runTransaction(async (trans) => {
            const reserva = await trans.get(refreserva);
            if (!reserva.exists) {
                throw new Error("La reserva no existe");
            }
            const data = reserva.data();
            if (data.uid !== uid) {
                throw new Error("Esta reserva no te corresponde");
            }
            if (data.cancelado === true) {
                throw new Error("La reserva ya fue cancelada");
            }
            const ahora = new Date();
            const fechahoy = ahora.toLocaleDateString("sv-SE");
            const minutosactuales = ahora.getHours() * 60 + ahora.getMinutes();
            const entrada = convertirHora(data.horaEntrada);
            if (data.fecha < fechahoy || (data.fecha === fechahoy && minutosactuales >= entrada)) {
                throw new Error("La reserva ya inició");
            }
            trans.update(refreserva, { cancelado: true });
            return { fecha: data.fecha, parqueaderoId: data.parqueaderoId };
        });
        const gestion = await gestionarcola(datos.fecha, datos.parqueaderoId);
        borrarCache("totalreservas");
        return res.json({ message: "La reserva fue cancelada", gestion });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
})
app.post("/cancelarreservaadmin", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const { reservaID } = req.body;
        if (!reservaID) {
            return res.status(400).json({ error: "faltan datos" });
        }
        const refreserva = db.collection("reservas").doc(reservaID);
        const datos = await db.runTransaction(async (trans) => {
            const reserva = await trans.get(refreserva);
            if (!reserva.exists) {
                throw new Error("La reserva no existe");
            }
            const data = reserva.data();
            if (data.cancelado === true) {
                throw new Error("La reserva ya fue cancelada");
            }
            const ahora = new Date();
            const fechahoy = ahora.toLocaleDateString("sv-SE");
            const minutosactuales = ahora.getHours() * 60 + ahora.getMinutes();
            const entrada = convertirHora(data.horaEntrada);
            if (data.fecha < fechahoy || (data.fecha === fechahoy && minutosactuales >= entrada)) {
                throw new Error("La reserva ya inició");
            }
            trans.update(refreserva, { cancelado: true });
            return { fecha: data.fecha, parqueaderoId: data.parqueaderoId };
        });
        const gestion = await gestionarcola(datos.fecha, datos.parqueaderoId);
        borrarCache("totalreservas");
        return res.json({ message: "La reserva fue cancelada", gestion });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
})
app.post("/validarusocomun", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const {placa}=req.body
        if(!placa){
           return res.status(400).json({error:"faltan datos"})
        }
         if (!/^[A-Z]{3}[0-9]{3}$/.test(placa)&&!/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(placa)) {
            return res.status(400).json({error: "La placa no tiene un formato valido"});
        }
        const fechahoyy = new Date().toLocaleDateString("sv-SE");
        const resultado = await db.runTransaction(async (transaccion) => {
            const parqueaderos = db.collection("parqueaderos").where("tipo", "==", "comun")
            const parqueadeross = await transaccion.get(parqueaderos);
            const comunes = db.collection("usocomun").where("estado", "==", "activo").where("fecha", "==", fechahoyy)
            const comunesactivos = await transaccion.get(comunes);
            for (const comun of comunesactivos.docs) {
                    const data = comun.data();
                    if(data.placa===placa){
                         throw new Error("La placa ya tiene una asignación activa");
                    }
                }
            if (parqueadeross.empty) {
                throw new Error("No hay parqueaderos comunes")
            }
            let espaciosdisponible = null;
            for (const parqueadero of parqueadeross.docs) {
                let disponible = true;
                for (const comun of comunesactivos.docs) {
                    const data = comun.data();
                    if (data.parqueaderoId === parqueadero.id) {
                        disponible = false;
                        break;
                    }
                }
                if (disponible) {
                    espaciosdisponible = parqueadero.id;
                    break;
                }
            }
            if (!espaciosdisponible) {
                throw new Error("No hay espacios disponibles")
            }
            const ahora = new Date();
            const fechahoy = ahora.toLocaleDateString("sv-SE");
            const horaEntrada = ahora.toLocaleTimeString("sv-SE")
            const referencia = db.collection("usocomun").doc()
            transaccion.create(referencia, { placa: placa, parqueaderoId: espaciosdisponible, fecha: fechahoy, horaEntrada: horaEntrada, horaSalida: "", precio: 0, estado: "activo", creado: new Date(), pago: false, metodoPago: "" })
            return { message: "la asiganción se creo" }

        })
        borrarCache("totalusos");
        return res.json(resultado)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.post("/finalizarusocomun", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const { comunId } = req.body
        if (!comunId) {
            return res.status(400).json({ error: "faltan datos" })
        }
        const resultado = await db.runTransaction(async (transaccion) => {
            const refcomun = db.collection("usocomun").doc(comunId)
            const comun = await transaccion.get(refcomun);
            const refconfiguracion = db.collection("configuracion").doc("general")
            const configuracion = await transaccion.get(refconfiguracion);
            if (!comun.exists) {
                throw new Error("El uso comun no existe")
            }
            if (!configuracion.exists) {
                throw new Error("La configuracion no existe")
            }
            const infocomun = comun.data();
            const infoconfig = configuracion.data();
            if (infocomun.estado === "finalizado") {
                throw new Error("El uso comun ya fue finalizado")
            }
            const ahora = new Date();
            const horaSalida = ahora.toLocaleTimeString("sv-SE")
            const entrada = convertirHoracomun(infocomun.horaEntrada)
            const salida = convertirHoracomun(horaSalida)
            const diferencia = salida - entrada;
            const diferenciainutos = Math.ceil(diferencia / 60);
            let precio_minuto;
            if(/^[A-Z]{3}[0-9]{3}$/.test(infocomun.placa)){
                 precio_minuto=infoconfig.minutosCobro;
            }
            if(/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(infocomun.placa)){
                 precio_minuto=infoconfig.minutosCobroMoto;
            }
            const precio = precioPorMinutos(diferenciainutos, precio_minuto);
            transaccion.update(refcomun, { horaSalida: horaSalida, precio: precio, estado: "finalizado" })
            return { message: "El usuario salió" }

        })
        borrarCache("totalusos");
        return res.json(resultado)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.post("/validarpago", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const { comunId, metodoPago } = req.body
        if (!comunId || !metodoPago) {
            return res.status(400).json({ error: "faltan datos" })
        }
        const pagoo = await db.runTransaction(async (transaccion) => {
            const refcomun = db.collection("usocomun").doc(comunId)
            const comun = await transaccion.get(refcomun);
            if (!comun.exists) {
                throw new Error("El uso comun no existe")
            }
            const infocomun = comun.data();
            if (infocomun.estado !== "finalizado") {
                throw new Error("El usuario no ha salido del parqueadero")
            }
            if (infocomun.pago) {
                throw new Error("El usuario ya ha pagado")
            }
            transaccion.update(refcomun, { pago: true, metodoPago: metodoPago })
            return { message: "El pago se ha registrado con exito" }
        })
        return res.json(pagoo)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.post("/validarpagoreserva", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const { reservaID, metodoPago } = req.body
        if (!reservaID || !metodoPago) {
            return res.status(400).json({ error: "faltan datos" })
        }
        const pagoo = await db.runTransaction(async (transaccion) => {
            const refreserva = db.collection("reservas").doc(reservaID)
            const reserva = await transaccion.get(refreserva);
            if (!reserva.exists) {
                throw new Error("La reserva no existe")
            }
            const info = reserva.data();
            if (!info.penalizado || !(Number(info.minutosPasados) > 5) || !(Number(info.costoAdicional) > 0)) {
                throw new Error("La reserva no tiene un cobro por penalización")
            }
            if (info.pagoPenalizacion) {
                throw new Error("El usuario ya ha pagado")
            }
            transaccion.update(refreserva, { pagoPenalizacion: true, metodoPagoPenalizacion: metodoPago })
            return { message: "El pago se ha registrado con exito" }
        })
        borrarCache("totalreservas");
        return res.json(pagoo)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/reserva", verficarUsuario, limite, async (req, res) => {
    try {
        const uid = req.uid
        const ahora = new Date();
        const fechahoy = ahora.toLocaleDateString("sv-SE");
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        const fechamañana = mañana.toLocaleDateString("sv-SE");
        const reservas = await db.collection("reservas").where("uid", "==", uid).where("fecha", ">=", fechahoy).where("fecha", "<=", fechamañana).get();
        return res.json(reservas.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/reservaaumento", verficarUsuario, limite, async (req, res) => {
    try {
        const uid = req.uid
        const ahora = new Date();
        const fechahoy = ahora.toLocaleDateString("sv-SE");
        const reservas = await db.collection("reservas").where("uid", "==", uid).where("fecha", "==", fechahoy).where("cancelado", "==", false).get();
        return res.json(reservas.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/reservasadmin", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const ahora = new Date();
        const fechahoy = ahora.toLocaleDateString("sv-SE");
        const reservas = await db.collection("reservas").where("fecha", "==", fechahoy).where("cancelado", "==", false).get();
        return res.json(reservas.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/parqueaderos", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const enCache = leerCache("parqueaderos:total");
        if (enCache) return res.json(enCache);
        const parqueaderos = await db.collection("parqueaderos").get();
        const respuesta = { total: parqueaderos.size };
        guardarCache("parqueaderos:total", respuesta, 30);
        return res.json(respuesta)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/ultimasreservas", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const ahora = new Date();
        const fechahoy = ahora.toLocaleDateString("sv-SE");
        const reservas = await db.collection("reservas").where("fecha", "==", fechahoy).where("cancelado", "==", false).orderBy("creado", "desc").limit(2).get();
        return res.json(reservas.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/usuarios", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const enCache = leerCache("usuarios:conteo");
        if (enCache) return res.json(enCache);
        const usuarios = await db.collection("usuarios").get();
        let total = 0;
        for (const documento of usuarios.docs) {
            if (await esCuentaAdmin(documento.data().correo)) continue;
            total++;
        }
        const respuesta = { total };
        guardarCache("usuarios:conteo", respuesta, 5);
        return res.json(respuesta)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/usoscomunes", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const ahora = new Date();
        const fechahoy = ahora.toLocaleDateString("sv-SE");
        const usos = await db.collection("usocomun").where("fecha", "==", fechahoy).get();
        return res.json(usos.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/totalreservas", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const fechahoy = new Date().toLocaleDateString("sv-SE");
        const siguiente= new Date();
        siguiente.setDate(siguiente.getDate() - 30);
        const fechainicio = siguiente.toLocaleDateString("sv-SE");
        const clave = `totalreservas:${fechainicio}:${fechahoy}`;
        const enCache = leerCache(clave);
        if (enCache) return res.json(enCache);
        const reservas = await db.collection("reservas").where("fecha", ">=", fechainicio).where("fecha", "<=", fechahoy).where("cancelado", "==", false).get();
        const datos = reservas.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        guardarCache(clave, datos, 5);
        return res.json(datos)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/totalusos", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const fechahoy = new Date().toLocaleDateString("sv-SE");
        const siguiente= new Date();
        siguiente.setDate(siguiente.getDate() - 30);
        const fechainicio = siguiente.toLocaleDateString("sv-SE");
        const clave = `totalusos:${fechainicio}:${fechahoy}`;
        const enCache = leerCache(clave);
        if (enCache) return res.json(enCache);
        const usos = await db.collection("usocomun").where("fecha", ">=", fechainicio).where("fecha", "<=", fechahoy).get();
        const datos = usos.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        guardarCache(clave, datos, 5);
        return res.json(datos)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.post("/guardartoken", verficarUsuario, limite, async (req, res) => {
    try {
        const uid = req.uid;
        const { tokenN } = req.body
        if (!tokenN) {
            return res.status(400).json({ error: "faltan datos" })
        }
        await db.collection("usuarios").doc(uid).collection("fcmtokens").doc(tokenN).set({ token: tokenN, fecha: new Date() })
        return res.json({ message: "token guardado" })

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
const NotificarFirebase = async (uid, titulo, mensaje) => {
    const tokenN = await db.collection("usuarios").doc(uid).collection("fcmtokens").get()
    if (tokenN.empty) {
        return;
    }
    const tokens = tokenN.docs.map(doc => doc.data().token)
    const messaging = getMessaging();
    const mensajes = tokens.map(token => ({
        token: token,
        notification: {
            title: titulo,
            body: mensaje
        }
    }));
    const respuesta = await messaging.sendEach(mensajes);
    for (let i = 0; i < respuesta.responses.length; i++) {
        const resultado = respuesta.responses[i];
        if (!resultado.success) {
            const error = resultado.error;
            if (error.code === "messaging/registration-token-not-registered" || error.code === "messaging/invalid-registration-token") {
                const tokenInvalido = tokens[i];
                await db.collection("usuarios").doc(uid).collection("fcmtokens").doc(tokenInvalido).delete();
            }
        }
    }
}
export const obtenerEstado = (fecha, horaEntrada, horaSalida, finalizadaAntes) => {
    const ahora = new Date()
    const fechahoy = ahora.toLocaleDateString("sv-SE");
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    const entrada = convertirHora(horaEntrada);
    const salida = convertirHora(horaSalida);
    if (fecha < fechahoy) {
        return "finalizada";
    }
    if (fecha > fechahoy) {
        return "pendiente";
    }
    if (minutosActuales < entrada) {
        return "pendiente"
    }
    if (minutosActuales >= salida) {
        return "finalizada"
    }
    if (finalizadaAntes) {
        return "finalizada"
    }
    return "activa"
}
app.get("/reservasvigentes", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const fechahoy = new Date().toLocaleDateString("sv-SE");
        const reservas = await db.collection("reservas").where("fecha", "==", fechahoy).where("cancelado", "==", false).get()
        for (const reserva of reservas.docs) {
            const data = reserva.data()
            const estado = obtenerEstado(data.fecha, data.horaEntrada, data.horaSalida, data.finalizadaAntes);
            if (estado == "activa" || estado == "pendiente") {
                return res.json(true)
            }
        }
        return res.json(false)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }

})
app.post("/crearparqueaderos", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const { espaciosReserva } = req.body
        if(!Number.isInteger(espaciosReserva)){
            return res.status(400).json({ error: "El valor debe ser un número entero" })
        }
        if (!espaciosReserva) {
            return res.status(400).json({ error: "faltan datos" })
        }
        if (espaciosReserva < 0 || espaciosReserva > 100) {
            return res.status(400).json({ error: "El valor debe ser entre 0 y 100" })
        }
        for (let i = 1; i <= 100; i++) {
            const tipo = i <= espaciosReserva ? "reserva" : "comun";
            await db.collection("parqueaderos").doc(i.toString()).set({ numero: i, tipo: tipo })
        }
        borrarCache("parqueaderos");
        return res.json({ message: "Parqueaderos creados correctamente" })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.post("/actualizarparqueaderos", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const { espaciosReserva } = req.body
        if(!Number.isInteger(espaciosReserva)){
            return res.status(400).json({ error: "El valor debe ser un número entero" })
        }
        if (!espaciosReserva) {
            return res.status(400).json({ error: "faltan datos" })
        }
        if (espaciosReserva < 0 || espaciosReserva > 100) {
            return res.status(400).json({ error: "El valor debe ser entre 0 y 100" })
        }
        for (let i = 1; i <= 100; i++) {
            const tipo = i <= espaciosReserva ? "reserva" : "comun";
            await db.collection("parqueaderos").doc(i.toString()).update({ tipo: tipo })
        }
        borrarCache("parqueaderos");
        return res.json({ message: "Parqueaderos catualizado correctamente" })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/configuracion", verficarUsuario, limite, async (req, res) => {
    try {
        const enCache = leerCache("configuracion");
        if (enCache) return res.json(enCache);
        const configuracion = await db.collection("configuracion").doc("general").get()
        if (!configuracion.exists) {
            return res.status.apply(400).json({ error: "la configuracion no existe" })
        }
        const datos = configuracion.data();
        guardarCache("configuracion", datos, 30);
        return res.json(datos)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.post("/crearconfiguracion", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const { metaIngreso, metaGeneral, metaReservas, metaUsos, minutosCobro, minutosCobroMoto } = req.body
        if (!metaIngreso || !metaGeneral || !metaReservas || !metaUsos || !minutosCobro || !minutosCobroMoto) {
            return res.status(400).json({ error: "Faltan datos" })
        }
        if (metaIngreso == 0 || metaGeneral == 0 || metaReservas == 0 || metaUsos == 0 || minutosCobro == 0 || minutosCobroMoto == 0) {
            return res.status(400).json({ error: "Rellene todos los datos por favor" })
        }
        if (minutosCobro > 230) {
            return res.status(400).json({ error: "El minuto por cobor no debe superar los 230 pesos" })
        }
        if (minutosCobroMoto > 161) {
            return res.status(400).json({ error: "El minuto por cobor para motos no debe superar los 161 pesos" })
        }
        if( metaIngreso < 0 || metaGeneral < 0 || metaReservas < 0 || metaUsos < 0 || minutosCobro < 0 || minutosCobroMoto < 0){
            return res.status(400).json({ error: "Los valores no pueden ser negativos" })
        }
        if(!Number.isInteger(metaIngreso) || !Number.isInteger(metaGeneral) || !Number.isInteger(metaReservas) || !Number.isInteger(metaUsos) || !Number.isInteger(minutosCobro) || !Number.isInteger(minutosCobroMoto)){
            return res.status(400).json({ error: "Los valores deben ser enteros" })
        }
        const ahora = new Date();
        const fechaConfigurado = ahora.toLocaleDateString("sv-SE");
        await db.collection("configuracion").doc("general").set({ metaIngreso, metaGeneral, metaReservas, metaUsos, minutosCobro, minutosCobroMoto, fechaConfigurado })
        borrarCache("configuracion");
        return res.json({ message: "configuarcion guardada con exito" })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/usuariostotales", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const enCache = leerCache("usuarios:lista");
        if (enCache) return res.json(enCache);
        const usuarios = await db.collection("usuarios").get();
        const datos = [];
        for (const documento of usuarios.docs) {
            if (await esCuentaAdmin(documento.data().correo)) continue;
            datos.push({ id: documento.id, ...documento.data() });
        }
        guardarCache("usuarios:lista", datos, 5);
        return res.json(datos)

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/usuarios/:id", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const usuario = await db.collection("usuarios").doc(req.params.id).get()
        if (!usuario.exists) {
            return res.status(400).json({ error: "usuario no encontrado" })
        }
        return res.json({ id: usuario.id, ...usuario.data() })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/detalleusuario", verficarUsuario, limite, async (req, res) => {
    try {
        const uid = req.uid;
        const clave = `usuario:${uid}`;
        const enCache = leerCache(clave);
        if (enCache) return res.json(enCache);
        const usuario = await db.collection("usuarios").doc(uid).get()
        if (!usuario.exists) {
            return res.status(400).json({ error: "no se encontro el usuario" })
        }
        const datos = { id: usuario.id, ...usuario.data() };
        guardarCache(clave, datos, 2);
        return res.json(datos)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.put("/actualizarusuario", verficarUsuario, limite, async (req, res) => {
    try {
        const uid = req.uid;
        const { nombre, placa } = req.body;
        if (!nombre?.trim() || !placa?.trim()) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }
        const nombreLimpio = nombre.trim();
        const placaLimpia = placa.trim().toUpperCase();
        if (!/^[A-Z]{3}[0-9]{3}$/.test(placaLimpia) && !/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(placaLimpia)) {
            return res.status(400).json({ error: "La placa debe tener el formato ABC123 o ABC12D" });
        }
        const referencia = db.collection("usuarios").doc(uid);
        const usuario = await referencia.get();
        if (!usuario.exists) {
            return res.status(400).json({ error: "no se encontro el usuario" });
        }
        await referencia.update({ nombre: nombreLimpio, placa: placaLimpia });
        await adminauth.updateUser(uid, { displayName: nombreLimpio });
        const datos = { id: uid, ...usuario.data(), nombre: nombreLimpio, placa: placaLimpia };
        borrarCache(`usuario:${uid}`);
        guardarCache(`usuario:${uid}`, datos, 2);
        borrarCache("usuarios:lista");
        return res.json(datos);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
})
app.get("/parqueaderoreservas", verficarUsuario, limite, async (req, res) => {
    try {
        const enCache = leerCache("parqueaderos:reserva");
        if (enCache) return res.json(enCache);
        const parqueaderos = await db.collection("parqueaderos").where("tipo", "==", "reserva").get();
        const respuesta = { total: parqueaderos.size };
        guardarCache("parqueaderos:reserva", respuesta, 30);
        return res.json(respuesta)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/reservausuarios", verficarUsuario, limite, async (req, res) => {
    try {
        const ahora = new Date();
        const fechahoy = ahora.toLocaleDateString("sv-SE");
        const reservas = await db.collection("reservas").where("fecha", "==", fechahoy).where("cancelado", "==", false).get();
        return res.json(reservas.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.get("/parqueaderoreservasadmin", verficarUsuario, limite, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const enCache = leerCache("parqueaderos:reserva");
        if (enCache) return res.json(enCache);
        const parqueaderos = await db.collection("parqueaderos").where("tipo", "==", "reserva").get();
        const respuesta = { total: parqueaderos.size };
        guardarCache("parqueaderos:reserva", respuesta, 30);
        return res.json(respuesta)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.post("/detectar", verficarUsuario, upload.single("imagen"), async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        if (!req.file) {
            res.status(400).json({ error: " no  hay imagen" })
        }
        const formData = new FormData()
        formData.append("file", new Blob([req.file.buffer]), req.file.originalname)
        const respuesta = await fetch("https://familia-tp410ua.tail727a50.ts.net/detectar", {
            method: "POST",
            headers: {
                "X-API-Key": process.env.OCR_API_KEY
            },
            body: formData
        })
        if (!respuesta.ok) {
            const errorPython = await respuesta.text();
            console.error("Error del servidor Python:", errorPython);
            return res.status(500).json({ error: "El servicio de reconocimiento falló" });
        }
        const resultado = await respuesta.json();
        const placa = resultado.placa;
        if (!placa) {
            return null;
        }
        const asignacion = await db.runTransaction(async (transaccion) => {
            const parqueaderosQuery = db
                .collection("parqueaderos")
                .where("tipo", "==", "comun");

            const parqueaderosSnapshot = await transaccion.get(parqueaderosQuery);

            if (parqueaderosSnapshot.empty) {
                throw new Error("No hay parqueaderos comunes");
            }
            const fechaa = new Date().toLocaleDateString("sv-SE");
            const usosQuery = db.collection("usocomun").where("estado", "==", "activo").where("fecha", "==", fechaa);

            const usosSnapshot = await transaccion.get(usosQuery);
            for (const uso of usosSnapshot.docs) {
                const data = uso.data();
                if (data.placa && data.placa.toUpperCase() === placa.toUpperCase()) {
                    throw new Error(`La placa ${placa} ya tiene un uso común activo`);
                }
            }
            let espacioDisponible = null;
            for (const parqueadero of parqueaderosSnapshot.docs) {
                let disponible = true;
                for (const uso of usosSnapshot.docs) {
                    const data = uso.data();
                    if (data.parqueaderoId === parqueadero.id) {
                        disponible = false;
                        break;
                    }
                }
                if (disponible) {
                    espacioDisponible = parqueadero.id;
                    break;
                }
            }
            if (!espacioDisponible) {
                throw new Error("No hay espacios comunes disponibles");
            }
            const ahora = new Date();
            const fecha = ahora.toLocaleDateString("sv-SE");
            const horaEntrada = ahora.toLocaleTimeString("sv-SE");
            const referencia = db.collection("usocomun").doc();
            transaccion.create(referencia, { placa: placa.toUpperCase(), parqueaderoId: espacioDisponible, fecha: fecha, horaEntrada: horaEntrada, horaSalida: "", precio: 0, estado: "activo", creado: new Date(), pago: false, metodoPago: "" });
            return {
                id: referencia.id,
                placa: placa.toUpperCase(),
                parqueaderoId: espacioDisponible,
                fecha: fecha,
                horaEntrada: horaEntrada
            };
        });
        borrarCache("totalusos");
        return res.json(asignacion);
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})
app.put("/actualizarplaca", verficarUsuario, async (req, res) => {
    try {
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const { comunId, placa } = req.body;
        if (!comunId || !placa) {
            return res.status(400).json({ error: "Faltan datos"});
        }
        const nuevaPlaca = placa.trim().toUpperCase();
        if (!/^[A-Z]{3}[0-9]{3}$/.test(nuevaPlaca)&&!/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(nuevaPlaca)) {
            return res.status(400).json({error: "La placa no tiene un formato valido"});
        }
        const referencia = db.collection("usocomun").doc(comunId);
        const documento = await referencia.get();
        const fechahoy = new Date().toLocaleDateString("sv-SE");
        const usos= await db.collection("usocomun").where("estado", "==", "activo").where("fecha", "==", fechahoy).get();
        for(const uso of usos.docs){
            const data = uso.data();
            if(data.placa===nuevaPlaca){
                return res.status(400).json({error: "La placa ya tiene una asignación activa"});
            }
        }
        if (!documento.exists) {
            return res.status(404).json({error: "El uso común no existe"});
        }
        const datos = documento.data();
        if(datos.estado ==="finalizado"){
             return res.status(400).json({error: "La reserva ya finalizó"});
        }
        await referencia.update({
            placa: nuevaPlaca
        });
        return res.json({message: "Placa actualizada correctamente"});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: error.message});
    }
});
app.get("/asignacionesactivas", verficarUsuario, limite, async (req, res) => {
    try{
        if (req.admin !== true) {
            return res.status(403).json({ error: "No posee los permisos para hacer esta accion" });
        }
        const fechahoy= new Date().toLocaleDateString("sv-SE");
        const asignaciones = await db.collection("usocomun").where("fecha", "==", fechahoy).get();
        for(const asignacion of asignaciones.docs){
            const data = asignacion.data();
            if(data.estado==="activo"){
                return res.json(true);
            }
        }
        return res.json(false);

    } catch (error) {
        console.error(error);
        return res.status(500).json({error: error.message});
    }
})
if (!process.env.VERCEL) {
    app.listen(3000, () => {
        console.log("corriendo en el puerto")
    })
}

export default app;