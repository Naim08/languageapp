import { User, Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  full_name?: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
}

export interface AuthContextType extends AuthState {
  signInWithApple: () => Promise<void>
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

export interface EmailOTPData {
  email: string
  timestamp: number
}