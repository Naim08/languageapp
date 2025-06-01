import React, { useState, useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../hooks/useAuth'
import { SignInScreen } from '../screens/auth/SignInScreen'
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen'

interface AuthGateProps {
  children: React.ReactNode
}

const ONBOARDING_KEY = '@onboarding_completed'

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading, profile } = useAuth()
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    if (user) {
      checkOnboardingStatus()
    }
  }, [user])

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY)
      setHasCompletedOnboarding(completed === 'true')
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      setHasCompletedOnboarding(false)
    }
  }

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
      setHasCompletedOnboarding(true)
    } catch (error) {
      console.error('Error saving onboarding status:', error)
    }
  }

  if (loading || (user && hasCompletedOnboarding === null)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (!user) {
    return <SignInScreen />
  }

  if (!hasCompletedOnboarding) {
    return <WelcomeScreen onComplete={completeOnboarding} />
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
})