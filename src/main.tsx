// React
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Components
import App from "./App.tsx";
import "./index.css";

// Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

import firebaseConfig from "./firebaseConfig.tsx";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
