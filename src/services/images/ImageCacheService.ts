import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

interface CachedImage {
  word: string;
  language: string;
  style: string;
  image_url: string;
  source: string;
  usage_count: number;
}

interface CacheStats {
  totalImages: number;
  uniqueWords: number;
  totalUsage: number;
  sourceBreakdown: Record<string, number>;
}

class ImageCacheService {
  private static instance: ImageCacheService;
  private memoryCache: Map<string, CachedImage> = new Map();
  private pendingRequests: Map<string, Promise<string | null>> = new Map();

  private constructor() {}

  static getInstance(): ImageCacheService {
    if (!ImageCacheService.instance) {
      ImageCacheService.instance = new ImageCacheService();
    }
    return ImageCacheService.instance;
  }

  /**
   * Generate a cache key for a word
   */
  private getCacheKey(word: string, language: string = 'English', style: string = 'cartoon'): string {
    return `${word.toLowerCase()}_${language.toLowerCase()}_${style.toLowerCase()}`;
  }

  /**
   * Check if an image exists in cache (memory or database)
   */
  async getFromCache(word: string, language: string = 'English', style: string = 'cartoon'): Promise<string | null> {
    const cacheKey = this.getCacheKey(word, language, style);
    
    // Check memory cache first (fastest)
    const memCached = this.memoryCache.get(cacheKey);
    if (memCached) {
      console.log(`⚡ Memory cache hit for "${word}"`);
      // Update usage count asynchronously
      this.incrementUsage(memCached.id).catch(console.error);
      return memCached.image_url;
    }

    // Check if there's already a pending request for this word
    // This prevents multiple simultaneous API calls for the same word
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      console.log(`⏳ Waiting for pending request for "${word}"`);
      return pending;
    }

    // Check database cache
    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('word', word.toLowerCase())
        .eq('language', language)
        .eq('style', style)
        .single();

      if (data && !error) {
        console.log(`💾 Database cache hit for "${word}"`);
        
        // Store in memory cache for faster future access
        this.memoryCache.set(cacheKey, data);
        
        // Update usage count
        await this.incrementUsage(data.id);
        
        return data.image_url;
      }
    } catch (error) {
      console.log(`No cache entry for "${word}"`);
    }

    return null;
  }

  /**
   * Save an image to cache (both memory and database)
   */
  async saveToCache(
    word: string, 
    imageUrl: string, 
    language: string = 'English', 
    style: string = 'cartoon',
    source: string = 'unknown',
    category?: string
  ): Promise<void> {
    const cacheKey = this.getCacheKey(word, language, style);
    
    try {
      // Save to database
      const { data, error } = await supabase
        .from('generated_images')
        .upsert({
          word: word.toLowerCase(),
          language,
          category,
          image_url: imageUrl,
          style,
          source,
          usage_count: 1
        }, {
          onConflict: 'word,language,style',
          ignoreDuplicates: false // Update if exists
        })
        .select()
        .single();

      if (data && !error) {
        // Save to memory cache
        this.memoryCache.set(cacheKey, data);
        console.log(`✅ Cached image for "${word}" (${source})`);
      }
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }

  /**
   * Register a pending request to prevent duplicate API calls
   */
  registerPendingRequest(word: string, language: string, style: string, promise: Promise<string | null>): void {
    const cacheKey = this.getCacheKey(word, language, style);
    this.pendingRequests.set(cacheKey, promise);
    
    // Clean up after request completes
    promise.finally(() => {
      this.pendingRequests.delete(cacheKey);
    });
  }

  /**
   * Increment usage count for an image
   */
  private async incrementUsage(imageId: string): Promise<void> {
    try {
      await supabase.rpc('increment_image_usage', { image_id: imageId });
    } catch (error) {
      console.log('Failed to increment usage:', error);
    }
  }

  /**
   * Get statistics about the cache
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      // Get total images and usage
      const { data: images, error } = await supabase
        .from('generated_images')
        .select('source, usage_count');

      if (error || !images) {
        throw error;
      }

      // Calculate statistics
      const sourceBreakdown: Record<string, number> = {};
      let totalUsage = 0;

      images.forEach(img => {
        sourceBreakdown[img.source] = (sourceBreakdown[img.source] || 0) + 1;
        totalUsage += img.usage_count || 0;
      });

      return {
        totalImages: images.length,
        uniqueWords: images.length, // Each row is a unique word/style combo
        totalUsage,
        sourceBreakdown
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalImages: 0,
        uniqueWords: 0,
        totalUsage: 0,
        sourceBreakdown: {}
      };
    }
  }

  /**
   * Find similar cached images (for fallback)
   */
  async findSimilarCached(word: string, language: string = 'English'): Promise<string | null> {
    try {
      // Try to find images with similar words (prefix match)
      const { data } = await supabase
        .from('generated_images')
        .select('image_url')
        .eq('language', language)
        .ilike('word', `${word.substring(0, 3)}%`) // Match first 3 letters
        .limit(1)
        .single();

      if (data) {
        console.log(`🔄 Using similar cached image for "${word}"`);
        return data.image_url;
      }
    } catch (error) {
      // No similar images found
    }
    return null;
  }

  /**
   * Clear memory cache (keeps database cache)
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
    this.pendingRequests.clear();
    console.log('🗑️ Memory cache cleared');
  }

  /**
   * Preload commonly used words into memory cache
   */
  async preloadCommonWords(words: string[], language: string = 'English', style: string = 'cartoon'): Promise<void> {
    console.log(`📦 Preloading ${words.length} common words...`);
    
    for (const word of words) {
      await this.getFromCache(word, language, style);
    }
    
    console.log('✅ Preloading complete');
  }

  /**
   * Get most used images (for optimization)
   */
  async getMostUsedImages(limit: number = 10): Promise<CachedImage[]> {
    try {
      const { data } = await supabase
        .from('generated_images')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Failed to get most used images:', error);
      return [];
    }
  }
}

export default ImageCacheService.getInstance();