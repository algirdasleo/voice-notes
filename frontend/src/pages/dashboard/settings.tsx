import { useState } from "react"
import Session from "supertokens-web-js/recipe/session"

export const SettingsPage = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await Session.signOut()
      window.location.href = "/auth/signin"
    } catch (error) {
      console.error("Logout failed:", error)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl space-y-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
        </div>
        <div className="min-h-100 flex-1 rounded-xl bg-muted/50 md:min-h-min" />

        <div style={{ marginTop: "32px" }}>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              padding: "10px 20px",
              backgroundColor: "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: isLoggingOut ? "not-allowed" : "pointer",
              opacity: isLoggingOut ? 0.6 : 1,
            }}
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  )
}
