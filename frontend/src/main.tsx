import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@radix-ui/themes/styles.css"
import "./index.css"

import { Theme } from "@radix-ui/themes"
import App from "./App"

import SuperTokens from "supertokens-web-js"
import Session from "supertokens-web-js/recipe/session"
import EmailPassword from "supertokens-web-js/recipe/emailpassword"
import ThirdParty from "supertokens-web-js/recipe/thirdparty"

SuperTokens.init({
  appInfo: {
    appName: "VoiceNotes",
    apiDomain: import.meta.env.VITE_BACKEND_URL,
    apiBasePath: "/auth",
  },
  recipeList: [EmailPassword.init(), Session.init(), ThirdParty.init()],
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme appearance="inherit">
      <App />
    </Theme>
  </StrictMode>
)
