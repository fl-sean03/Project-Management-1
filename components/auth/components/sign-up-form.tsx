"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Mail, Lock, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/auth"

interface SignUpFormProps {
  error: string | null
  setError: (error: string | null) => void
}

export function SignUpForm({ error, setError }: SignUpFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Validate password length
      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        setLoading(false)
        return
      }
      
      const { error: signUpError } = await signUp(email, password)
      
      if (signUpError) {
        console.error("Sign up error:", signUpError)
        setError(signUpError.message)
        return
      }
      
      // Show success message
      setSuccess(true)
      setError("Check your email for the confirmation link")
    } catch (err: any) {
      console.error("Error during sign up:", err)
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

  return (
    <form onSubmit={handleSignUp}>
      <CardContent className="space-y-4 px-0 pt-4">
        {error && (
          <div
            className={`rounded-md p-3 text-sm animate-in fade-in slide-in-from-top-1 ${
              error.includes("Check your email") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            }`}
          >
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email-signup" className="text-sm font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              id="email-signup"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="pl-10"
              disabled={success}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password-signup" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              id="password-signup"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password"
              minLength={6}
              className="pl-10"
              disabled={success}
            />
          </div>
          <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col justify-end px-0 gap-4">
        <Button
          type="submit"
          className="w-full bg-primary-blue transition-all hover:bg-primary-blue/90"
          disabled={loading || success}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing Up...
            </>
          ) : success ? (
            "Verification Email Sent"
          ) : (
            "Sign Up with Email"
          )}
        </Button>
        
        {!success && (
          <>
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
              disabled={googleLoading || success}
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
                  Sign up with Google
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </form>
  )
} 