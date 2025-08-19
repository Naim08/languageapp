import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Client-side service that ONLY reads pre-generated images from cache
 * No API keys needed in the app!
 */
class CachedImageService {
  private static instance: CachedImageService;
  private memoryCache: Map<string, string> = new Map();

  private constructor() {}

  static getInstance(): CachedImageService {
    if (!CachedImageService.instance) {
      CachedImageService.instance = new CachedImageService();
    }
    return CachedImageService.instance;
  }

  /**
   * Get image URL from cache only (no API calls)
   */
  async getImageForWord(
    word: string,
    style: string = 'cartoon',
    language: string = 'English'
  ): Promise<string> {
    const cacheKey = `${word.toLowerCase()}_${style}_${language}`;
    
    // Check memory cache
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    try {
      // Check database cache
      const { data, error } = await supabase
        .from('generated_images')
        .select('image_url')
        .eq('word', word.toLowerCase())
        .eq('style', style)
        .eq('language', language)
        .single();

      if (data && data.image_url) {
        this.memoryCache.set(cacheKey, data.image_url);
        return data.image_url;
      }
    } catch (error) {
      console.log(`No cached image for "${word}"`);
    }

    // Return a safe placeholder (no API calls!)
    return this.generatePlaceholder(word, style);
  }

  /**
   * Generate placeholder without any API calls
   */
  private generatePlaceholder(word: string, style: string): string {
    const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'F7DC6F', 'BB8FCE', '85C88A'];
    const color = colors[Math.abs(word.charCodeAt(0) + word.length) % colors.length];
    
    if (style === 'cartoon' || style === 'illustration') {
      // Dicebear avatars (free, no API key needed)
      const styles = ['bottts', 'avataaars', 'big-ears', 'lorelei'];
      const avatarStyle = styles[word.length % styles.length];
      return `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(word)}&backgroundColor=${color}`;
    }
    
    // UI Avatars (free, no API key needed)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(word)}&background=${color}&color=fff&size=400&font-size=0.5&bold=true`;
  }

  /**
   * Get images for multiple choice questions
   */
  async getMultipleChoiceImages(
    correctWord: string,
    incorrectWords: string[],
    style: string = 'cartoon'
  ): Promise<{
    correct: string;
    incorrect: string[];
  }> {
    const allWords = [correctWord, ...incorrectWords];
    const images = await Promise.all(
      allWords.map(word => this.getImageForWord(word, style))
    );

    return {
      correct: images[0],
      incorrect: images.slice(1)
    };
  }

  /**
   * Preload images into memory cache for faster access
   */
  async preloadImages(words: string[], style: string = 'cartoon'): Promise<void> {
    const { data } = await supabase
      .from('generated_images')
      .select('word, image_url, style, language')
      .in('word', words.map(w => w.toLowerCase()))
      .eq('style', style);

    if (data) {
      data.forEach(item => {
        const cacheKey = `${item.word}_${item.style}_${item.language}`;
        this.memoryCache.set(cacheKey, item.image_url);
      });
    }
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
  }
}

export default CachedImageService.getInstance();