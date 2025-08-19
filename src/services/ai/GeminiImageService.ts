import { GoogleGenerativeAI } from '@google/generative-ai';
import R2StorageService from '../storage/R2StorageService';

interface ImageGenerationOptions {
  word: string;
  language: string;
  style?: 'cartoon' | 'realistic' | 'simple' | 'detailed';
  size?: 'small' | 'medium' | 'large';
}

class GeminiImageService {
  private static instance: GeminiImageService;
  private genAI: GoogleGenerativeAI;
  private model: any;

  private constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required for image generation');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  static getInstance(): GeminiImageService {
    if (!GeminiImageService.instance) {
      GeminiImageService.instance = new GeminiImageService();
    }
    return GeminiImageService.instance;
  }

  /**
   * Generate an image for a vocabulary word
   */
  async generateImageForWord(options: ImageGenerationOptions): Promise<string> {
    try {
      const { word, language, style = 'simple', size = 'medium' } = options;
      
      // Create a prompt for image generation
      const prompt = this.createImagePrompt(word, language, style);
      
      console.log(`Generating image for: ${word} (${language})`);
      
      // Generate image using Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      // Get the image data
      const imageData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!imageData) {
        throw new Error('No image data received from Gemini');
      }

      // Generate filename
      const fileName = R2StorageService.generateFileName(word, language);
      
      // Upload to R2 storage
      const imageUrl = await R2StorageService.uploadBase64Image(
        imageData,
        fileName,
        'image/webp'
      );

      console.log(`✅ Image generated and uploaded: ${imageUrl}`);
      return imageUrl;

    } catch (error) {
      console.error('Failed to generate image:', error);
      throw new Error(`Image generation failed: ${error}`);
    }
  }

  /**
   * Create a prompt for image generation
   */
  private createImagePrompt(word: string, language: string, style: string): string {
    const stylePrompts = {
      cartoon: 'cartoon style, colorful, simple shapes',
      realistic: 'photorealistic, detailed, high quality',
      simple: 'minimalist, clean lines, simple design',
      detailed: 'detailed illustration, rich colors, intricate design'
    };

    const sizePrompts = {
      small: 'small size, simple composition',
      medium: 'medium size, balanced composition',
      large: 'large size, detailed composition'
    };

    return `Generate a ${stylePrompts[style]} image of "${word}" for a language learning app. 
    The image should be:
    - Clear and recognizable
    - Suitable for vocabulary learning
    - ${sizePrompts.medium}
    - Professional quality
    - Safe for all ages
    - Optimized for web display
    
    Language: ${language}
    Word: ${word}
    
    Generate a high-quality image that clearly represents this word.`;
  }

  /**
   * Generate multiple images for multiple choice questions
   */
  async generateMultipleChoiceImages(
    correctWord: string,
    incorrectWords: string[],
    language: string,
    style: string = 'simple'
  ): Promise<{ correct: string; incorrect: string[] }> {
    try {
      const allWords = [correctWord, ...incorrectWords];
      const imagePromises = allWords.map(word => 
        this.generateImageForWord({ word, language, style })
      );

      const imageUrls = await Promise.all(imagePromises);
      
      return {
        correct: imageUrls[0],
        incorrect: imageUrls.slice(1)
      };

    } catch (error) {
      console.error('Failed to generate multiple choice images:', error);
      throw new Error(`Multiple choice image generation failed: ${error}`);
    }
  }

  /**
   * Test the Gemini image generation
   */
  async testImageGeneration(): Promise<boolean> {
    try {
      const testWord = 'dog';
      const testLanguage = 'English';
      
      const imageUrl = await this.generateImageForWord({
        word: testWord,
        language: testLanguage,
        style: 'simple'
      });

      console.log('✅ Gemini image generation test successful');
      console.log('Test image URL:', imageUrl);
      
      return true;
    } catch (error) {
      console.error('❌ Gemini image generation test failed:', error);
      return false;
    }
  }

  /**
   * Get estimated cost for image generation
   */
  getEstimatedCost(imageCount: number): string {
    // Gemini 1.5 Flash pricing (approximate)
    const costPerImage = 0.002; // $0.002 per image
    const totalCost = imageCount * costPerImage;
    
    return `$${totalCost.toFixed(4)} for ${imageCount} images`;
  }
}

export default GeminiImageService.getInstance(); 