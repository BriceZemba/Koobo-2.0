import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { LanguageProvider } from "./context/LanguageContext";
import { UiLangProvider } from "./context/UiLangContext";
import { AuthProvider } from "./context/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UiLangProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </UiLangProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

// Enregistrement du service worker (mode hors-ligne / installable).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
