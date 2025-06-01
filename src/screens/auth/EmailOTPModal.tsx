import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native'
import { useAuth } from '../../hooks/useAuth'

interface EmailOTPModalProps {
  visible: boolean
  onClose: () => void
}

export function EmailOTPModal({ visible, onClose }: EmailOTPModalProps) {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setEmail('')
      setIsSent(false)
      setCooldownSeconds(0)
      setIsSending(false)
    }
  }, [visible])

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldownSeconds])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    setIsSending(true)

    try {
      await signInWithEmail(email.trim())
      setIsSent(true)
      setCooldownSeconds(60) // 60-second cooldown
      Alert.alert(
        'Check your inbox',
        `We've sent a magic link to ${email.trim()}. Click the link to sign in.`,
        [{ text: 'OK' }]
      )
    } catch (error) {
      console.error('Failed to send magic link:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleResendLink = async () => {
    if (cooldownSeconds > 0) return
    await handleSendMagicLink()
  }

  const dismissKeyboard = () => {
    Keyboard.dismiss()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Sign In with Email</Text>
              <View style={{ width: 60 }} />
            </View>
          </View>

          <View style={styles.content}>
            {!isSent ? (
              <>
                <View style={styles.inputSection}>
                  <View style={styles.inputHeader}>
                    <View style={styles.emailIcon}>
                      <Text style={styles.iconText}>📧</Text>
                    </View>
                    <Text style={styles.inputTitle}>
                      Enter your email
                    </Text>
                    <Text style={styles.inputSubtitle}>
                      We'll send you a magic link to sign in securely without a password.
                    </Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.textInput}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleSendMagicLink}
                    disabled={isSending || !email.trim()}
                    style={[
                      styles.primaryButton,
                      { opacity: isSending || !email.trim() ? 0.5 : 1 }
                    ]}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        Send Magic Link
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.successSection}>
                  <View style={styles.successHeader}>
                    <View style={styles.successIcon}>
                      <Text style={styles.iconText}>✅</Text>
                    </View>
                    <Text style={styles.successTitle}>
                      Check your inbox
                    </Text>
                    <Text style={styles.successSubtitle}>
                      We've sent a magic link to{' '}
                      <Text style={styles.emailText}>{email}</Text>. Click the link to
                      sign in.
                    </Text>
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      The link will expire in 15 minutes
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleResendLink}
                    disabled={cooldownSeconds > 0 || isSending}
                    style={[
                      styles.secondaryButton,
                      { opacity: cooldownSeconds > 0 || isSending ? 0.5 : 1 }
                    ]}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <Text style={styles.secondaryButtonText}>
                        {cooldownSeconds > 0
                          ? `Resend in ${cooldownSeconds}s`
                          : 'Resend Magic Link'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsSent(false)}
                    style={styles.textButton}
                  >
                    <Text style={styles.textButtonText}>
                      Use a different email
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    color: '#2563EB',
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  inputSection: {
    flex: 1,
  },
  inputHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  emailIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#DBEAFE',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 24,
  },
  inputTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  inputSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    fontSize: 18,
    backgroundColor: '#F8F9FA',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
  successSection: {
    flex: 1,
  },
  successHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  successIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#D1FAE5',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  emailText: {
    fontWeight: '500',
  },
  infoBox: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  infoText: {
    color: '#1E40AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 18,
  },
  textButton: {
    paddingVertical: 8,
  },
  textButtonText: {
    color: '#6B7280',
    textAlign: 'center',
  },
})