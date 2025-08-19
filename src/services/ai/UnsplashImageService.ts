interface UnsplashSearchParams {
  query: string;
  page?: number;
  per_page?: number;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  order_by?: 'relevant' | 'latest';
}

interface UnsplashImage {
  id: string;
  created_at: string;
  updated_at: string;
  promoted_at: string | null;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
    small_s3: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
  categories: any[];
  likes: number;
  liked_by_user: boolean;
  current_user_collections: any[];
  sponsorship: any;
  topic_submissions: any;
  user: {
    id: string;
    updated_at: string;
    username: string;
    name: string;
    first_name: string;
    last_name: string | null;
    twitter_username: string | null;
    portfolio_url: string | null;
    bio: string | null;
    location: string | null;
    links: any;
    profile_image: any;
    instagram_username: string | null;
    total_collections: number;
    total_likes: number;
    total_photos: number;
    accepted_tos: boolean;
    for_hire: boolean;
    social: any;
  };
  tags: any[];
}

interface UnsplashResponse {
  results: UnsplashImage[];
  total: number;
  total_pages: number;
}

class UnsplashImageService {
  private static instance: UnsplashImageService;
  private accessKey: string;
  private baseUrl = 'https://api.unsplash.com';

  private constructor() {
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY || '';
  }

  static getInstance(): UnsplashImageService {
    if (!UnsplashImageService.instance) {
      UnsplashImageService.instance = new UnsplashImageService();
    }
    return UnsplashImageService.instance;
  }

  /**
   * Search for images on Unsplash
   */
  async searchImages(params: UnsplashSearchParams): Promise<UnsplashImage[]> {
    try {
      const searchParams = new URLSearchParams({
        query: params.query,
        page: (params.page || 1).toString(),
        per_page: (params.per_page || 10).toString(),
        order_by: params.order_by || 'relevant'
      });

      if (params.orientation) {
        searchParams.append('orientation', params.orientation);
      }

      const url = `${this.baseUrl}/search/photos?${searchParams.toString()}`;
      console.log(`Searching Unsplash for: ${params.query}`);

      const headers: Record<string, string> = {
        'Accept-Version': 'v1'
      };

      // Add authorization header if API key is available
      if (this.accessKey) {
        headers['Authorization'] = `Client-ID ${this.accessKey}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data: UnsplashResponse = await response.json();
      
      console.log(`Found ${data.results.length} images for "${params.query}"`);
      return data.results;

    } catch (error) {
      console.error('Unsplash search failed:', error);
      return [];
    }
  }

  /**
   * Get image for a vocabulary word
   */
  async getImageForWord(
    word: string,
    orientation: 'landscape' | 'portrait' | 'squarish' = 'squarish'
  ): Promise<string | null> {
    try {
      const images = await this.searchImages({
        query: word,
        per_page: 5,
        orientation,
        order_by: 'relevant'
      });
      
      if (images.length === 0) {
        console.log(`No images found for "${word}"`);
        return null;
      }

      // Return the first (most relevant) image
      const image = images[0];
      return image.urls.regular; // 1080px version

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
    incorrectWords: string[]
  ): Promise<{ correct: string | null; incorrect: (string | null)[] }> {
    try {
      const allWords = [correctWord, ...incorrectWords];
      const imagePromises = allWords.map(word => 
        this.getImageForWord(word, 'squarish')
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
    orientation: 'landscape' | 'portrait' | 'squarish' = 'squarish'
  ): Promise<Record<string, string | null>> {
    try {
      const results: Record<string, string | null> = {};
      
      for (const word of words) {
        const imageUrl = await this.getImageForWord(word, orientation);
        results[word] = imageUrl;
        
        // Add delay to respect rate limits (5000 requests/hour)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return results;

    } catch (error) {
      console.error('Failed to get images by category:', error);
      return {};
    }
  }

  /**
   * Test the Unsplash API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const images = await this.searchImages({
        query: 'dog',
        per_page: 3,
        order_by: 'relevant'
      });

      console.log('✅ Unsplash API connection successful');
      console.log(`Found ${images.length} images for "dog"`);
      
      if (images.length > 0) {
        console.log(`Sample image URL: ${images[0].urls.regular}`);
      }
      
      return images.length > 0;

    } catch (error) {
      console.error('❌ Unsplash API connection failed:', error);
      return false;
    }
  }

  /**
   * Get image with specific size
   */
  getImageUrl(image: UnsplashImage, size: 'thumb' | 'small' | 'regular' | 'full' = 'regular'): string {
    return image.urls[size];
  }

  /**
   * Get image with custom width
   */
  getImageUrlWithWidth(image: UnsplashImage, width: number): string {
    return `${image.urls.raw}&w=${width}&fit=crop`;
  }
}

export default UnsplashImageService.getInstance(); 