import { AppLayout } from "./app-layout"
import { SettingsPage } from "@/pages/settings"

export function SettingsPageWrapper() {
  return (
    <AppLayout breadcrumbs={[{ label: "Settings" }]}>
      <SettingsPage />
    </AppLayout>
  )
}
