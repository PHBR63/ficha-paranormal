import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove o loader inicial quando o React montar
const initialLoader = document.getElementById("initial-loader");
if (initialLoader) {
  initialLoader.style.opacity = "0";
  initialLoader.style.transition = "opacity 0.3s ease-out";
  setTimeout(() => initialLoader.remove(), 300);
}

createRoot(document.getElementById("root")!).render(<App />);
