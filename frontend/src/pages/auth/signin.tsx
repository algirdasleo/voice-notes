import { useState, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { signIn, signUp, doesEmailExist } from "supertokens-web-js/recipe/emailpassword"
import { getAuthorisationURLWithQueryParamsAndSetState } from "supertokens-web-js/recipe/thirdparty"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { FaGoogle } from "react-icons/fa"

interface SuperTokensError {
  isSuperTokensGeneralError?: boolean
  message?: string
}

export const SigninPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get("redirectToPath") || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const clearErrors = useCallback(() => {
    setError(null)
    setFieldErrors({})
  }, [])

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {}

    if (!email.trim()) {
      errors.email = "Email is required"
    }

    if (!password) {
      errors.password = "Password is required"
    }

    if (isSignUp && !name.trim()) {
      errors.name = "Name is required"
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return false
    }

    return true
  }, [email, password, name, isSignUp])

  // Check if email already exists
  const checkEmailExists = useCallback(async (emailValue: string): Promise<boolean> => {
    try {
      const response = await doesEmailExist({ email: emailValue })
      if (response.doesExist) {
        setFieldErrors(prev => ({
          ...prev,
          email: "Email already exists. Please sign in instead",
        }))
        return true
      }
    } catch (err: unknown) {
      const error = err as SuperTokensError
      if (error.isSuperTokensGeneralError === true) {
        setError(error.message || "Error checking email")
      } else {
        setError("Error checking email")
      }
    }
    return false
  }, [])

  // Email/password sign in
  const handleSignIn = useCallback(async () => {
    clearErrors()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await signIn({
        formFields: [
          { id: "email", value: email.trim() },
          { id: "password", value: password },
        ],
      })

      if (response.status === "FIELD_ERROR") {
        const errors: Record<string, string> = {}
        response.formFields.forEach(field => {
          errors[field.id] = field.error
        })
        setFieldErrors(errors)
      } else if (response.status === "WRONG_CREDENTIALS_ERROR") {
        setError("Email and password combination is incorrect.")
      } else if (response.status === "SIGN_IN_NOT_ALLOWED") {
        setError(`Sign in not allowed: ${response.reason}`)
      } else {
        // Sign in successful
        navigate(redirectTo, { replace: true })
      }
    } catch (err: unknown) {
      const error = err as SuperTokensError
      if (error.isSuperTokensGeneralError === true) {
        setError(error.message || "An unexpected error occurred during sign in")
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [email, password, clearErrors, validateForm, navigate, redirectTo])

  // Email/password sign up
  const handleSignUp = useCallback(async () => {
    clearErrors()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Check if email exists before signing up
      const emailExists = await checkEmailExists(email.trim())
      if (emailExists) {
        setIsLoading(false)
        return
      }

      const response = await signUp({
        formFields: [
          { id: "email", value: email.trim() },
          { id: "password", value: password },
        ],
      })

      if (response.status === "FIELD_ERROR") {
        const errors: Record<string, string> = {}
        response.formFields.forEach(field => {
          errors[field.id] = field.error
        })
        setFieldErrors(errors)
      } else if (response.status === "SIGN_UP_NOT_ALLOWED") {
        setError(`Sign up not allowed: ${response.reason}`)
      } else {
        // Sign up successful, now update metadata with name
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001"
          await fetch(`${apiUrl}/api/auth/metadata`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ name: name.trim() }),
          })
        } catch (err) {
          console.error("Failed to update user name:", err)
          // Continue with navigation anyway
        }
        navigate(redirectTo, { replace: true })
      }
    } catch (err: unknown) {
      const error = err as SuperTokensError
      if (error.isSuperTokensGeneralError === true) {
        setError(error.message || "An unexpected error occurred during sign up")
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [email, password, name, clearErrors, validateForm, checkEmailExists, navigate, redirectTo])

  // Google login
  const handleGoogleLogin = useCallback(async () => {
    setIsLoading(true)
    clearErrors()

    try {
      const authUrl = await getAuthorisationURLWithQueryParamsAndSetState({
        thirdPartyId: "google",
        frontendRedirectURI: `${import.meta.env.VITE_FRONTEND_URL}/auth/callback/google`,
      })
      window.location.assign(authUrl)
    } catch (err: unknown) {
      const error = err as SuperTokensError
      setIsLoading(false)

      if (error.isSuperTokensGeneralError === true) {
        if (
          error.message?.includes("clientId") ||
          error.message?.includes("CLIENT_ID") ||
          error.message?.includes("clientSecret")
        ) {
          setError(
            "Google OAuth configuration issue. Please contact support. (OAuth credentials not properly configured)"
          )
        } else if (error.message?.includes("redirect")) {
          setError(
            "Redirect URL mismatch. Please ensure your sign-in origin is correctly configured. Contact support if the issue persists."
          )
        } else {
          setError(
            error.message ||
              "Unable to initialize Google sign in. Please try again or contact support."
          )
        }
      } else {
        setError(
          "Unable to connect to Google authentication. Please check your internet connection and try again."
        )
      }
    }
  }, [clearErrors])

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (isSignUp) {
        handleSignUp()
      } else {
        handleSignIn()
      }
    },
    [isSignUp, handleSignUp, handleSignIn]
  )

  const toggleAuthMode = useCallback(() => {
    setIsSignUp(prev => !prev)
    clearErrors()
    setEmail("")
    setPassword("")
    setName("")
  }, [clearErrors])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background pt-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
          <CardDescription>
            {isSignUp
              ? "Create a new account to get started with VoiceNotes"
              : "Sign in to your VoiceNotes account"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setFieldErrors(prev => ({ ...prev, email: "" }))
                }}
                disabled={isLoading}
                className={fieldErrors.email ? "border-destructive" : ""}
                autoComplete="email"
                required
              />
              {fieldErrors.email && (
                <p className="text-sm text-destructive" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">First Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John"
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    setFieldErrors(prev => ({ ...prev, name: "" }))
                  }}
                  disabled={isLoading}
                  className={fieldErrors.name ? "border-destructive" : ""}
                  autoComplete="name"
                  required
                />
                {fieldErrors.name && (
                  <p className="text-sm text-destructive" role="alert">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  setFieldErrors(prev => ({ ...prev, password: "" }))
                }}
                disabled={isLoading}
                className={fieldErrors.password ? "border-destructive" : ""}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
              />
              {fieldErrors.password && (
                <p className="text-sm text-destructive" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
              {isLoading
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <div className="flex items-center gap-2 w-full">
            <Separator className="flex-1" />
            <span className="text-xs uppercase text-muted-foreground">Or continue with</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            aria-label="Sign in with Google"
          >
            <FaGoogle className="w-4 h-4 mr-2" aria-hidden="true" />
            Google
          </Button>

          <button
            type="button"
            onClick={toggleAuthMode}
            disabled={isLoading}
            className="text-sm text-primary hover:underline mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
