/**
 * API Rate Limiting Service
 * 
 * Manages rate limits and quotas for OpenAI and Gemini APIs to prevent
 * overuse and API key blocking.
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  maxCost?: number // For cost-based limiting
}

interface RateLimitEntry {
  count: number
  cost: number
  resetTime: number
}

interface APIUsageStats {
  requests: number
  cost: number
  errors: number
  lastRequest: number
}

export class RateLimitService {
  private static instance: RateLimitService
  private limits: Map<string, RateLimitEntry> = new Map()
  private usage: Map<string, APIUsageStats> = new Map()
  
  // Rate limit configurations
  private configs: Record<string, RateLimitConfig> = {
    'openai-tts': { maxRequests: 50, windowMs: 60 * 1000, maxCost: 100 }, // 50 requests per minute
    'openai-whisper': { maxRequests: 30, windowMs: 60 * 1000, maxCost: 200 }, // 30 requests per minute
    'openai-conversation': { maxRequests: 100, windowMs: 60 * 1000, maxCost: 500 }, // 100 requests per minute
    'gemini-conversation': { maxRequests: 60, windowMs: 60 * 1000, maxCost: 300 }, // 60 requests per minute
    'gemini-translation': { maxRequests: 80, windowMs: 60 * 1000, maxCost: 400 }, // 80 requests per minute
  }

  private constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService()
    }
    return RateLimitService.instance
  }

  /**
   * Check if a request is allowed
   */
  async checkRateLimit(
    apiKey: string, 
    endpoint: string, 
    estimatedCost: number = 1
  ): Promise<{
    allowed: boolean
    retryAfter?: number
    reason?: string
  }> {
    const key = `${apiKey}-${endpoint}`
    const config = this.configs[endpoint]
    
    if (!config) {
      // No rate limit configured for this endpoint
      return { allowed: true }
    }

    const now = Date.now()
    const entry = this.limits.get(key) || {
      count: 0,
      cost: 0,
      resetTime: now + config.windowMs
    }

    // Reset if window has expired
    if (now >= entry.resetTime) {
      entry.count = 0
      entry.cost = 0
      entry.resetTime = now + config.windowMs
    }

    // Check request limit
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        reason: 'Request limit exceeded'
      }
    }

    // Check cost limit if configured
    if (config.maxCost && (entry.cost + estimatedCost) > config.maxCost) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        reason: 'Cost limit exceeded'
      }
    }

    // Update counters
    entry.count++
    entry.cost += estimatedCost
    this.limits.set(key, entry)

    // Update usage stats
    this.updateUsageStats(apiKey, endpoint, estimatedCost)

    return { allowed: true }
  }

  /**
   * Record API usage after request completion
   */
  recordUsage(
    apiKey: string,
    endpoint: string,
    actualCost: number,
    success: boolean
  ): void {
    const stats = this.getUsageStats(apiKey, endpoint)
    
    if (success) {
      stats.cost = actualCost // Update with actual cost
    } else {
      stats.errors++
    }
    
    stats.lastRequest = Date.now()
    this.usage.set(`${apiKey}-${endpoint}`, stats)
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(apiKey: string, endpoint: string): APIUsageStats {
    const key = `${apiKey}-${endpoint}`
    return this.usage.get(key) || {
      requests: 0,
      cost: 0,
      errors: 0,
      lastRequest: 0
    }
  }

  /**
   * Get remaining rate limit for an endpoint
   */
  getRemainingLimit(apiKey: string, endpoint: string): {
    requests: number
    cost: number
    resetTime: number
  } {
    const key = `${apiKey}-${endpoint}`
    const config = this.configs[endpoint]
    const entry = this.limits.get(key)
    
    if (!config || !entry) {
      return {
        requests: config?.maxRequests || Infinity,
        cost: config?.maxCost || Infinity,
        resetTime: 0
      }
    }

    const now = Date.now()
    if (now >= entry.resetTime) {
      return {
        requests: config.maxRequests,
        cost: config.maxCost || Infinity,
        resetTime: 0
      }
    }

    return {
      requests: Math.max(0, config.maxRequests - entry.count),
      cost: Math.max(0, (config.maxCost || Infinity) - entry.cost),
      resetTime: entry.resetTime
    }
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(endpoint: string, config: RateLimitConfig): void {
    this.configs[endpoint] = config
  }

  /**
   * Get all current rate limit configurations
   */
  getConfigs(): Record<string, RateLimitConfig> {
    return { ...this.configs }
  }

  /**
   * Calculate estimated cost for different operations
   */
  estimateCost(endpoint: string, params: any): number {
    switch (endpoint) {
      case 'openai-tts':
        // TTS cost is based on character count
        const textLength = params.text?.length || 0
        return Math.ceil(textLength / 1000) // 1 unit per 1000 characters
      
      case 'openai-whisper':
        // Whisper cost is usually flat per request
        return 10
      
      case 'openai-conversation':
        // Chat cost based on estimated tokens
        const messageLength = params.messages?.reduce((total: number, msg: any) => 
          total + (msg.content?.length || 0), 0) || 0
        return Math.ceil(messageLength / 100) // 1 unit per 100 characters (rough token estimate)
      
      case 'gemini-conversation':
        // Gemini cost based on prompt length
        const promptLength = params.prompt?.length || 0
        return Math.ceil(promptLength / 100)
      
      case 'gemini-translation':
        // Translation cost based on text length
        const translateLength = params.text?.length || 0
        return Math.ceil(translateLength / 200)
      
      default:
        return 1
    }
  }

  /**
   * Get daily usage summary
   */
  getDailyUsage(apiKey: string): Record<string, APIUsageStats> {
    const summary: Record<string, APIUsageStats> = {}
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000)
    
    for (const [key, stats] of this.usage.entries()) {
      if (key.startsWith(`${apiKey}-`) && stats.lastRequest >= dayAgo) {
        const endpoint = key.replace(`${apiKey}-`, '')
        summary[endpoint] = stats
      }
    }
    
    return summary
  }

  /**
   * Check if an endpoint is experiencing high error rates
   */
  isHighErrorRate(apiKey: string, endpoint: string, threshold: number = 0.5): boolean {
    const stats = this.getUsageStats(apiKey, endpoint)
    if (stats.requests === 0) return false
    
    return (stats.errors / stats.requests) > threshold
  }

  /**
   * Get recommended delay before next request
   */
  getRecommendedDelay(apiKey: string, endpoint: string): number {
    const remaining = this.getRemainingLimit(apiKey, endpoint)
    const config = this.configs[endpoint]
    
    if (!config || remaining.requests > 10) {
      return 0 // No delay needed
    }
    
    if (remaining.requests === 0) {
      return Math.ceil((remaining.resetTime - Date.now()) / 1000)
    }
    
    // Spread remaining requests over remaining time
    const timeLeft = remaining.resetTime - Date.now()
    return Math.max(0, Math.ceil(timeLeft / remaining.requests / 1000))
  }

  /**
   * Private helper to update usage statistics
   */
  private updateUsageStats(apiKey: string, endpoint: string, cost: number): void {
    const key = `${apiKey}-${endpoint}`
    const stats = this.usage.get(key) || {
      requests: 0,
      cost: 0,
      errors: 0,
      lastRequest: 0
    }
    
    stats.requests++
    stats.cost += cost
    stats.lastRequest = Date.now()
    
    this.usage.set(key, stats)
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const dayAgo = now - (24 * 60 * 60 * 1000)
    
    // Clean up old rate limit entries
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key)
      }
    }
    
    // Clean up old usage stats (keep only last 24 hours)
    for (const [key, stats] of this.usage.entries()) {
      if (stats.lastRequest < dayAgo) {
        this.usage.delete(key)
      }
    }
  }
}

export const rateLimitService = RateLimitService.getInstance()
