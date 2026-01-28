import { useState, useEffect } from "react";
import { AppLayout } from "./app-layout";
import { ContentPage } from "@/pages/content";

const loadContent = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: "1", title: "Document 1" },
        { id: "2", title: "Document 2" },
      ]);
    }, 1000);
  });
};

export function ContentPageWrapper() {
  const [content, setContent] = useState<Array<{
    id: string;
    title: string;
  }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent().then((data) => {
      setContent(data as typeof content);
      setIsLoading(false);
    });
  }, []);

  return (
    <AppLayout>
      <ContentPage content={content ?? undefined} isLoading={isLoading} />
    </AppLayout>
  );
}
