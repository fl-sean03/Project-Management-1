'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed in hooks/auth.tsx:', _event, session?.user?.id || 'no user')
      setUser(session?.user ?? null)
      setIsLoading(false)
      
      // Redirect after successful authentication if on callback page
      if (session?.user && window.location.pathname.includes('/auth/callback')) {
        router.push('/projects')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, router])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (!error) {
      // Redirect to projects page after successful sign-in
      router.push('/projects')
    }
    
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      }
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    console.log('Starting Google sign-in flow (from hooks/auth.tsx)...')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    if (error) {
      console.error('Error during Google sign-in:', error)
    }
    
    return { error }
  }

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 