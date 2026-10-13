import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
const root = document.getElementById("app");
if (!root) throw new Error("缺少 #app 容器");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
