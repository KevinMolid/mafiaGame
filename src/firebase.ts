import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

import { getDatabase } from "firebase/database";
import firebaseConfig from "./firebaseConfig";
import { initServerTime } from "./Functions/serverTime";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
initServerTime(app);

// App Check
if (typeof window !== "undefined") {
  // DEV: use debug token so you don't get locked out while testing
  if (import.meta.env.DEV) {
    // prints a token in console the first time
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}