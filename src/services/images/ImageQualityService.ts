import { Image } from 'react-native';

interface ImageQualityScore {
  overall: number; // 0-100
  relevance: number; // How well it matches the word
  clarity: number; // Visual clarity and simplicity
  appropriateness: number; // Safe for learning environment
  educational: number; // Educational value
  reasons: string[];
  recommendation: 'use' | 'fallback' | 'reject';
}

interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  fileSize?: number;
  format?: string;
  source: string;
  tags?: string[];
  description?: string;
}

class ImageQualityService {
  private static instance: ImageQualityService;
  
  // Minimum quality thresholds
  private readonly MIN_WIDTH = 200;
  private readonly MIN_HEIGHT = 200;
  private readonly MAX_ASPECT_RATIO = 2.5; // Too wide/tall images are bad
  private readonly MIN_QUALITY_SCORE = 60; // Minimum acceptable score
  
  // Word blacklists for inappropriate content
  private readonly inappropriateWords = new Set([
    'violence', 'weapon', 'drug', 'alcohol', 'cigarette', 'adult',
    'scary', 'horror', 'gore', 'death', 'nude', 'explicit'
  ]);
  
  // Preferred image characteristics for language learning
  private readonly preferredCharacteristics = {
    cartoon: ['illustration', 'cartoon', 'simple', 'colorful', 'clean'],
    realistic: ['photo', 'clear', 'professional', 'high-quality'],
    educational: ['diagram', 'infographic', 'labeled', 'educational']
  };

  private constructor() {}

  static getInstance(): ImageQualityService {
    if (!ImageQualityService.instance) {
      ImageQualityService.instance = new ImageQualityService();
    }
    return ImageQualityService.instance;
  }

  /**
   * Evaluate image quality for language learning
   */
  async evaluateImage(
    imageUrl: string,
    word: string,
    metadata?: Partial<ImageMetadata>
  ): Promise<ImageQualityScore> {
    const scores = {
      relevance: 0,
      clarity: 0,
      appropriateness: 100, // Start at 100, deduct for issues
      educational: 0
    };
    const reasons: string[] = [];

    // 1. Check basic metadata if available
    if (metadata) {
      // Check dimensions
      if (metadata.width && metadata.height) {
        if (metadata.width < this.MIN_WIDTH || metadata.height < this.MIN_HEIGHT) {
          scores.clarity -= 20;
          reasons.push('Image too small');
        }
        
        if (metadata.aspectRatio && metadata.aspectRatio > this.MAX_ASPECT_RATIO) {
          scores.clarity -= 10;
          reasons.push('Poor aspect ratio');
        }
      }

      // Check source reliability
      scores.relevance += this.getSourceReliabilityScore(metadata.source);

      // Check tags/description for relevance
      if (metadata.tags || metadata.description) {
        const relevanceScore = this.calculateRelevanceScore(
          word,
          metadata.tags,
          metadata.description
        );
        scores.relevance += relevanceScore;
        
        // Check for inappropriate content
        const appropriatenessIssues = this.checkAppropriateness(
          metadata.tags,
          metadata.description
        );
        scores.appropriateness -= appropriatenessIssues.length * 20;
        reasons.push(...appropriatenessIssues);
      }
    }

    // 2. Analyze image URL patterns
    const urlAnalysis = this.analyzeImageUrl(imageUrl, word);
    scores.relevance += urlAnalysis.relevanceBonus;
    scores.educational += urlAnalysis.educationalBonus;
    reasons.push(...urlAnalysis.reasons);

    // 3. Calculate educational value
    scores.educational += this.calculateEducationalValue(
      word,
      metadata?.source || '',
      imageUrl
    );

    // 4. Apply style-specific scoring
    const styleScore = this.evaluateStyleAppropriateness(imageUrl, metadata);
    scores.clarity += styleScore.clarityBonus;
    scores.educational += styleScore.educationalBonus;

    // Normalize scores (0-100)
    const normalizedScores = {
      relevance: Math.max(0, Math.min(100, scores.relevance)),
      clarity: Math.max(0, Math.min(100, scores.clarity + 50)), // Base 50
      appropriateness: Math.max(0, Math.min(100, scores.appropriateness)),
      educational: Math.max(0, Math.min(100, scores.educational))
    };

    // Calculate overall score
    const overall = (
      normalizedScores.relevance * 0.35 +
      normalizedScores.clarity * 0.2 +
      normalizedScores.appropriateness * 0.3 +
      normalizedScores.educational * 0.15
    );

    // Determine recommendation
    let recommendation: 'use' | 'fallback' | 'reject';
    if (normalizedScores.appropriateness < 50) {
      recommendation = 'reject';
      reasons.push('Failed appropriateness check');
    } else if (overall >= this.MIN_QUALITY_SCORE) {
      recommendation = 'use';
    } else if (overall >= 40) {
      recommendation = 'fallback';
      reasons.push('Below quality threshold, use as fallback');
    } else {
      recommendation = 'reject';
      reasons.push('Quality too low');
    }

    return {
      overall: Math.round(overall),
      ...normalizedScores,
      reasons,
      recommendation
    };
  }

  /**
   * Calculate relevance score based on tags and description
   */
  private calculateRelevanceScore(
    word: string,
    tags?: string[],
    description?: string
  ): number {
    let score = 0;
    const wordLower = word.toLowerCase();
    
    // Check tags
    if (tags) {
      tags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (tagLower === wordLower) {
          score += 30; // Exact match
        } else if (tagLower.includes(wordLower) || wordLower.includes(tagLower)) {
          score += 15; // Partial match
        }
      });
    }
    
    // Check description
    if (description) {
      const descLower = description.toLowerCase();
      if (descLower.includes(wordLower)) {
        score += 20;
      }
      
      // Check for related words (simple semantic matching)
      const relatedWords = this.getRelatedWords(word);
      relatedWords.forEach(related => {
        if (descLower.includes(related)) {
          score += 10;
        }
      });
    }
    
    return score;
  }

  /**
   * Check for inappropriate content
   */
  private checkAppropriateness(
    tags?: string[],
    description?: string
  ): string[] {
    const issues: string[] = [];
    
    const checkText = (text: string) => {
      const textLower = text.toLowerCase();
      this.inappropriateWords.forEach(word => {
        if (textLower.includes(word)) {
          issues.push(`Contains inappropriate content: ${word}`);
        }
      });
    };
    
    if (tags) {
      tags.forEach(tag => checkText(tag));
    }
    
    if (description) {
      checkText(description);
    }
    
    return issues;
  }

  /**
   * Analyze image URL for quality indicators
   */
  private analyzeImageUrl(
    imageUrl: string,
    word: string
  ): { relevanceBonus: number; educationalBonus: number; reasons: string[] } {
    const result = {
      relevanceBonus: 0,
      educationalBonus: 0,
      reasons: [] as string[]
    };
    
    const urlLower = imageUrl.toLowerCase();
    
    // Check if URL contains the word
    if (urlLower.includes(word.toLowerCase())) {
      result.relevanceBonus += 10;
      result.reasons.push('URL contains target word');
    }
    
    // Check for educational sources
    const educationalDomains = ['edu', 'wikipedia', 'britannica', 'dictionary'];
    if (educationalDomains.some(domain => urlLower.includes(domain))) {
      result.educationalBonus += 20;
      result.reasons.push('From educational source');
    }
    
    // Check for stock photo indicators (usually good quality)
    if (urlLower.includes('unsplash') || urlLower.includes('pexels') || urlLower.includes('pixabay')) {
      result.relevanceBonus += 5;
      result.reasons.push('From reputable stock photo source');
    }
    
    // Check for placeholder/avatar services
    if (urlLower.includes('dicebear') || urlLower.includes('ui-avatars')) {
      result.educationalBonus -= 10;
      result.reasons.push('Placeholder image');
    }
    
    return result;
  }

  /**
   * Get source reliability score
   */
  private getSourceReliabilityScore(source: string): number {
    const sourceScores: Record<string, number> = {
      'pixabay': 25,
      'unsplash': 30,
      'pexels': 25,
      'gemini': 20,
      'placeholder': 5,
      'wikipedia': 35,
      'educational': 40
    };
    
    return sourceScores[source.toLowerCase()] || 10;
  }

  /**
   * Calculate educational value
   */
  private calculateEducationalValue(
    word: string,
    source: string,
    imageUrl: string
  ): number {
    let score = 0;
    
    // Concrete nouns are easier to represent visually
    const concreteNouns = ['animal', 'food', 'object', 'place', 'person'];
    const abstractConcepts = ['emotion', 'idea', 'concept', 'feeling'];
    
    // Simple heuristic: shorter words are often more concrete
    if (word.length <= 6) {
      score += 10;
    }
    
    // Source-based scoring
    if (source === 'educational' || source === 'wikipedia') {
      score += 30;
    } else if (source === 'pixabay' || source === 'unsplash') {
      score += 15;
    }
    
    // Illustration/cartoon images are often better for learning
    if (imageUrl.includes('illustration') || imageUrl.includes('cartoon')) {
      score += 20;
    }
    
    return score;
  }

  /**
   * Evaluate style appropriateness
   */
  private evaluateStyleAppropriateness(
    imageUrl: string,
    metadata?: Partial<ImageMetadata>
  ): { clarityBonus: number; educationalBonus: number } {
    const result = {
      clarityBonus: 0,
      educationalBonus: 0
    };
    
    // Cartoon/illustration style is generally clearer for learning
    if (imageUrl.includes('cartoon') || imageUrl.includes('illustration')) {
      result.clarityBonus += 15;
      result.educationalBonus += 10;
    }
    
    // Vector graphics are very clear
    if (imageUrl.includes('.svg') || metadata?.format === 'svg') {
      result.clarityBonus += 20;
    }
    
    // High resolution is good
    if (metadata?.width && metadata.width >= 800) {
      result.clarityBonus += 10;
    }
    
    return result;
  }

  /**
   * Get related words for semantic matching
   */
  private getRelatedWords(word: string): string[] {
    // Simple related word mapping (in production, use a proper thesaurus API)
    const relatedMap: Record<string, string[]> = {
      'dog': ['puppy', 'canine', 'pet', 'animal'],
      'cat': ['kitten', 'feline', 'pet', 'animal'],
      'car': ['vehicle', 'automobile', 'transport', 'drive'],
      'food': ['eat', 'meal', 'cuisine', 'dish'],
      'house': ['home', 'building', 'residence', 'dwelling'],
      // Add more as needed
    };
    
    return relatedMap[word.toLowerCase()] || [];
  }

  /**
   * Validate image dimensions
   */
  async getImageDimensions(imageUrl: string): Promise<{ width: number; height: number } | null> {
    try {
      return new Promise((resolve) => {
        Image.getSize(
          imageUrl,
          (width, height) => resolve({ width, height }),
          () => resolve(null)
        );
      });
    } catch (error) {
      console.error('Failed to get image dimensions:', error);
      return null;
    }
  }

  /**
   * Batch evaluate multiple images and pick the best
   */
  async selectBestImage(
    images: Array<{ url: string; metadata?: Partial<ImageMetadata> }>,
    word: string
  ): Promise<{ url: string; score: ImageQualityScore } | null> {
    const evaluations = await Promise.all(
      images.map(async (img) => ({
        url: img.url,
        score: await this.evaluateImage(img.url, word, img.metadata)
      }))
    );
    
    // Filter out rejected images
    const acceptable = evaluations.filter(e => e.score.recommendation !== 'reject');
    
    if (acceptable.length === 0) {
      return null;
    }
    
    // Sort by overall score
    acceptable.sort((a, b) => b.score.overall - a.score.overall);
    
    return acceptable[0];
  }

  /**
   * Generate quality report for debugging
   */
  generateQualityReport(score: ImageQualityScore): string {
    const stars = '⭐'.repeat(Math.round(score.overall / 20));
    
    return `
Image Quality Report
${'='.repeat(30)}
Overall Score: ${score.overall}/100 ${stars}
Recommendation: ${score.recommendation.toUpperCase()}

Breakdown:
- Relevance: ${score.relevance}/100
- Clarity: ${score.clarity}/100
- Appropriateness: ${score.appropriateness}/100
- Educational Value: ${score.educational}/100

Issues/Notes:
${score.reasons.map(r => `• ${r}`).join('\n')}
`;
  }
}

export default ImageQualityService.getInstance();