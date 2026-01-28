import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/app-layout";
import { VoiceNotesPageWrapper } from "@/components/voice-notes-wrapper";
import { ContentPageWrapper } from "@/components/content-wrapper";
import { ChatPage } from "./pages/chat";
import { SettingsPage } from "./pages/settings";

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
    element: (
      <AppLayout>
        <ChatPage />
      </AppLayout>
    ),
  },
  {
    path: "/settings",
    element: (
      <AppLayout>
        <SettingsPage />
      </AppLayout>
    ),
  },
]);
