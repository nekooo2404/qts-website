import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import PortalApp from "./PortalApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode><PortalApp /></StrictMode>,
);
