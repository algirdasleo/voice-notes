import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface VoiceNotesPageProps {
  notes?: Array<{ id: string; title: string }>;
  isLoading?: boolean;
}

export const VoiceNotesPage = ({
  notes,
  isLoading = false,
}: VoiceNotesPageProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Voice Notes</h1>
          <Button disabled variant="outline" size="sm">
            <Plus className="size-4 mr-2" />
            Create new
          </Button>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Voice Notes</h1>
          <Button variant="outline" size="sm">
            <Plus className="size-4 mr-2" />
            Create new
          </Button>
        </div>
        <p className="text-muted-foreground">No notes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Voice Notes</h1>
        <Button variant="outline" size="sm">
          <Plus className="size-4 mr-2" />
          Create new
        </Button>
      </div>
      <div className="space-y-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
          >
            {note.title}
          </div>
        ))}
      </div>
    </div>
  );
};
