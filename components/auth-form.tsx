"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card"
import { Mail, Lock } from "lucide-react"
import { ZyraLogo } from "@/components/zyra-logo"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [isResetFlow, setIsResetFlow] = useState(false)

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate authentication delay
    setTimeout(() => {
      setLoading(false)
      // In a real app, this would authenticate with a backend
      // For this MVP, we'll just redirect to the projects page
      router.push("/projects")
    }, 1000)
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate authentication delay
    setTimeout(() => {
      setLoading(false)
      // In a real app, this would register with a backend
      // For this MVP, we'll just show a success message
      setError("Check your email for the confirmation link")
    }, 1000)
  }

  const handleDemoAccess = () => {
    // For demo purposes, we'll just redirect to the projects page
    router.push("/projects")
  }

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate password reset delay
    setTimeout(() => {
      setLoading(false)
      setError("If an account exists with this email, we've sent password reset instructions.")
      // Optionally, you could return to the sign-in view after showing the message
      // setTimeout(() => setIsResetFlow(false), 3000)
    }, 1000)
  }

  return (
    <Card className="w-full max-w-md overflow-hidden border-none shadow-lg">
      {/* Card header with Zyra branding */}
      <div className="bg-gradient-to-r from-primary-blue to-secondary-purple p-6 text-center text-white">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <ZyraLogo size="lg" />
        </div>
        <CardTitle className="text-2xl font-bold">Zyra</CardTitle>
        <CardDescription className="text-blue-100">Organize Everything Effortlessly</CardDescription>
      </div>

      {!isResetFlow ? (
        <Tabs defaultValue="signin" className="px-6 py-6">
          <TabsList className="grid w-full grid-cols-2 rounded-md bg-gray-100">
            <TabsTrigger
              value="signin"
              className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-4">
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
              <CardFooter className="flex justify-end px-0">
                <Button
                  type="submit"
                  className="w-full bg-primary-blue transition-all hover:bg-primary-blue/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </CardFooter>
            </form>

            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full border-primary-blue text-primary-blue hover:bg-primary-blue/10"
                onClick={handleDemoAccess}
              >
                View Demo
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
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
                    />
                  </div>
                  <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end px-0">
                <Button
                  type="submit"
                  className="w-full bg-primary-blue transition-all hover:bg-primary-blue/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Signing Up...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      ) : null}

      {isResetFlow && (
        <div className="px-6 py-6 animate-in fade-in slide-in-from-right-1">
          <button
            type="button"
            onClick={() => setIsResetFlow(false)}
            className="mb-4 flex items-center text-sm text-primary-blue hover:underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to sign in
          </button>

          <CardTitle className="mb-2">Reset your password</CardTitle>
          <CardDescription className="mb-4">
            Enter your email address and we'll send you instructions to reset your password.
          </CardDescription>

          <form onSubmit={handlePasswordReset}>
            <CardContent className="space-y-4 px-0 pt-4">
              {error && (
                <div
                  className={`rounded-md p-3 text-sm animate-in fade-in slide-in-from-top-1 ${
                    error.includes("we've sent") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
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
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end px-0 pt-4">
              <Button
                type="submit"
                className="w-full bg-primary-blue transition-all hover:bg-primary-blue/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  "Send Reset Instructions"
                )}
              </Button>
            </CardFooter>
          </form>
        </div>
      )}
    </Card>
  )
}
