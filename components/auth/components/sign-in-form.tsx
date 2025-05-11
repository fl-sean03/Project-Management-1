"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Mail, Lock, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/auth"

interface SignInFormProps {
  setIsResetFlow: (isResetFlow: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

export function SignInForm({ setIsResetFlow, error, setError }: SignInFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const { signIn, signInWithGoogle } = useAuth()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await signIn(email, password)
      
      if (signInError) {
        console.error("Sign in error:", signInError)
        setError(signInError.message)
        return
      }
      
      // The auth hook will handle the redirect after successful login
    } catch (err: any) {
      console.error("Error during sign in:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)
    
    try {
      const { error: googleError } = await signInWithGoogle()
      
      if (googleError) {
        console.error("Google sign in error:", googleError)
        setError(googleError.message)
        return
      }
      
      // The redirect is handled by Supabase OAuth
    } catch (err: any) {
      console.error("Error during Google sign in:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleDemoAccess = () => {
    // For demo purposes, we'll just redirect to the projects page
    router.push("/projects")
  }

  return (
    <form onSubmit={handleSignIn}>
      <CardContent className="space-y-4 px-0 pt-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email-signin" className="text-sm font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              id="email-signin"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password-signin" className="text-sm font-medium">
              Password
            </Label>
            <button
              type="button"
              onClick={() => setIsResetFlow(true)}
              className="text-xs text-primary-blue hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              id="password-signin"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="pl-10"
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col justify-end px-0 gap-4">
        <Button
          type="submit"
          className="w-full bg-primary-blue transition-all hover:bg-primary-blue/90"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In with Email"
          )}
        </Button>
          
        <div className="relative w-full flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">OR</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full border-primary-blue text-primary-blue hover:bg-primary-blue/10 mt-4"
          onClick={handleDemoAccess}
        >
          View Demo
        </Button>
      </CardFooter>
    </form>
  )
} 