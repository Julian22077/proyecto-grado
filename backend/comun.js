import { auth} from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
const comun=document.getElementById("comun");
onAuthStateChanged(auth, async (user)=>{
    const token= await user.getIdToken();
comun.addEventListener("click", async (e)=>{
    try{
        const comun=await fetch("http://localhost:3000/validarusoComun",{
            method: "POST",
                headers: {
                    "Content-Type": "application/json",
                     "Authorization": `Bearer ${token}`
                }, 
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
            text: "Se generó la asigancion",
            icon: "success"
        })
    }catch(error){
        console.log(error);
    }
})
});