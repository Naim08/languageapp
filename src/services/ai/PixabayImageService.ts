interface PixabaySearchParams {
  q: string;
  image_type?: 'all' | 'photo' | 'illustration' | 'vector';
  category?: string;
  colors?: string;
  safesearch?: boolean;
  order?: 'popular' | 'latest';
  per_page?: number;
  page?: number;
}

interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  fullHDURL: string;
  imageURL: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

class PixabayImageService {
  private static instance: PixabayImageService;
  private apiKey: string;
  private baseUrl = 'https://pixabay.com/api/';

  private constructor() {
    this.apiKey = process.env.PIXABAY_API || '';
  }

  static getInstance(): PixabayImageService {
    if (!PixabayImageService.instance) {
      PixabayImageService.instance = new PixabayImageService();
    }
    return PixabayImageService.instance;
  }

  /**
   * Search for images on Pixabay
   */
  async searchImages(params: PixabaySearchParams): Promise<PixabayImage[]> {
    try {
      const searchParams = new URLSearchParams({
        ...params,
        safesearch: 'true', // Always use safe search for language learning
        per_page: '20', // Get 20 results
        order: 'popular' // Get popular images first
      });

      // Add API key if available
      if (this.apiKey) {
        searchParams.append('key', this.apiKey);
      }

      const url = `${this.baseUrl}?${searchParams.toString()}`;
      console.log(`Searching Pixabay for: ${params.q}`);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Pixabay API error: ${response.status}`);
      }

      const data: PixabayResponse = await response.json();
      
      console.log(`Found ${data.hits.length} images for "${params.q}"`);
      return data.hits;

    } catch (error) {
      console.error('Pixabay search failed:', error);
      return [];
    }
  }

  /**
   * Get image for a vocabulary word
   */
  async getImageForWord(
    word: string, 
    language: string = 'en',
    category?: string
  ): Promise<string | null> {
    try {
      // Create search parameters
      const searchParams: PixabaySearchParams = {
        q: word,
        image_type: 'photo', // Use photos for better quality
        safesearch: true
      };

      // Add category if specified
      if (category) {
        searchParams.category = category;
      }

      const images = await this.searchImages(searchParams);
      
      if (images.length === 0) {
        console.log(`No images found for "${word}"`);
        return null;
      }

      // Return the first (most popular) image
      const image = images[0];
      return image.webformatURL; // 640px version

    } catch (error) {
      console.error(`Failed to get image for "${word}":`, error);
      return null;
    }
  }

  /**
   * Get multiple images for multiple choice questions
   */
  async getMultipleChoiceImages(
    correctWord: string,
    incorrectWords: string[],
    category?: string
  ): Promise<{ correct: string | null; incorrect: (string | null)[] }> {
    try {
      const allWords = [correctWord, ...incorrectWords];
      const imagePromises = allWords.map(word => 
        this.getImageForWord(word, 'en', category)
      );

      const imageUrls = await Promise.all(imagePromises);
      
      return {
        correct: imageUrls[0],
        incorrect: imageUrls.slice(1)
      };

    } catch (error) {
      console.error('Failed to get multiple choice images:', error);
      return {
        correct: null,
        incorrect: [null, null, null]
      };
    }
  }

  /**
   * Get images by category for vocabulary learning
   */
  async getImagesByCategory(
    words: string[],
    category: string
  ): Promise<Record<string, string | null>> {
    try {
      const results: Record<string, string | null> = {};
      
      for (const word of words) {
        const imageUrl = await this.getImageForWord(word, 'en', category);
        results[word] = imageUrl;
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return results;

    } catch (error) {
      console.error('Failed to get images by category:', error);
      return {};
    }
  }

  /**
   * Test the Pixabay API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const images = await this.searchImages({
        q: 'dog',
        image_type: 'photo',
        safesearch: true
      });

      console.log('✅ Pixabay API connection successful');
      console.log(`Found ${images.length} images for "dog"`);
      
      return images.length > 0;

    } catch (error) {
      console.error('❌ Pixabay API connection failed:', error);
      return false;
    }
  }

  /**
   * Get available categories for filtering
   */
  getAvailableCategories(): string[] {
    return [
      'animals', 'backgrounds', 'buildings', 'business', 'computer',
      'education', 'fashion', 'feelings', 'food', 'health',
      'industry', 'music', 'nature', 'people', 'places',
      'religion', 'science', 'sports', 'transportation', 'travel'
    ];
  }

  /**
   * Get available colors for filtering
   */
  getAvailableColors(): string[] {
    return [
      'grayscale', 'transparent', 'red', 'orange', 'yellow',
      'green', 'turquoise', 'blue', 'lilac', 'pink',
      'white', 'gray', 'black', 'brown'
    ];
  }
}

const pixabayImageService = PixabayImageService.getInstance();
export default pixabayImageService; 