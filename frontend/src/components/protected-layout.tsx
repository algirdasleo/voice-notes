import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import Session from "supertokens-web-js/recipe/session"

export function ProtectedLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const hasSession = await Session.doesSessionExist()
      setIsAuthenticated(hasSession)
      if (!hasSession) {
        window.location.href =
          "/auth/signin?redirectToPath=" + encodeURIComponent(window.location.pathname)
      }
    }
    checkSession()
  }, [])

  if (isAuthenticated === null) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />
  }

  return <Outlet />
}
