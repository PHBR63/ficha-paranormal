import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// PWA: garante que atualizações do Service Worker não deixem o app preso em bundles antigos.
// Motivo: quando o SW mantém um cache antigo, o usuário pode continuar carregando chunks antigos
// (ex.: CampaignView-*.js) e ver erros como "ReactCurrentBatchConfig" mesmo após atualizar dependências.
import { registerAppWorker } from "./lib/register-app-worker";
import { registerSW } from "virtual:pwa-register";

/**
 * Limpa Service Workers e caches UMA vez.
 * Importante: evita loop infinito usando uma flag em localStorage.
 */
async function purgeServiceWorkerOnce() {
  try {
    if (!("serviceWorker" in navigator)) return;

    const key = "pwa_sw_purged_v1";
    if (localStorage.getItem(key) === "1") return;

    // Marca antes para evitar loops caso o reload falhe
    localStorage.setItem(key, "1");

    // Desregistra SWs
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));

    // Limpa caches do Workbox/PWA
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    // Força reload para baixar assets novos
    window.location.reload();
  } catch {
    // Falha silenciosa: se não der para limpar, seguimos com o fluxo normal.
  }
}

// A interface oferece "Atualizar"; detectar uma versão não interrompe um ritual.
registerAppWorker(registerSW);

// Em caso de cache “preso”, faz purge uma vez no boot.
// Isso é especialmente útil quando o usuário está bloqueado por um bundle antigo.
purgeServiceWorkerOnce();

// Remove o loader inicial com transição suave quando o React montar
const initialLoader = document.getElementById("initial-loader");
if (initialLoader) {
  // Adiciona classe para trigger da animação CSS
  initialLoader.classList.add("fade-out");
  
  // Remove o elemento após a transição completar
  setTimeout(() => {
    initialLoader.remove();
  }, 500);
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
