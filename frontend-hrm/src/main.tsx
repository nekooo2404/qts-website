import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "animate.css";
import "./styles.css";
import { App } from "./App";
import { HrmErrorBoundary } from "./ErrorBoundary";

const preloadRecoveryKey = "qts-hrm:preload-recovered";

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  try {
    if (window.sessionStorage.getItem(preloadRecoveryKey) === "1") return;
    window.sessionStorage.setItem(preloadRecoveryKey, "1");
  } catch {
    // Storage can be unavailable in hardened browsers; reloading once is still the safest recovery.
  }
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HrmErrorBoundary>
      <App />
    </HrmErrorBoundary>
  </StrictMode>,
);
