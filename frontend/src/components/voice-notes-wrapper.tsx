import { useState, useEffect } from "react";
import { AppLayout } from "./app-layout";
import { VoiceNotesPage } from "@/pages/voice-notes";

const loadVoiceNotes = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: "1", title: "Meeting Notes" },
        { id: "2", title: "Project Ideas" },
      ]);
    }, 1000);
  });
};

export function VoiceNotesPageWrapper() {
  const [notes, setNotes] = useState<Array<{
    id: string;
    title: string;
  }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVoiceNotes().then((data) => {
      setNotes(data as typeof notes);
      setIsLoading(false);
    });
  }, []);

  return (
    <AppLayout>
      <VoiceNotesPage notes={notes ?? undefined} isLoading={isLoading} />
    </AppLayout>
  );
}
