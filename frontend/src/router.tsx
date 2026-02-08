import { createBrowserRouter } from "react-router-dom"
import { VoiceNotesPageWrapper } from "@/components/voice-notes-wrapper"
import { ContentPageWrapper } from "@/components/content-wrapper"
import { ChatPageWrapper } from "@/components/chat-wrapper"
import { SigninPage } from "./pages/auth/signin"
import { CallbackPage } from "./pages/auth/callback"
import { ProtectedLayout } from "@/components/protected-layout"

export const router = createBrowserRouter([
  {
    path: "/auth/signin",
    element: <SigninPage />,
  },
  {
    path: "/auth/callback/google",
    element: <CallbackPage />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: "/",
        element: <VoiceNotesPageWrapper />,
      },
      {
        path: "/content",
        element: <ContentPageWrapper />,
      },
      {
        path: "/chat",
        element: <ChatPageWrapper />,
      },
    ],
  },
])
