import HybridImageService from '../ai/HybridImageService';
import ImageCacheService from './ImageCacheService';
import ImageQualityService from './ImageQualityService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

interface SmartImageOptions {
  word: string;
  language?: string;
  style?: 'cartoon' | 'realistic' | 'illustration';
  category?: string;
  minQuality?: number; // Minimum quality score (0-100)
  maxAttempts?: number; // Max number of sources to try
}

interface SmartImageResult {
  imageUrl: string;
  source: string;
  qualityScore: number;
  fromCache: boolean;
  metadata?: {
    width?: number;
    height?: number;
    tags?: string[];
  };
}

class SmartImageService {
  private static instance: SmartImageService;
  
  // Track user feedback for learning
  private feedbackData: Map<string, { good: number; bad: number }> = new Map();
  
  private constructor() {
    this.loadFeedbackData();
  }

  static getInstance(): SmartImageService {
    if (!SmartImageService.instance) {
      SmartImageService.instance = new SmartImageService();
    }
    return SmartImageService.instance;
  }

  /**
   * Smart image selection with quality checking and caching
   */
  async getSmartImage(options: SmartImageOptions): Promise<SmartImageResult | null> {
    const {
      word,
      language = 'English',
      style = 'cartoon',
      category,
      minQuality = 60,
      maxAttempts = 3
    } = options;

    console.log(`🎯 Getting smart image for "${word}" (${style} style)`);

    // Step 1: Check cache first
    const cached = await ImageCacheService.getFromCache(word, language, style);
    if (cached) {
      // Evaluate cached image quality
      const qualityScore = await ImageQualityService.evaluateImage(cached, word, {
        source: 'cache'
      });
      
      if (qualityScore.overall >= minQuality) {
        console.log(`✅ Using cached image (quality: ${qualityScore.overall})`);
        return {
          imageUrl: cached,
          source: 'cache',
          qualityScore: qualityScore.overall,
          fromCache: true
        };
      } else {
        console.log(`⚠️ Cached image quality too low (${qualityScore.overall}), fetching new`);
      }
    }

    // Step 2: Fetch new images from multiple sources
    const candidates: Array<{ url: string; source: string; metadata?: any }> = [];
    
    // Register pending request to prevent duplicates
    const imagePromise = this.fetchAndEvaluateImages(
      word,
      language,
      style,
      category,
      minQuality,
      maxAttempts
    );
    
    ImageCacheService.registerPendingRequest(word, language, style, imagePromise);
    
    const result = await imagePromise;
    
    if (result) {
      // Cache the result
      await ImageCacheService.saveToCache(
        word,
        result.imageUrl,
        language,
        style,
        result.source,
        category
      );
    }
    
    return result;
  }

  /**
   * Fetch and evaluate images from multiple sources
   */
  private async fetchAndEvaluateImages(
    word: string,
    language: string,
    style: string,
    category?: string,
    minQuality: number = 60,
    maxAttempts: number = 3
  ): Promise<SmartImageResult | null> {
    const candidates: Array<{
      url: string;
      source: string;
      score?: any;
      metadata?: any;
    }> = [];

    // Try to get images from different sources
    const sources = [
      { name: 'pixabay', weight: style === 'cartoon' ? 1.2 : 1.0 },
      { name: 'unsplash', weight: style === 'realistic' ? 1.2 : 0.8 },
      { name: 'gemini', weight: 0.5 } // Lower weight due to cost
    ];

    // Fetch from sources in parallel
    const fetchPromises = sources.slice(0, maxAttempts).map(async (source) => {
      try {
        const imageUrl = await HybridImageService.getImage({
          word,
          language,
          category,
          style,
          preferredSource: source.name as any,
          cacheResult: false // We'll cache after quality check
        });

        if (imageUrl && !imageUrl.includes('placeholder')) {
          // Get image metadata if possible
          const dimensions = await ImageQualityService.getImageDimensions(imageUrl);
          
          // Evaluate quality
          const qualityScore = await ImageQualityService.evaluateImage(
            imageUrl,
            word,
            {
              source: source.name,
              width: dimensions?.width,
              height: dimensions?.height,
              aspectRatio: dimensions ? dimensions.width / dimensions.height : undefined
            }
          );

          // Apply source weight to score
          const weightedScore = qualityScore.overall * source.weight;

          return {
            url: imageUrl,
            source: source.name,
            score: qualityScore,
            weightedScore,
            metadata: { width: dimensions?.width, height: dimensions?.height }
          };
        }
      } catch (error) {
        console.log(`Failed to get image from ${source.name}:`, error);
      }
      return null;
    });

    const results = (await Promise.all(fetchPromises)).filter(r => r !== null);

    if (results.length === 0) {
      console.log('❌ No images found from any source');
      return null;
    }

    // Sort by weighted score
    results.sort((a, b) => b!.weightedScore - a!.weightedScore);

    // Check user feedback history
    const withFeedback = results.map(r => ({
      ...r,
      feedbackScore: this.getFeedbackScore(r!.url)
    }));

    // Re-sort considering feedback
    withFeedback.sort((a, b) => {
      const scoreA = a!.weightedScore + (a.feedbackScore * 10);
      const scoreB = b!.weightedScore + (b.feedbackScore * 10);
      return scoreB - scoreA;
    });

    // Pick the best image that meets minimum quality
    for (const candidate of withFeedback) {
      if (candidate!.score.overall >= minQuality) {
        console.log(
          `✅ Selected image from ${candidate!.source} ` +
          `(quality: ${candidate!.score.overall}, recommendation: ${candidate!.score.recommendation})`
        );
        
        // Log quality report for debugging
        console.log(ImageQualityService.generateQualityReport(candidate!.score));
        
        return {
          imageUrl: candidate!.url,
          source: candidate!.source,
          qualityScore: candidate!.score.overall,
          fromCache: false,
          metadata: candidate!.metadata
        };
      }
    }

    // If no image meets quality threshold, use the best available
    const best = withFeedback[0];
    if (best) {
      console.log(
        `⚠️ Using best available image from ${best.source} ` +
        `(quality: ${best.score.overall} - below threshold)`
      );
      
      return {
        imageUrl: best.url,
        source: best.source,
        qualityScore: best.score.overall,
        fromCache: false,
        metadata: best.metadata
      };
    }

    return null;
  }

  /**
   * Get images for multiple choice questions with quality assurance
   */
  async getMultipleChoiceImages(
    correctWord: string,
    incorrectWords: string[],
    style: 'cartoon' | 'realistic' = 'cartoon',
    category?: string
  ): Promise<{
    correct: SmartImageResult | null;
    incorrect: (SmartImageResult | null)[];
  }> {
    // Get all images in parallel
    const promises = [
      this.getSmartImage({ word: correctWord, style, category }),
      ...incorrectWords.map(word => 
        this.getSmartImage({ word, style, category })
      )
    ];

    const results = await Promise.all(promises);

    // Ensure consistency in style
    // If most images are from one source, try to get others from same source
    const sourceCounts = this.countSources(results);
    const dominantSource = this.getDominantSource(sourceCounts);

    // If there's a dominant source and some images are from different sources,
    // try to re-fetch from the dominant source
    if (dominantSource && sourceCounts[dominantSource] > results.length / 2) {
      for (let i = 0; i < results.length; i++) {
        if (results[i] && results[i]!.source !== dominantSource) {
          const word = i === 0 ? correctWord : incorrectWords[i - 1];
          const newImage = await this.getSmartImage({
            word,
            style,
            category,
            preferredSource: dominantSource as any
          });
          if (newImage && newImage.qualityScore >= 50) {
            results[i] = newImage;
          }
        }
      }
    }

    return {
      correct: results[0],
      incorrect: results.slice(1)
    };
  }

  /**
   * Record user feedback on image quality
   */
  async recordFeedback(
    imageUrl: string,
    word: string,
    isGood: boolean
  ): Promise<void> {
    const key = `${imageUrl}_${word}`;
    const current = this.feedbackData.get(key) || { good: 0, bad: 0 };
    
    if (isGood) {
      current.good++;
    } else {
      current.bad++;
    }
    
    this.feedbackData.set(key, current);
    
    // Save to database
    try {
      await supabase
        .from('image_feedback')
        .upsert({
          image_url: imageUrl,
          word,
          good_count: current.good,
          bad_count: current.bad,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'image_url,word'
        });
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  }

  /**
   * Get feedback score for an image
   */
  private getFeedbackScore(imageUrl: string): number {
    for (const [key, feedback] of this.feedbackData.entries()) {
      if (key.startsWith(imageUrl)) {
        const total = feedback.good + feedback.bad;
        if (total > 0) {
          return (feedback.good - feedback.bad) / total;
        }
      }
    }
    return 0;
  }

  /**
   * Load feedback data from database
   */
  private async loadFeedbackData(): Promise<void> {
    try {
      const { data } = await supabase
        .from('image_feedback')
        .select('*');
      
      if (data) {
        data.forEach(item => {
          const key = `${item.image_url}_${item.word}`;
          this.feedbackData.set(key, {
            good: item.good_count || 0,
            bad: item.bad_count || 0
          });
        });
      }
    } catch (error) {
      console.log('No feedback data available yet');
    }
  }

  /**
   * Count sources in results
   */
  private countSources(results: (SmartImageResult | null)[]): Record<string, number> {
    const counts: Record<string, number> = {};
    results.forEach(r => {
      if (r) {
        counts[r.source] = (counts[r.source] || 0) + 1;
      }
    });
    return counts;
  }

  /**
   * Get dominant source
   */
  private getDominantSource(counts: Record<string, number>): string | null {
    let maxCount = 0;
    let dominant = null;
    
    for (const [source, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = source;
      }
    }
    
    return dominant;
  }

  /**
   * Preload and validate images for a lesson
   */
  async preloadLessonImages(
    words: string[],
    style: 'cartoon' | 'realistic' = 'cartoon',
    category?: string
  ): Promise<Map<string, SmartImageResult>> {
    console.log(`📦 Preloading ${words.length} images for lesson...`);
    
    const results = new Map<string, SmartImageResult>();
    
    // Process in batches to avoid overwhelming the APIs
    const batchSize = 5;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      const batchPromises = batch.map(word => 
        this.getSmartImage({ word, style, category })
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      batch.forEach((word, index) => {
        const result = batchResults[index];
        if (result) {
          results.set(word, result);
        }
      });
      
      // Rate limiting
      if (i + batchSize < words.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Preloaded ${results.size}/${words.length} images successfully`);
    
    // Log quality statistics
    const qualityStats = {
      excellent: 0, // 80-100
      good: 0,      // 60-79
      fair: 0,      // 40-59
      poor: 0       // 0-39
    };
    
    results.forEach(result => {
      if (result.qualityScore >= 80) qualityStats.excellent++;
      else if (result.qualityScore >= 60) qualityStats.good++;
      else if (result.qualityScore >= 40) qualityStats.fair++;
      else qualityStats.poor++;
    });
    
    console.log('📊 Quality Distribution:', qualityStats);
    
    return results;
  }
}

export default SmartImageService.getInstance();