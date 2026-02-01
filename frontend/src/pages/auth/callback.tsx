import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Session from "supertokens-web-js/recipe/session"

export const CallbackPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code")

        if (!code) {
          throw new Error("No authorization code received from Google")
        }

        // The SuperTokens SDK should have already processed the token exchange
        // We just need to verify the session was created
        let attempts = 0
        const maxAttempts = 10
        const checkInterval = 500

        // Retry checking for session as it might take a moment to be established
        while (attempts < maxAttempts) {
          const hasSession = await Session.doesSessionExist()
          if (hasSession) {
            navigate("/", { replace: true })
            return
          }
          attempts++
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, checkInterval))
          }
        }

        // If we reach here, no session was created
        throw new Error(
          "Authentication successful but session was not established. Please try again."
        )
      } catch (_err) {
        setIsLoading(false)
        setError("An error occurred during authentication. Please try again.")

        // Redirect back to signin after a delay
        setTimeout(() => {
          navigate("/auth/signin", { replace: true })
        }, 3000)
      }
    }

    handleCallback()
  }, [navigate, searchParams])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Completing sign in...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md w-full">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <h2 className="text-lg font-semibold text-destructive mb-2">Authentication Error</h2>
            <p className="text-sm text-destructive mb-4">{error}</p>
            <p className="text-xs text-muted-foreground">Redirecting to sign in in 3 seconds...</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
