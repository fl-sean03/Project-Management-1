"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail, ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/auth"

interface PasswordResetFormProps {
  setIsResetFlow: (isResetFlow: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

export function PasswordResetForm({ setIsResetFlow, error, setError }: PasswordResetFormProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: resetError } = await resetPassword(email)
      
      if (resetError) {
        console.error("Password reset error:", resetError)
        setError(resetError.message)
        return
      }
      
      // Show success message
      setSuccess(true)
      setError("If an account exists with this email, we've sent password reset instructions.")
      
      // Optionally, return to sign-in view after a delay
      // setTimeout(() => setIsResetFlow(false), 5000)
    } catch (err: any) {
      console.error("Error during password reset:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <CardHeader className="space-y-1 px-0">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mr-2 h-8 w-8"
            onClick={() => setIsResetFlow(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl">Reset Password</CardTitle>
        </div>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handlePasswordReset}>
        <CardContent className="space-y-4 px-0 pt-4">
          {error && (
            <div
              className={`rounded-md p-3 text-sm animate-in fade-in slide-in-from-top-1 ${
                error.includes("sent password reset instructions") 
                  ? "bg-green-50 text-green-600" 
                  : "bg-red-50 text-red-600"
              }`}
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email-reset" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                id="email-reset"
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
        </CardContent>
        
        <CardFooter className="flex justify-end px-0">
          <Button
            type="submit"
            className="w-full bg-primary-blue transition-all hover:bg-primary-blue/90"
            disabled={loading || success}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : success ? (
              "Reset Link Sent"
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </CardFooter>
      </form>
    </>
  )
} 