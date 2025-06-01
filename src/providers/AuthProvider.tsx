import React, { createContext, useEffect, useState, ReactNode } from 'react'
import { Alert, Platform } from 'react-native'
import { Session, User } from '@supabase/supabase-js'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '../lib/supabase'
import { AuthContextType, AuthState, Profile } from '../types/supabase'

export const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  })

  // Handle deep links for magic links
  const handleDeepLink = async (url: string) => {
    try {
      // Parse the URL to extract tokens
      if (url.includes('#access_token=') || url.includes('?access_token=')) {
        console.log('Magic link received:', url)
        
        // Extract tokens from URL
        const hashParams = new URLSearchParams(url.split('#')[1] || url.split('?')[1])
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          // Set the session with Supabase
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('Error setting session from magic link:', error)
            Alert.alert('Authentication Error', 'Failed to authenticate with magic link')
          } else {
            console.log('Successfully authenticated via magic link')
          }
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user || null,
        loading: false,
      }))
      
      if (session?.user) {
        fetchProfile(session.user.id)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user || null,
          loading: false,
        }))

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setAuthState(prev => ({ ...prev, profile: null }))
        }

        if (event === 'SIGNED_OUT') {
          // Clear any cached data
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
          })
        }
      }
    )

    // Check if app was opened with a magic link
    const checkInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL()
        if (initialURL) {
          await handleDeepLink(initialURL)
        }
      } catch (error) {
        console.error('Error checking initial URL:', error)
      }
    }

    checkInitialURL()

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url)
    })

    return () => {
      subscription.unsubscribe()
      linkingSubscription?.remove()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        await createProfile(userId)
      } else if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setAuthState(prev => ({ ...prev, profile }))
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
    }
  }

  const createProfile = async (userId: string) => {
    try {
      const user = authState.user
      if (!user) return

      const profileData = {
        id: userId,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
      } else {
        setAuthState(prev => ({ ...prev, profile }))
      }
    } catch (error) {
      console.error('Error in createProfile:', error)
    }
  }

  const signInWithApple = async () => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('Error', 'Apple Sign In is only available on iOS')
        return
      }

      // Check if we're in simulator - if so, skip native and go to web
      const isSimulator = __DEV__ && Platform.OS === 'ios'
      
      // Try native Apple authentication first (for physical devices only)
      if (!isSimulator) {
        const isAvailable = await AppleAuthentication.isAvailableAsync()
        
        if (isAvailable) {
          try {
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            })

            if (credential.identityToken) {
              const { error } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
              })

              if (error) {
                Alert.alert('Error', error.message)
              }
              return
            }
          } catch (nativeError: any) {
            if (nativeError.code === 'ERR_REQUEST_CANCELED') {
              return
            }
            console.log('Native Apple Sign In failed, falling back to web:', nativeError)
          }
        }
      }

      // Fallback to web-based Apple Sign In (works in simulator)
      console.log('Using web-based Apple Sign In')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'ai-language-tutor://',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      console.log('OAuth response:', { data, error })

      if (error) {
        console.error('OAuth error:', error)
        Alert.alert('Error', `OAuth failed: ${error.message}`)
        return
      }

      if (data?.url) {
        console.log('Opening OAuth URL:', data.url)
        // Open the OAuth URL in the built-in browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'ai-language-tutor://'
        )

        console.log('WebBrowser result:', result)

        if (result.type === 'success' && result.url) {
          // Handle the redirect URL
          await handleDeepLink(result.url)
        } else if (result.type === 'cancel') {
          console.log('User canceled Apple Sign In')
        }
      } else {
        console.error('No OAuth URL returned from Supabase')
        Alert.alert('Error', 'Apple Sign In is not configured properly. Please configure the Apple provider in Supabase dashboard.')
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign in with Apple')
      console.error('Apple sign in error:', error)
    }
  }

  const signInWithEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'ai-language-tutor://',
        },
      })

      if (error) {
        Alert.alert('Error', error.message)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send magic link')
      console.error('Email sign in error:', error)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        Alert.alert('Error', error.message)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out')
      console.error('Sign out error:', error)
    }
  }

  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Session refresh error:', error)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }

  const value: AuthContextType = {
    ...authState,
    signInWithApple,
    signInWithEmail,
    signOut,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}