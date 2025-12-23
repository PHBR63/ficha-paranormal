import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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

createRoot(document.getElementById("root")!).render(<App />);
