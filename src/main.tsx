import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { SettingsProvider } from "./context/SettingsContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>
);

// Register the service worker so the player is installable (PWA) and works offline.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}
