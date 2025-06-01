import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'

interface MagicLinkState {
  isLoading: boolean
  error: string | null
  success: boolean
}

export function useMagicLink() {
  const [state, setState] = useState<MagicLinkState>({
    isLoading: false,
    error: null,
    success: false,
  })

  const sendMagicLink = async (email: string) => {
    setState({ isLoading: true, error: null, success: false })
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'ai-language-tutor://',
        },
      })

      if (error) {
        setState({ isLoading: false, error: error.message, success: false })
        Alert.alert('Error', error.message)
        return false
      }

      setState({ isLoading: false, error: null, success: true })
      Alert.alert(
        'Check your email',
        'We sent you a magic link. Click the link in your email to sign in.'
      )
      return true
    } catch (error: any) {
      setState({ 
        isLoading: false, 
        error: error.message || 'Failed to send magic link', 
        success: false 
      })
      Alert.alert('Error', 'Failed to send magic link')
      return false
    }
  }

  const handleMagicLinkResponse = async (url: string) => {
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
            return false
          } else {
            console.log('Successfully authenticated via magic link')
            Alert.alert('Success', 'You have been signed in successfully!')
            return true
          }
        }
      }
      return false
    } catch (error) {
      console.error('Error handling magic link:', error)
      Alert.alert('Error', 'Failed to process magic link')
      return false
    }
  }

  const resetState = () => {
    setState({ isLoading: false, error: null, success: false })
  }

  return {
    ...state,
    sendMagicLink,
    handleMagicLinkResponse,
    resetState,
  }
}