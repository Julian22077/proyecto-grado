import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {auth} from "./firebase.js"
const video = document.getElementById("camara");
const canvas = document.getElementById("canvas");
const resultado = document.getElementById("resultado");
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
function mostrarEstado(texto, tipo) {
    if (!resultado) return;
    resultado.className = "escaneo-status" + (tipo ? " escaneo-status--" + tipo : "");
    resultado.textContent = texto;
}
onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
        adminContainer.innerHTML = "<p>No hay sesión iniciada</p>";
        window.location.href = "index.html";
    }
    const token = await usuarioAuth.getIdToken()
    let stream = null;
    async function solicitarCamaraMovil() {
        if (!window.Capacitor?.isNativePlatform?.()) return true;
        const camara = window.Capacitor.Plugins?.Camera;
        if (!camara) return true;
        let permiso = await camara.checkPermissions();
        if (permiso.camera !== "granted") {
            permiso = await camara.requestPermissions({ permissions: ["camera"] });
        }
        return permiso.camera === "granted";
    }
    async function iniciarCamara() {
        try {
            const permitido = await solicitarCamaraMovil();
            if (!permitido) {
                mostrarEstado("No se pudo acceder a la cámara.", "error");
                return;
            }
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
            video.srcObject = stream
            if (window.Capacitor?.isNativePlatform?.()) {
                video.muted = true;
                await video.play();
            }
        } catch (error) {
            console.error("Error al acceder a la cámara:", error);
            mostrarEstado("No se pudo acceder a la cámara.", "error");

        }
    }
    async function detectarPlaca() {
        try {
            if (!video.videoWidth || !video.videoHeight) {
                return;
            }
            const contexto = canvas.getContext("2d");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise((resolve) => {
                canvas.toBlob(resolve, "image/jpeg", 0.9);
            });
            if (!blob) {
                return;
            }
            const formData = new FormData();
            formData.append("imagen", blob, "captura.jpg");
            mostrarEstado("Detectando placa...", "busy");
            const respuesta = await fetch("https://proyecto-grado-rouge.vercel.app/detectar", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            }
            );
            const datos = await respuesta.json();
            if (!respuesta.ok) {
               Swal.fire({
                title:"error",
                text:datos.error,
                icon:"error"
               })
               return;
            }
            await Swal.fire({
                title:"Placa Escaneada",
                text: "la placa se esaceno correctamente",
                icon:"succes"
            })
            window.location.href="usoscomunes.html"
           
            
        } catch (error) {
            console.error("Error detectando placa:", error);
        }
    }
    iniciarCamara();
    setInterval(
        detectarPlaca,
        10000
    );
})