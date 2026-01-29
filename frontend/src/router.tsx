import { createBrowserRouter } from "react-router-dom"
import { VoiceNotesPageWrapper } from "@/components/voice-notes-wrapper"
import { ContentPageWrapper } from "@/components/content-wrapper"
import { ChatPageWrapper } from "@/components/chat-wrapper"
import { SettingsPageWrapper } from "@/components/settings-wrapper"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <VoiceNotesPageWrapper />,
  },
  {
    path: "/voice-notes",
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
  {
    path: "/settings",
    element: <SettingsPageWrapper />,
  },
])
