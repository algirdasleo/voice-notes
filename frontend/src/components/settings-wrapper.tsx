import { AppLayout } from "./app-layout"
import { SettingsPage } from "@/pages/dashboard/settings"

export function SettingsPageWrapper() {
  return (
    <AppLayout breadcrumbs={[{ label: "Settings" }]} showBeams>
      <SettingsPage />
    </AppLayout>
  )
}
