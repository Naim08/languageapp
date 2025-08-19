import { createClient } from '@supabase/supabase-js';
import PixabayImageService from './PixabayImageService';
import UnsplashImageService from './UnsplashImageService';
import GeminiImageService from './GeminiImageService';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

interface ImageSource {
  name: string;
  priority: number;
  supportsCartoon: boolean;
  getImage: (word: string, category?: string, style?: string) => Promise<string | null>;
}

interface HybridImageOptions {
  word: string;
  language?: string;
  category?: string;
  style?: 'cartoon' | 'realistic' | 'illustration' | 'vector' | 'simple';
  preferredSource?: 'pixabay' | 'unsplash' | 'gemini' | 'any';
  cacheResult?: boolean;
}

interface CachedImage {
  word: string;
  language: string;
  style: string;
  imageUrl: string;
  source: string;
  timestamp: number;
}

class HybridImageService {
  private static instance: HybridImageService;
  private sources: ImageSource[] = [];
  private cache: Map<string, CachedImage> = new Map();
  private failureCache: Map<string, Set<string>> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

  private constructor() {
    this.initializeSources();
  }

  static getInstance(): HybridImageService {
    if (!HybridImageService.instance) {
      HybridImageService.instance = new HybridImageService();
    }
    return HybridImageService.instance;
  }

  private initializeSources() {
    // Priority 1: Pixabay (free, good for cartoon/illustration style)
    if (process.env.PIXABAY_API) {
      this.sources.push({
        name: 'pixabay',
        priority: 1,
        supportsCartoon: true,
        getImage: async (word, category, style) => {
          try {
            // Modify search based on style preference
            let searchQuery = word;
            let imageType: 'all' | 'photo' | 'illustration' | 'vector' = 'all';
            
            if (style === 'cartoon' || style === 'illustration') {
              searchQuery = `${word} cartoon`;
              imageType = 'illustration';
            } else if (style === 'vector') {
              imageType = 'vector';
            } else if (style === 'realistic') {
              imageType = 'photo';
            }
            
            // Search with modified parameters
            const images = await PixabayImageService.searchImages({
              q: searchQuery,
              image_type: imageType,
              category: category,
              safesearch: true,
              order: 'popular',
              per_page: 5
            });
            
            if (images.length > 0) {
              // Return the best quality image
              return images[0].webformatURL;
            }
            
            return null;
          } catch (error) {
            console.log(`Pixabay failed for ${word}:`, error.message);
            return null;
          }
        }
      });
    }

    // Priority 2: Unsplash (high quality but more realistic)
    if (process.env.UNSPLASH_ACCESS_KEY) {
      this.sources.push({
        name: 'unsplash',
        priority: 2,
        supportsCartoon: false,
        getImage: async (word, category, style) => {
          try {
            // Skip Unsplash for cartoon/illustration styles
            if (style === 'cartoon' || style === 'illustration' || style === 'vector') {
              return null;
            }
            
            const result = await UnsplashImageService.getImageForWord(
              word,
              'squarish'
            );
            
            return result;
          } catch (error) {
            console.log(`Unsplash failed for ${word}:`, error.message);
            return null;
          }
        }
      });
    }

    // Priority 3: Gemini AI Generation (premium but very flexible)
    if (process.env.GEMINI_API_KEY) {
      this.sources.push({
        name: 'gemini',
        priority: 3,
        supportsCartoon: true,
        getImage: async (word, category, style) => {
          try {
            const result = await GeminiImageService.generateImageForWord({
              word,
              language: 'English',
              style: style === 'cartoon' ? 'cartoon' : 
                     style === 'realistic' ? 'realistic' :
                     style === 'illustration' ? 'detailed' : 'simple'
            });
            
            return result;
          } catch (error) {
            console.log(`Gemini failed for ${word}:`, error.message);
            return null;
          }
        }
      });
    }

    // Priority 999: Fallback placeholders
    this.sources.push({
      name: 'placeholder',
      priority: 999,
      supportsCartoon: true,
      getImage: async (word, category, style) => {
        return this.generatePlaceholder(word, style);
      }
    });
  }

  private generatePlaceholder(word: string, style?: string): string {
    const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'F7DC6F', 'BB8FCE', '85C88A', 'FFA500', '9B59B6'];
    const color = colors[Math.abs(word.charCodeAt(0) + word.length) % colors.length];
    
    if (style === 'cartoon' || style === 'illustration') {
      // Use dicebear for cartoon-style avatars
      const avatarStyle = ['bottts', 'avataaars', 'big-ears', 'lorelei'][Math.floor(Math.random() * 4)];
      return `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(word)}&backgroundColor=${color}`;
    }
    
    // Use UI Avatars for text-based placeholders
    const initial = word.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(word)}&background=${color}&color=fff&size=400&font-size=0.5&bold=true&format=svg`;
  }

  private getCacheKey(options: HybridImageOptions): string {
    return `${options.word}_${options.language || 'en'}_${options.category || 'all'}_${options.style || 'any'}`;
  }

  async checkSupabaseCache(word: string, language: string, style?: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('image_url, id')
        .eq('word', word)
        .eq('language', language)
        .eq('style', style || 'simple')
        .single();

      if (data && !error) {
        // Increment usage count
        await supabase.rpc('increment_image_usage', { image_id: data.id });
        return data.image_url;
      }
    } catch (error) {
      console.log('Supabase cache check failed:', error);
    }
    return null;
  }

  async saveToSupabaseCache(
    word: string,
    language: string,
    imageUrl: string,
    category?: string,
    style?: string,
    source?: string
  ): Promise<void> {
    try {
      await supabase
        .from('generated_images')
        .upsert({
          word,
          language,
          category,
          image_url: imageUrl,
          style: style || 'simple',
          source: source || 'hybrid'
        }, {
          onConflict: 'word,language,style'
        });
    } catch (error) {
      console.log('Failed to save to Supabase cache:', error);
    }
  }

  async getImage(options: HybridImageOptions): Promise<string> {
    const cacheKey = this.getCacheKey(options);
    
    // Check memory cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`✅ Memory cache hit for ${options.word} (${cached.source})`);
      return cached.imageUrl;
    }

    // Check Supabase cache
    if (options.cacheResult !== false) {
      const supabaseCached = await this.checkSupabaseCache(
        options.word,
        options.language || 'English',
        options.style
      );
      
      if (supabaseCached) {
        console.log(`✅ Supabase cache hit for ${options.word}`);
        // Store in memory cache too
        this.cache.set(cacheKey, {
          word: options.word,
          language: options.language || 'English',
          style: options.style || 'simple',
          imageUrl: supabaseCached,
          source: 'supabase-cache',
          timestamp: Date.now()
        });
        return supabaseCached;
      }
    }

    // Get failures for this word to avoid retrying failed sources
    const failures = this.failureCache.get(cacheKey) || new Set();

    // Sort sources by priority and style preference
    let sortedSources = [...this.sources].sort((a, b) => {
      // If user prefers a specific source
      if (options.preferredSource && options.preferredSource !== 'any') {
        if (a.name === options.preferredSource) return -1;
        if (b.name === options.preferredSource) return 1;
      }
      
      // Prefer cartoon-capable sources for cartoon/illustration styles
      if (options.style === 'cartoon' || options.style === 'illustration') {
        if (a.supportsCartoon && !b.supportsCartoon) return -1;
        if (!a.supportsCartoon && b.supportsCartoon) return 1;
      }
      
      return a.priority - b.priority;
    });

    // Filter out previously failed sources
    sortedSources = sortedSources.filter(s => !failures.has(s.name));

    // Try each source in order
    for (const source of sortedSources) {
      console.log(`🔍 Trying ${source.name} for ${options.word}...`);
      
      try {
        const imageUrl = await source.getImage(
          options.word,
          options.category,
          options.style
        );
        
        if (imageUrl) {
          console.log(`✅ Got image from ${source.name}`);
          
          // Cache the result
          const cachedImage: CachedImage = {
            word: options.word,
            language: options.language || 'English',
            style: options.style || 'simple',
            imageUrl,
            source: source.name,
            timestamp: Date.now()
          };
          
          this.cache.set(cacheKey, cachedImage);
          
          // Save to Supabase if not a placeholder
          if (options.cacheResult !== false && source.name !== 'placeholder') {
            await this.saveToSupabaseCache(
              options.word,
              options.language || 'English',
              imageUrl,
              options.category,
              options.style,
              source.name
            );
          }
          
          return imageUrl;
        }
      } catch (error) {
        console.log(`❌ ${source.name} error:`, error.message);
        failures.add(source.name);
        this.failureCache.set(cacheKey, failures);
      }
    }

    // This should never happen as placeholder always returns something
    console.log(`⚠️ All sources failed, using emergency placeholder for ${options.word}`);
    return this.generatePlaceholder(options.word, options.style);
  }

  async getMultipleChoiceImages(
    correctWord: string,
    incorrectWords: string[],
    category?: string,
    style: 'cartoon' | 'realistic' | 'illustration' = 'cartoon'
  ): Promise<{
    correct: string;
    incorrect: string[];
  }> {
    // Get images in parallel for better performance
    const promises = [
      this.getImage({ 
        word: correctWord, 
        category, 
        style,
        cacheResult: true 
      }),
      ...incorrectWords.map(word => 
        this.getImage({ 
          word, 
          category, 
          style,
          cacheResult: true 
        })
      )
    ];

    const results = await Promise.all(promises);

    return {
      correct: results[0],
      incorrect: results.slice(1)
    };
  }

  async preloadImages(
    words: string[], 
    category?: string, 
    style?: 'cartoon' | 'realistic' | 'illustration'
  ): Promise<void> {
    console.log(`📦 Preloading ${words.length} images...`);
    
    const promises = words.map(word => 
      this.getImage({ 
        word, 
        category, 
        style,
        cacheResult: true 
      }).catch(err => {
        console.log(`Failed to preload ${word}:`, err.message);
        return null;
      })
    );

    await Promise.all(promises);
    console.log(`✅ Preloading complete`);
  }

  clearMemoryCache(): void {
    this.cache.clear();
    this.failureCache.clear();
    console.log('🗑️ Memory cache cleared');
  }

  getCacheStats(): { 
    memoryHits: number; 
    totalCached: number; 
    failureWords: string[];
    sources: string[];
  } {
    const sources = new Set<string>();
    this.cache.forEach(item => sources.add(item.source));
    
    return {
      memoryHits: this.cache.size,
      totalCached: this.cache.size,
      failureWords: Array.from(this.failureCache.keys()),
      sources: Array.from(sources)
    };
  }

  async testAllSources(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const source of this.sources) {
      if (source.name === 'placeholder') continue;
      
      try {
        const imageUrl = await source.getImage('dog', 'animals', 'cartoon');
        results[source.name] = !!imageUrl;
        console.log(`${source.name}: ${imageUrl ? '✅' : '❌'}`);
      } catch (error) {
        results[source.name] = false;
        console.log(`${source.name}: ❌ (${error.message})`);
      }
    }
    
    return results;
  }
}

export default HybridImageService.getInstance();