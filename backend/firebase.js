import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    sendPasswordResetEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
    getMessaging,
    getToken
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging.js";

import { convertirHora, hayConflicto, minutosAHora, generarPlaca, convertirHoracomun } from "./utils.js";
import { getFirestore, collection, addDoc, getDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, onSnapshot, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
const firebaseConfig = {
    apiKey: "AIzaSyC-XuvC-iOS2GXL1mAQ3Zs84g1Pc_xw98E",
    authDomain: "parqueadero-40b7c.firebaseapp.com",
    projectId: "parqueadero-40b7c",
    storageBucket: "parqueadero-40b7c.firebasestorage.app",
    messagingSenderId: "1045474082793",
    appId: "1:1045474082793:web:40d3053035708fded1d578"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const addUsuario = async (nombre, correo, contraseña, cedula, placa) => {
    const userCredential = await createUserWithEmailAndPassword(auth, correo, contraseña);
    const user = userCredential.user;
    await updateProfile(user, { displayName: nombre });
    await setDoc(doc(db, "usuarios", user.uid), { nombre, correo, cedula, placa });
    await setDoc(doc(db, "automoviles", user.uid), { nombre, placa });
};
export const loginUsusario = async (correo, contraseña) => {
    await signInWithEmailAndPassword(auth, correo, contraseña);
};
export const logoutUsuario = async () => {
    await signOut(auth);
};
export const getUsuarios = () => getDocs(collection(db, 'usuarios'));
export const ongetUsuarios = async () => await getDocs(collection(db, 'usuarios'));
export const ongetUsuario = async (uid) => await getDoc(doc(db, 'usuarios', uid));
export const getUsuario = (uid) => getDoc(doc(db, 'usuarios', uid));
export const updateUsusario = async (uid, newFields) => {
    await updateProfile(auth.currentUser, { displayName: newFields.nombre });
    await updateDoc(doc(db, "usuarios", uid), newFields);
    await updateDoc(doc(db, "automoviles", uid), { nombre: newFields.nombre, placa: newFields.placa });
};
export const crearParqueaderos = async (espaciosReserva) => {
    for (let i = 1; i <= 100; i++) {
        const tipo = i <= espaciosReserva ? "reserva" : "comun";
        await setDoc(doc(db, "parqueaderos", i.toString()), { numero: i, tipo });
    }
};
export const obtenerTotalParqueaderos = async () => {
    const snap = await getDocs(collection(db, "parqueaderos"));
    return snap.size;
};
export const actualizarParqueaderos = async (espaciosReserva) => {
    for (let i = 1; i <= 100; i++) {
        const tipo = i <= espaciosReserva ? "reserva" : "comun";
        await updateDoc(doc(db, "parqueaderos", i.toString()), { tipo });
    }
};
export const colaEspera = async (nombre, uid, fecha )=>{
    const VerCola = query(collection(db, "colaespera"),where("fecha","==",fecha ),where("uid","==",uid), where("estado", "==","espera"))
    const Cola=await getDocs(VerCola);
    if(Cola.size>0){
        throw new Error("Ya tienes una solicitud en espera para esta fecha");
    }
    await addDoc(collection(db, "colaespera"), { nombre, uid, fecha, estado: "espera", creado: new Date() });
}
export const gestionarCola = async (fecha, parqueaderoId)=>{
    const ahora = new Date();
    const minutos=ahora.getHours()*60+ahora.getMinutes();
    const cierre = 22*60;
     const reservasQuery = query(collection(db, "reservas"), where("fecha", "==", fecha), where("parqueaderoId", "==", parqueaderoId));
     const reservas=await getDocs(reservasQuery);
     let siguienteReserva=cierre;
        for(const reserva of reservas.docs){
            const data=reserva.data();
            const entrada= convertirHora(data.horaEntrada);
            if(entrada>=minutos && entrada<siguienteReserva){
                siguienteReserva=entrada;
            }
        }
        const disponibleincio=minutos;
        const disponiblefin=siguienteReserva;
            if(disponiblefin<=disponibleincio){
                return;
            }
    const Col=query(collection(db, "colaespera"),where("fecha","==",fecha),where("estado","==","espera"),orderBy("creado","asc"),limit(1));
    const Cola=await getDocs(Col);
    if(Cola.size>0){
        const primero=Cola.docs[0];
        await updateDoc(doc(db, "colaespera", primero.id), { estado: "prioritario", horaDisponible: minutosAHora(disponibleincio), horaLimite: minutosAHora(disponiblefin), parqueaderoId: parqueaderoId });
        return primero.data();
    }
    return;
    
}
export const reservarParqueadero = async (nombre, uid, fecha, horaEntrada, horaSalida, precio) => {
    const entradaNueva = convertirHora(horaEntrada);
    const salidaNueva = convertirHora(horaSalida);
    const horaApertura = 8 * 60;
    const HoraCierre = 24 * 60;
    if (salidaNueva <= entradaNueva) {
        throw new Error("La hora de salida debe ser mayor a la hora de entrada");
    }
    if (entradaNueva < horaApertura || salidaNueva > HoraCierre) {
        throw new Error("Las reservas solo pueden realizarse entre las 08:00 y las 22:00");
    }
    const hoy = new Date();
    const fechaHoy = hoy.toLocaleDateString("sv-SE");
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    const fechaMañana = mañana.toLocaleDateString("sv-SE");
    if (fecha !== fechaHoy && fecha !== fechaMañana) {
        console.log(fecha, fechaHoy, fechaMañana);
        throw new Error("Solo puedes reservar para hoy o mañana");
    }
    if (fecha === fechaHoy) {
        const minutosActuales = hoy.getHours() * 60 + hoy.getMinutes();
        if (entradaNueva <= minutosActuales) {
            throw new Error("La hora de entrada ya pasó");
        }
    }

    const parqueaderosQuery = query(
        collection(db, "parqueaderos"),
        where("tipo", "==", "reserva")
    );

    const parqueaderosSnap = await getDocs(parqueaderosQuery);

    const reservasQuery = query(collection(db, "reservas"), where("fecha", "==", fecha) );
    const Cola=query(collection(db, "colaespera"),where("fecha","==",fecha),where("estado","==","prioritario"));
    const colaa=await getDocs(Cola);
    
    const reservasSnap = await getDocs(reservasQuery);
    for (const parqueadero of parqueaderosSnap.docs) {
        let disponible = true;
        for (const reserva of reservasSnap.docs) {

            const data = reserva.data();
            if (data.uid === uid) {
                throw new Error("Ya tienes una reserva para esta fecha");

            }

            if (data.parqueaderoId !== parqueadero.id) {
                continue;
            }
            const entradaExistente = convertirHora(data.horaEntrada);
            let salidaExistente;
            if(data.HoraSalidaReal){
                salidaExistente = convertirHora(data.HoraSalidaReal);
            }else{
                salidaExistente = convertirHora(data.horaSalida);
            }
            if ( hayConflicto(entradaNueva, salidaNueva, entradaExistente, salidaExistente)) {
                disponible = false;
                break;
            }
            
        }
        for(const colita of colaa.docs){
                const dataa=colita.data();
                if(dataa.parqueaderoId!==parqueadero.id){
                    continue;
                }
                if(dataa.uid===uid){
                    continue;
                }
                const inicio= convertirHora(dataa.horaDisponible);
                const fin= convertirHora(dataa.horaLimite);
                if(hayConflicto(entradaNueva, salidaNueva, inicio, fin)){
                    disponible=false;
                    break;
                }
            }
        if (disponible) {
            return parqueadero.id;
        }
    }
    throw new Error("No hay espacios disponibles para ese horario");
};
export const hacerReserva = async (nombre, uid, parqueaderoId, fecha, horaEntrada, horaSalida, precio) => {
    await addDoc(collection(db, "reservas"), { nombre, uid, parqueaderoId, fecha, horaEntrada, horaSalida, precio, extensionMinutos: false, minutosExtra: 0, HoraSalidaReal: "", minutosPasados: 0, costoAdicional: 0, penalizado: false, finalizadaAntes: false, creado: new Date() });
    const cola=query(collection(db, "colaespera"),where("fecha","==",fecha),where("estado","==","espera"),where("uid","==",uid));
    const colaa=await getDocs(cola);
    if(colaa.size>0){
        for(const colita of colaa.docs){
            await updateDoc(doc(db, "colaespera", colita.id), { estado: "resuelto" });
            await deleteDoc(doc(db, "colaespera", colita.id));
        }
    }
}
export const obtenerReserva = async (uid) => {
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    const fechaMañana = mañana.toLocaleDateString("sv-SE");
    const hoy = new Date();
    const fechahoy = hoy.toLocaleDateString("sv-SE");
    const q = query(collection(db, "reservas"), where("uid", "==", uid), where("fecha", ">=", fechahoy), where("fecha", "<=", fechaMañana));
    return await getDocs(q);
}
export const obtenerReservaAumentar = async (uid) => {
    const hoy = new Date();
    const fechahoy = hoy.toLocaleDateString("sv-SE");
    const q = query(collection(db, "reservas"), where("uid", "==", uid), where("fecha", "==", fechahoy));
    return await getDocs(q);
}
export const ObtenerReservasA = async () => {
    return await getDocs(collection(db, "reservas"));
}
export const ObtenerReservasAA = async () => {
    const numero =
        await getDocs(collection(db, "reservas"));
    return numero.size;
}
export const obtenerReservasAdmin = async () => {
    const hoy = new Date();
    const fechahoy = hoy.toLocaleDateString("sv-SE");
    const q = query(collection(db, "reservas"), where("fecha", "==", fechahoy))
    return await getDocs(q);
}
export const aumentarReserrva = async (reservaID, minutosExtra) => {
    if (minutosExtra > 60) {
        throw new Error("No se puede aumentar la reserva en más de 60 minutos");
    }
    if (minutosExtra <= 0) {
        throw new Error("El tiempo extra debe ser mayor a 0 minutos");
    }
    const reservaRef = doc(db, "reservas", reservaID);
    const reservaSnap = await getDoc(reservaRef);
    if (!reservaSnap.exists()) {
        throw new Error("No se encontró la reserva");
    }

    const reserva = reservaSnap.data();

    if (reserva.extensionMinutos) {
        throw new Error("Ya se ha aumentado la reserva una vez");
    }
    const hoy = new Date().toLocaleDateString("sv-SE");
    if (reserva.fecha !== hoy) {
        throw new Error("Solo se pueden aumentar reservas para hoy");
    }
    const ahora = new Date();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    const salidaActual = convertirHora(reserva.horaSalida);
    const entradaActual = convertirHora(reserva.horaEntrada)
    const minutosRestantes = salidaActual - minutosActuales;
    const precio = await getDoc(doc(db, "configuracion", "general"))
    const precioo = precio.data();
    if (minutosActuales < entradaActual) {
        throw new Error("El tiempo de reserva no ha empezado")
    }
    console.log(minutosActuales)
    console.log(entradaActual)
    if (minutosRestantes <= 0) {
        throw new Error("La reserva ya termino");
    }
    if (minutosRestantes > 15) {
        throw new Error("Solo se pueden aumentar reservas que terminen en los próximos 15 minutos");
    }
    const HS = 24 * 60;
    const nuevaSalida = salidaActual + minutosExtra;
    const reservasSnap = await getDocs(
        query(
            collection(db, "reservas"),
            where("fecha", "==", reserva.fecha),
            where("parqueaderoId", "==", reserva.parqueaderoId)
        )
    );
    let siguienteReserva = null;
    for (const reservaDoc of reservasSnap.docs) {
        if (reservaDoc.id === reservaID) {
            continue;
        }
        const data = reservaDoc.data();
        const entradaExistente = convertirHora(data.horaEntrada);
        if (entradaExistente >= salidaActual) {
            if (siguienteReserva === null || entradaExistente < siguienteReserva) {
                siguienteReserva = entradaExistente;
            }
        }

    }
    const maximoRes = HS - salidaActual;
    const maximoDisponible = siguienteReserva - salidaActual;
    if (siguienteReserva !== null && nuevaSalida > siguienteReserva) {
        if (maximoDisponible <= 0) {
            throw new Error("No es posible extender esta reserva porque hay otra reserva inmediatamente después");
        }
        throw new Error(`Solo puedes extender hasta ${maximoDisponible} minutos`);
    }
    if (nuevaSalida > HS) {
        if (maximoRes <= 0) {
            throw new Error("No se puede aumentar, ya llego al limite de atención")
        }
        throw new Error(`Solo puedes aumnetar hasta  ${maximoRes} minutos`)
    }
    const nuevoPrecio = minutosExtra * precioo.minutosCobro;
    return {
        reservaID,
        nuevaSalida,
        nuevoPrecio
    };

}
export const Extender = async (reservaID, minutosExtra, nuevaSalida, nuevoPrecio) => {
    const reservaRef = doc(db, "reservas", reservaID);
    await updateDoc(reservaRef, { horaSalida: minutosAHora(nuevaSalida), minutosExtra: minutosExtra, extensionMinutos: true, PrecioExtension: nuevoPrecio });
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
export const reservasVigentes = async () => {
    const reservaSnap = await getDocs(collection(db, "reservas"));
    for (const reserva of reservaSnap.docs) {
        const data = reserva.data();
        const estado = obtenerEstado(data.fecha, data.horaEntrada, data.horaSalida, data.finalizadaAntes);
        if (estado == "activa" || estado == "pendiente") {
            return true;
        }
    }
    return false;
};
export const penalizar = async (reservaID, horaEntrada, horaSalida, fecha) => {
    const ahora = new Date();
    const reservas = (doc(db, "reservas", reservaID));
    const reservaSnap = await getDoc(reservas);
    const reserva = reservaSnap.data();
    const precio = await getDoc(doc(db, "configuracion", "general"))
    const precioo = precio.data();
    const fechahoy = ahora.toLocaleDateString("sv-SE");
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    const entradaActual = convertirHora(horaEntrada);
    const salidaActual = convertirHora(horaSalida);
    const minutosPasados = minutosActuales - salidaActual;
    const minutosCobrables = minutosPasados - 5;
    const costoAdicioanl = minutosCobrables * precioo.minutosCobro;
    if (reserva.penalizado) {
        throw new Error("El usuario ya fue penalizado");
    }
    if (fechahoy > fecha) {
        throw new Error("no se pueden usar reservas antiguas");
    }
    if (fechahoy < fecha) {
        throw new Error("no se pudene usar reservas de dias posteriores");
    }
    if (minutosActuales < entradaActual) {
        throw new Error("la reserva aun no ha empezado")
    }
    if (minutosPasados > 5) {
        await updateDoc(reservas, { HoraSalidaReal: minutosAHora(minutosActuales), minutosPasados: minutosPasados, costoAdicional: costoAdicioanl, penalizado: true });
    } else {
        await updateDoc(reservas, { HoraSalidaReal: minutosAHora(minutosActuales), penalizado: true, finalizadaAntes: true });
    }
    return reserva.parqueaderoId;
}
export const cambiarContraseña = async (contraseñaActual, nuevaContraseña) => {
    const usuario = auth.currentUser;
    const credential = EmailAuthProvider.credential(usuario.email, contraseñaActual);
    await reauthenticateWithCredential(usuario, credential);
    await updatePassword(usuario, nuevaContraseña);
}
export const recuperarContraseña = async (correo) => {
    await sendPasswordResetEmail(auth, correo);
}
export const ultimasreservas = async () => {
    const ahora = new Date();
    const fechahoy = ahora.toLocaleDateString("sv-SE");
    const q = query(collection(db, "reservas"), where("fecha", "==", fechahoy), orderBy("creado", "desc"),
        limit(2))
    return await getDocs(q)
}
export const obtenerUsuarios = async () => {
    const q = await getDocs(collection(db, "usuarios"));
    return q.size
}
export const crearconfig = async (metaIngreso, metaGeneral, metaReservas, metaUsos, minutosCobro) => {
    const ahora = new Date();
    const fehahoy = ahora.toLocaleDateString("sv-SE")
    await setDoc(doc(db, "configuracion", "general"), { metaIngreso, metaGeneral, metaReservas, metaUsos, minutosCobro, fechaConfigurado: fehahoy });
}
export const obetenerconfig = async () => {
    return getDoc(doc(db, "configuracion", "general"))
}
export const validarusoComun = async () => {
    const parqueaderosSnap = await getDocs(
        query(
            collection(db, "parqueaderos"),
            where("tipo", "==", "comun")
        )
    );

    const comunSnap = await getDocs(
        query(
            collection(db, "usocomun"),
            where("estado", "==", "activo")
        )
    );
    for (const parqueadero of parqueaderosSnap.docs) {
        const dataParqueadero = parqueadero.data();
        let disponible = true;
        for (const comun of comunSnap.docs) {

            const data = comun.data();

            if (data.parqueaderoId === parqueadero.id) {
                disponible = false;
                break;
            }
        }
        if (disponible) {
            return parqueadero.id;
        }
    }
    throw new Error("No hay espacios disponibles para ese horario");
}
export const hacercomun = async (parqueaderoId) => {
    const ahora = new Date();
    const fechahoy = ahora.toLocaleDateString("sv-SE")
    const horaActual = ahora.toLocaleTimeString("sv-SE")
    await addDoc(collection(db, "usocomun"), { placa: generarPlaca(), parqueaderoId, fecha: fechahoy, horaEntrada: horaActual, horaSalida: "", precio: 0, estado: "activo", creado: new Date() });
}

export const obtenerUsosAdmin = async () => {
    const hoy = new Date();
    const fechahoy = hoy.toLocaleDateString("sv-SE");
    const q = query(collection(db, "usocomun"), where("fecha", "==", fechahoy))
    return await getDocs(q);
}
export const SalioCarro = async (ComunID) => {
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString("sv-SE");
    const comunes = (doc(db, "usocomun", ComunID));
    const comunesSnap = await getDoc(comunes)
    const comun = comunesSnap.data();
    const precio = await getDoc(doc(db, "configuracion", "general"))
    const precioo = precio.data();
    const entrada = convertirHoracomun(comun.horaEntrada)
    const salida = convertirHoracomun(hora);
    const diferenciaSegundos = salida - entrada;
    const diferenciaMinutos = Math.ceil(diferenciaSegundos / 60);
    const precioacobrar = Math.round(diferenciaMinutos * precioo.minutosCobro);
    if (comun.estado === "finalizado") {
        throw new Error("El usuario ya salio")
    }
    await updateDoc(comunes, { horaSalida: hora, precio: precioacobrar, estado: "finalizado" })

}
export const ObtenerUsosA = async () => {
    return await getDocs(collection(db, "usocomun"));
}
export const NotificarUsuario = async (uid, fecha, callback)=>{
    const cola= query(collection(db, "colaespera"),where("fecha","==",fecha),where("uid","==",uid));
    onSnapshot(cola, (snapshot) => {
        snapshot.forEach((doc) => {
           const data = doc.data();
              if(data.estado==="prioritario"){
                callback(data, doc.id);
              }
        });
    });
}
export const cancelarNotificacion = async (colaId, fecha,  parqueaderoId)=>{
    await updateDoc(doc(db, "colaespera", colaId), { estado: "cancelado" });
    await gestionarCola(fecha, parqueaderoId);
    await deleteDoc(doc(db, "colaespera", colaId));
}
export const reservacola = async (uid, fecha)=>{
    const cola= query(collection(db, "colaespera"),where("fecha","==",fecha),where("uid","==",uid), where("estado","==","prioritario"));
    const colaa=await getDocs(cola);
    if(colaa.size>0){
        for(const colita of colaa.docs){
            await updateDoc(doc(db, "colaespera", colita.id), { estado: "reservado" });
            await deleteDoc(doc(db, "colaespera", colita.id));
        }
    }
}   
export const obtenertokenFCM=async()=>{
    const messagin= getMessaging();
    const permiso = await Notification.requestPermission();
        console.log("Permiso obtenido:", permiso);
     if (permiso !== "granted") {
        console.log("No se concedieron permisos");
        return null;
    }
    if(permiso==="granted"){
     
        const token= await getToken(messagin, { vapidKey: "BG8q0p1LPECiE-QNbCZMKOQNOY_1RZw5NShNsNnsRKJkBw_k5sDAlU6liuzh1_j-em6mU0DHanZOkQ62HQNmdXI"
        })
        console.log(token)
        return token;

    }
}

