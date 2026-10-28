import { dirname, join } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), ".env") });

const correo = process.argv[2];
const quitar = process.argv[3] === "quitar";
if (!correo) {
    console.error("Uso: node marcar-admin.js correo@dominio.com [quitar]");
    process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
}

const adminauth = getAuth();
const cuenta = await adminauth.getUserByEmail(correo);
await adminauth.setCustomUserClaims(cuenta.uid, { admin: !quitar });
if (quitar) {
    await adminauth.revokeRefreshTokens(cuenta.uid);
}
console.log(quitar ? `Rol retirado: ${correo}` : `Rol asignado: ${correo}`);
