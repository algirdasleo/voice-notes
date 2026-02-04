export const SettingsPage = () => {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl space-y-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
        </div>
        <div className="min-h-100 flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </div>
  )
}
