import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { useAuth } from '../../hooks/useAuth'
import { EmailOTPModal } from './EmailOTPModal'

export function SignInScreen() {
  const { signInWithApple, loading } = useAuth()
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false)

  React.useEffect(() => {
    checkAppleAuthAvailability()
  }, [])

  const checkAppleAuthAvailability = async () => {
    if (Platform.OS === 'ios') {
      try {
        const isAvailable = await AppleAuthentication.isAvailableAsync()
        setAppleAuthAvailable(isAvailable)
      } catch (error) {
        console.log('Apple Auth not available:', error)
        setAppleAuthAvailable(false)
      }
    }
  }

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Error', 'Apple Sign In is only available on iOS')
      return
    }

    if (!appleAuthAvailable) {
      Alert.alert(
        'Apple Sign In Unavailable',
        'Apple Sign In is not available on this device. This usually happens in the iOS Simulator. Please use email authentication instead.'
      )
      return
    }

    setIsSigningIn(true)
    try {
      await signInWithApple()
    } catch (error) {
      console.error('Apple sign in failed:', error)
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleEmailSignIn = () => {
    setShowEmailModal(true)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🎯</Text>
          </View>
          <Text style={styles.title}>
            AI Language Tutor
          </Text>
          <Text style={styles.subtitle}>
            Sign in to continue your personalized language learning journey
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleEmailSignIn}
            disabled={isSigningIn}
            style={[styles.emailButton, { opacity: isSigningIn ? 0.7 : 1 }]}
          >
            {isSigningIn ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={styles.emailButtonText}>
                  Continue with Email
                </Text>
                <Text style={styles.emailIcon}>📧</Text>
              </>
            )}
          </TouchableOpacity>

          {Platform.OS === 'ios' && appleAuthAvailable && (
            <>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={handleAppleSignIn}
                disabled={isSigningIn}
                style={styles.appleButtonContainer}
              >
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={12}
                  style={styles.appleButton}
                />
              </TouchableOpacity>
            </>
          )}

          {Platform.OS === 'ios' && !appleAuthAvailable && (
            <View style={styles.simulatorNotice}>
              <Text style={styles.simulatorNoticeText}>
                💡 Apple Sign In is not available in the iOS Simulator. Use email authentication or test on a physical device.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>

      <EmailOTPModal
        visible={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  header: {
    marginBottom: 64,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#DBEAFE',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#6B7280',
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
  },
  emailButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
    marginRight: 8,
  },
  emailIcon: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  appleButtonContainer: {
    width: '100%',
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  simulatorNotice: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  simulatorNoticeText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 20,
  },
})