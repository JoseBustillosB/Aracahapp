import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// // Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAS7S3iHDRz2gK2X-nur5lX1C055bqIMYQ",
  authDomain: "auth-73e47.firebaseapp.com",
  projectId: "auth-73e47",
  storageBucket: "auth-73e47.firebasestorage.app",
  messagingSenderId: "749445434699",
  appId: "1:749445434699:web:510daf2eeec9d20817ecce",
  measurementId: "G-BHGE9FX8VY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DEV only: expone auth en window para tests con consola
if (import.meta.env.DEV) (window as any).auth = auth;

// Solo para pruebas del desarrollo y SOLO con números de prueba
// Evita reCAPTCHA y SMS real en localhost cuando usas "Phone numbers for testing"
if (import.meta.env.DEV) {
  // @ts-ignore
  auth.settings.appVerificationDisabledForTesting = true;
}


export { app, auth };


