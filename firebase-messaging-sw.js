importScripts("https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js");

const firebaseConfig = {
    apiKey: "AIzaSyC-XuvC-iOS2GXL1mAQ3Zs84g1Pc_xw98E",
    authDomain: "parqueadero-40b7c.firebaseapp.com",
    projectId: "parqueadero-40b7c",
    storageBucket: "parqueadero-40b7c.firebasestorage.app",
    messagingSenderId: "1045474082793",
    appId: "1:1045474082793:web:40d3053035708fded1d578"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

    console.log("Notificación recibida:", payload);

    const notificationTitle = payload.notification?.title || "Parqueadero";

    const notificationOptions = {
        body: payload.notification?.body || "Tienes una nueva notificación",
        icon: "/favicon.ico"
    };

    self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );
});

