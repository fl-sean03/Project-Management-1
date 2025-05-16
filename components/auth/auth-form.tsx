"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { ZyraLogo } from "@/components/zyra-logo"
import { SignInForm } from "./components/sign-in-form"
import { SignUpForm } from "./components/sign-up-form"
import { PasswordResetForm } from "./components/password-reset-form"

export function AuthForm() {
  const [isResetFlow, setIsResetFlow] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
            <SignInForm 
              setIsResetFlow={setIsResetFlow}
              error={error}
              setError={setError}
            />
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <SignUpForm
              error={error}
              setError={setError}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="px-6 py-6">
          <PasswordResetForm
            setIsResetFlow={setIsResetFlow}
            error={error}
            setError={setError}
          />
        </div>
      )}
    </Card>
  )
} 