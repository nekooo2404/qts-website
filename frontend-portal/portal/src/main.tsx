import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "animate.css";
import "./styles.css";
import PortalApp from "./PortalApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode><PortalApp /></StrictMode>,
);
