import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ContentPageProps {
  content?: Array<{ id: string; title: string }>;
  isLoading?: boolean;
}

export const ContentPage = ({
  content,
  isLoading = false,
}: ContentPageProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Content</h1>
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

  if (!content || content.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Content</h1>
          <Button variant="outline" size="sm">
            <Plus className="size-4 mr-2" />
            Create new
          </Button>
        </div>
        <p className="text-muted-foreground">No content yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content</h1>
        <Button variant="outline" size="sm">
          <Plus className="size-4 mr-2" />
          Create new
        </Button>
      </div>
      <div className="space-y-2">
        {content.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
          >
            {item.title}
          </div>
        ))}
      </div>
    </div>
  );
};
