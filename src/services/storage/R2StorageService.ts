import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
}

class R2StorageService {
  private static instance: R2StorageService;
  private client: S3Client;
  private config: R2Config;

  private constructor() {
    this.config = {
      accountId: process.env.EXPO_PUBLIC_R2_ACCOUNT_ID || '11b6de0c60adcae23bab310634600fd5',
      accessKeyId: process.env.EXPO_PUBLIC_R2_ACCESS_KEY_ID || '747f1280307f81c542a9c1c431b8ce41',
      secretAccessKey: process.env.EXPO_PUBLIC_R2_SECRET_ACCESS_KEY || '68176e32814653b6ebab24907f674a2d59f203026452436b46dd821c44fbc807',
      bucketName: process.env.EXPO_PUBLIC_R2_BUCKET_NAME || 'language-app-images',
      endpoint: process.env.EXPO_PUBLIC_R2_ENDPOINT || 'https://11b6de0c60adcae23bab310634600fd5.r2.cloudflarestorage.com'
    };

    this.client = new S3Client({
      region: 'auto',
      endpoint: this.config.endpoint,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  static getInstance(): R2StorageService {
    if (!R2StorageService.instance) {
      R2StorageService.instance = new R2StorageService();
    }
    return R2StorageService.instance;
  }

  /**
   * Upload an image to R2 storage
   */
  async uploadImage(
    imageBuffer: Buffer | ArrayBuffer,
    fileName: string,
    contentType: string = 'image/webp'
  ): Promise<string> {
    try {
      const key = `images/${fileName}`;
      
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // Cache for 1 year
      });

      await this.client.send(command);
      
      // Return the public URL
      return `https://${this.config.accountId}.r2.cloudflarestorage.com/${this.config.bucketName}/${key}`;
    } catch (error) {
      console.error('Failed to upload image to R2:', error);
      throw new Error(`Failed to upload image: ${error}`);
    }
  }

  /**
   * Upload a base64 image string
   */
  async uploadBase64Image(
    base64String: string,
    fileName: string,
    contentType: string = 'image/webp'
  ): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      return await this.uploadImage(buffer, fileName, contentType);
    } catch (error) {
      console.error('Failed to upload base64 image:', error);
      throw new Error(`Failed to upload base64 image: ${error}`);
    }
  }

  /**
   * Delete an image from R2 storage
   */
  async deleteImage(fileName: string): Promise<void> {
    try {
      const key = `images/${fileName}`;
      
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Failed to delete image from R2:', error);
      throw new Error(`Failed to delete image: ${error}`);
    }
  }

  /**
   * Generate a unique filename for an image
   */
  generateFileName(word: string, language: string, timestamp?: number): string {
    const time = timestamp || Date.now();
    const sanitizedWord = word.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${language}-${sanitizedWord}-${time}.webp`;
  }

  /**
   * Get the public URL for an image
   */
  getPublicUrl(fileName: string): string {
    return `https://${this.config.accountId}.r2.cloudflarestorage.com/${this.config.bucketName}/images/${fileName}`;
  }

  /**
   * Test the R2 connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to upload a small test file
      const testBuffer = Buffer.from('test');
      const testFileName = `test-${Date.now()}.txt`;
      
      await this.uploadImage(testBuffer, testFileName, 'text/plain');
      
      // Clean up the test file
      await this.deleteImage(testFileName);
      
      console.log('✅ R2 connection test successful');
      return true;
    } catch (error) {
      console.error('❌ R2 connection test failed:', error);
      return false;
    }
  }
}

export default R2StorageService.getInstance(); 