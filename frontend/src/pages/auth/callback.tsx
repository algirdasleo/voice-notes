import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import Session from "supertokens-web-js/recipe/session"

interface ErrorDetails {
  title: string
  message: string
  details?: string
}

export const CallbackPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [redirectTimer, setRedirectTimer] = useState(3)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code")
        const error_param = searchParams.get("error")
        const error_description = searchParams.get("error_description")

        // Check for explicit OAuth errors
        if (error_param) {
          const errorMessages: Record<string, string> = {
            access_denied:
              "You cancelled the authentication process. Please try again if you'd like to sign in.",
            invalid_scope: "Invalid permissions requested. Please contact support.",
            server_error:
              "Google authentication service is temporarily unavailable. Please try again.",
            temporarily_unavailable:
              "Google authentication service is temporarily unavailable. Please try again.",
          }

          throw {
            title: "Authentication Cancelled",
            message: errorMessages[error_param] || error_description || "Authentication failed",
            details: `Error code: ${error_param}`,
          }
        }

        if (!code) {
          throw {
            title: "Missing Authorization Code",
            message:
              "The authorization code was not received from Google. This may indicate a network issue or misconfiguration.",
            details: "Please check your internet connection and try again.",
          }
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
        throw {
          title: "Session Creation Failed",
          message:
            "Authentication was successful, but your session could not be established. This may be a temporary issue.",
          details: `Attempts: ${attempts}/${maxAttempts}. Please try signing in again.`,
        }
      } catch (err: unknown) {
        setIsLoading(false)

        // Handle both string errors and error objects
        if (typeof err === "object" && err !== null && "title" in err) {
          setError(err as ErrorDetails)
        } else if (err instanceof Error) {
          setError({
            title: "Authentication Error",
            message: err.message || "An unexpected error occurred during authentication.",
            details: "Please try again.",
          })
        } else {
          setError({
            title: "Authentication Error",
            message: "An unexpected error occurred. Please try again.",
            details: "If this persists, please contact support.",
          })
        }
      }
    }

    handleCallback()
  }, [navigate, searchParams])

  useEffect(() => {
    if (!error) return

    const timer = setInterval(() => {
      setRedirectTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate("/auth/signin", { replace: true })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [error, navigate])

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
        <div className="max-w-md w-full px-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-destructive mb-3">{error.title}</h2>
            <p className="text-sm text-foreground mb-2">{error.message}</p>
            {error.details && <p className="text-xs text-muted-foreground mb-4">{error.details}</p>}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/auth/signin", { replace: true })}
                variant="outline"
                className="w-full"
              >
                Back to Sign In
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Auto-redirecting in {redirectTimer}s...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
