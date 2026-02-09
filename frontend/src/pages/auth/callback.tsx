import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { signInAndUp } from "supertokens-web-js/recipe/thirdparty"

interface ErrorDetails {
  title: string
  message: string
  details?: string
}

export const CallbackPage = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [redirectTimer, setRedirectTimer] = useState(3)
  const hasRun = useRef(false)

  useEffect(() => {
    // Prevent double-run in StrictMode
    if (hasRun.current) return
    hasRun.current = true

    const handleCallback = async () => {
      try {
        const response = await signInAndUp()
        const status = response.status as string

        if (status === "OK") {
          navigate("/", { replace: true })
          return
        }

        if (status === "NO_EMAIL_GIVEN_BY_PROVIDER") {
          throw {
            title: "Email Not Available",
            message:
              "Google did not provide an email address. Please ensure your Google account has a verified email.",
            details: "Try again or use email/password sign in.",
          }
        }

        if (status === "SIGN_IN_UP_NOT_ALLOWED") {
          throw {
            title: "Sign In Not Allowed",
            message:
              "Signing in with this account is not allowed. This may be due to account linking restrictions.",
            details: "Please try a different sign-in method or contact support.",
          }
        }

        throw {
          title: "Authentication Failed",
          message: "An unexpected response was received. Please try again.",
          details: `Status: ${status}`,
        }
      } catch (err: unknown) {
        setIsLoading(false)

        // Handle our custom error objects
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
  }, [navigate])

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
