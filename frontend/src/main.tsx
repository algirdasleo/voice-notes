import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@radix-ui/themes/styles.css";
import "./index.css";

import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <Theme appearance="inherit">
        <App />
      </Theme>
    </ThemeProvider>
  </StrictMode>
);
