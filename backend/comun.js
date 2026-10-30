import { auth} from "./firebase.js";
import { esAdmin } from "./rol.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
window.addEventListener("offline",()=>{
        Swal.fire({
            title: "Error",
            text: "No hay conexión a internet, los servicios no estarán disponibles, revise su conexión y vuelva a intentarlo",
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
const containerPlaca=document.getElementById("placacontenido")
onAuthStateChanged(auth, async (user)=>{
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    if (!(await esAdmin(user))) {
        window.location.href = "usuario.html";
        return;
    }
    const token= await user.getIdToken();
containerPlaca.addEventListener("submit", async (e)=>{
    e.preventDefault()
    const placa=containerPlaca["PlacaInfo"].value;
    try{
        const comun=await fetch("https://proyecto-grado-rouge.vercel.app/validarusoComun",{
            method: "POST",
                headers: {
                    "Content-Type": "application/json",
                     "Authorization": `Bearer ${token}`
                }, 
                body: JSON.stringify({placa:placa})
        })
        const data=await comun.json();
        if(!comun.ok){
            await Swal.fire({
                title: "Error",
                text: data.error,
                icon: "error"
            })
            return;
        }
        await Swal.fire({
            title: "Exito",
            text: "Se generó la asignación",
            icon: "success"
        })
         window.location.href="usoscomunes.html"
    }catch(error){
        console.log(error);
    }
})
});