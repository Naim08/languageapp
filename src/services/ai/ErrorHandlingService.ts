import { rateLimitService } from './RateLimitService'

/**
 * Error Handling Service with Retry Logic
 * 
 * Provides robust error handling, automatic retries, circuit breaker pattern,
 * and graceful degradation for AI service calls.
 */

export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  exponentialBase: number
  jitter: boolean
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeoutMs: number
  monitoringPeriodMs: number
}

export interface ErrorContext {
  endpoint: string
  provider: 'openai' | 'gemini'
  attempt: number
  totalAttempts: number
  lastError?: Error
  startTime: number
}

export enum ErrorType {
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  API_ERROR = 'api_error',
  AUTHENTICATION = 'authentication',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export class APIError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public context?: ErrorContext
  ) {
    super(message)
    this.name = 'APIError'
  }
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failures: number
  lastFailureTime: number
  nextAttemptTime: number
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map()
  
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    exponentialBase: 2,
    jitter: true
  }

  private readonly defaultCircuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeoutMs: 60000, // 1 minute
    monitoringPeriodMs: 300000 // 5 minutes
  }

  private constructor() {
    // Clean up circuit breakers every 5 minutes
    setInterval(() => this.cleanupCircuitBreakers(), 5 * 60 * 1000)
  }

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService()
    }
    return ErrorHandlingService.instance
  }

  /**
   * Execute a function with retry logic and error handling
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context: Omit<ErrorContext, 'attempt' | 'totalAttempts' | 'startTime'>,
    retryConfig: Partial<RetryConfig> = {},
    circuitBreakerConfig: Partial<CircuitBreakerConfig> = {}
  ): Promise<T> {
    const config = { ...this.defaultRetryConfig, ...retryConfig }
    const cbConfig = { ...this.defaultCircuitBreakerConfig, ...circuitBreakerConfig }
    const serviceKey = `${context.provider}-${context.endpoint}`
    
    // Check circuit breaker
    if (!this.isCircuitBreakerClosed(serviceKey, cbConfig)) {
      throw new APIError(
        ErrorType.API_ERROR,
        `Service ${serviceKey} is temporarily unavailable (circuit breaker open)`,
        503,
        false,
        { ...context, attempt: 0, totalAttempts: 0, startTime: Date.now() }
      )
    }

    const fullContext: ErrorContext = {
      ...context,
      attempt: 0,
      totalAttempts: config.maxRetries + 1,
      startTime: Date.now()
    }

    let lastError: Error

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      fullContext.attempt = attempt + 1

      try {
        // Check rate limits before attempting
        const rateLimitCheck = await rateLimitService.checkRateLimit(
          'default', // In real app, use actual API key identifier
          context.endpoint,
          rateLimitService.estimateCost(context.endpoint, {})
        )

        if (!rateLimitCheck.allowed) {
          if (rateLimitCheck.retryAfter) {
            await this.delay(rateLimitCheck.retryAfter * 1000)
          }
          throw new APIError(
            ErrorType.RATE_LIMIT,
            `Rate limit exceeded: ${rateLimitCheck.reason}`,
            429,
            true,
            fullContext
          )
        }

        // Execute the function
        const result = await fn()
        
        // Success - reset circuit breaker on successful call
        this.onSuccess(serviceKey)
        rateLimitService.recordUsage('default', context.endpoint, 1, true)
        
        return result

      } catch (error) {
        lastError = error as Error
        fullContext.lastError = lastError
        
        const apiError = this.classifyError(error, fullContext)
        
        // Record failure
        this.onFailure(serviceKey, cbConfig)
        rateLimitService.recordUsage('default', context.endpoint, 1, false)
        
        // Don't retry if not retryable or max attempts reached
        if (!apiError.retryable || attempt >= config.maxRetries) {
          throw apiError
        }

        // Calculate delay before next attempt
        const delay = this.calculateDelay(attempt, config)
        console.warn(`Attempt ${attempt + 1} failed for ${serviceKey}, retrying in ${delay}ms:`, apiError.message)
        
        await this.delay(delay)
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError!
  }

  /**
   * Classify error type and determine if retryable
   */
  private classifyError(error: unknown, context: ErrorContext): APIError {
    if (error instanceof APIError) {
      return error
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    const statusCode = (error as any)?.statusCode || (error as any)?.status

    // Network/connectivity errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('ENOTFOUND')
    ) {
      return new APIError(ErrorType.NETWORK, errorMessage, statusCode, true, context)
    }

    // Rate limiting
    if (statusCode === 429 || errorMessage.includes('rate limit')) {
      return new APIError(ErrorType.RATE_LIMIT, errorMessage, statusCode, true, context)
    }

    // Authentication errors
    if (statusCode === 401 || statusCode === 403 || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      return new APIError(ErrorType.AUTHENTICATION, errorMessage, statusCode, false, context)
    }

    // Server errors (5xx) - usually retryable
    if (statusCode >= 500 && statusCode < 600) {
      return new APIError(ErrorType.API_ERROR, errorMessage, statusCode, true, context)
    }

    // Client errors (4xx) - usually not retryable except rate limits
    if (statusCode >= 400 && statusCode < 500) {
      return new APIError(ErrorType.API_ERROR, errorMessage, statusCode, false, context)
    }

    // Timeout errors
    if (errorMessage.includes('timeout')) {
      return new APIError(ErrorType.TIMEOUT, errorMessage, statusCode, true, context)
    }

    // Unknown errors - assume not retryable to be safe
    return new APIError(ErrorType.UNKNOWN, errorMessage, statusCode, false, context)
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelayMs * Math.pow(config.exponentialBase, attempt)
    let delay = Math.min(exponentialDelay, config.maxDelayMs)
    
    if (config.jitter) {
      // Add ±25% jitter to prevent thundering herd
      const jitterRange = delay * 0.25
      delay += (Math.random() - 0.5) * 2 * jitterRange
    }
    
    return Math.max(0, Math.floor(delay))
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check if circuit breaker allows requests
   */
  private isCircuitBreakerClosed(serviceKey: string, config: CircuitBreakerConfig): boolean {
    const breaker = this.circuitBreakers.get(serviceKey)
    
    if (!breaker) {
      return true // No breaker state means it's closed
    }

    const now = Date.now()

    switch (breaker.state) {
      case 'closed':
        return true
      
      case 'open':
        if (now >= breaker.nextAttemptTime) {
          // Transition to half-open
          breaker.state = 'half-open'
          return true
        }
        return false
      
      case 'half-open':
        return true
      
      default:
        return true
    }
  }

  /**
   * Record successful operation
   */
  private onSuccess(serviceKey: string): void {
    const breaker = this.circuitBreakers.get(serviceKey)
    
    if (breaker) {
      if (breaker.state === 'half-open') {
        // Success in half-open state - close the circuit
        breaker.state = 'closed'
        breaker.failures = 0
      }
    }
  }

  /**
   * Record failed operation
   */
  private onFailure(serviceKey: string, config: CircuitBreakerConfig): void {
    const now = Date.now()
    let breaker = this.circuitBreakers.get(serviceKey)
    
    if (!breaker) {
      breaker = {
        state: 'closed',
        failures: 0,
        lastFailureTime: now,
        nextAttemptTime: 0
      }
      this.circuitBreakers.set(serviceKey, breaker)
    }

    breaker.failures++
    breaker.lastFailureTime = now

    // Open circuit if failure threshold exceeded
    if (breaker.failures >= config.failureThreshold) {
      breaker.state = 'open'
      breaker.nextAttemptTime = now + config.resetTimeoutMs
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(serviceKey: string): {
    state: 'closed' | 'open' | 'half-open'
    failures: number
    nextAttemptTime?: number
  } {
    const breaker = this.circuitBreakers.get(serviceKey)
    
    if (!breaker) {
      return { state: 'closed', failures: 0 }
    }

    return {
      state: breaker.state,
      failures: breaker.failures,
      nextAttemptTime: breaker.state === 'open' ? breaker.nextAttemptTime : undefined
    }
  }

  /**
   * Reset circuit breaker for a service
   */
  resetCircuitBreaker(serviceKey: string): void {
    this.circuitBreakers.delete(serviceKey)
  }

  /**
   * Get all circuit breaker statuses
   */
  getAllCircuitBreakerStatuses(): Record<string, {
    state: 'closed' | 'open' | 'half-open'
    failures: number
    nextAttemptTime?: number
  }> {
    const statuses: Record<string, any> = {}
    
    for (const [key, breaker] of this.circuitBreakers.entries()) {
      statuses[key] = {
        state: breaker.state,
        failures: breaker.failures,
        nextAttemptTime: breaker.state === 'open' ? breaker.nextAttemptTime : undefined
      }
    }
    
    return statuses
  }

  /**
   * Clean up old circuit breaker entries
   */
  private cleanupCircuitBreakers(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    for (const [key, breaker] of this.circuitBreakers.entries()) {
      if (now - breaker.lastFailureTime > maxAge) {
        this.circuitBreakers.delete(key)
      }
    }
  }

  /**
   * Create a wrapper function with error handling
   */
  withErrorHandling<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context: Omit<ErrorContext, 'attempt' | 'totalAttempts' | 'startTime'>,
    retryConfig?: Partial<RetryConfig>
  ): (...args: T) => Promise<R> {
    return (...args: T) => {
      return this.executeWithRetry(
        () => fn(...args),
        context,
        retryConfig
      )
    }
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance()
