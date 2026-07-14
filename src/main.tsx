import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/geist-sans/900.css";

import "./index.css";

import App from "./App";
import { ToastProvider } from "./components/ui/ToastProvider";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Das Root-Element der Anwendung wurde nicht gefunden."
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);