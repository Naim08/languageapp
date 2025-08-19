import React, { useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Theme } from '@/types/theme';

interface OptionImageProps {
  imageUrl?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large';
  theme?: Theme;
  style?: any;
}

export const OptionImage: React.FC<OptionImageProps> = ({
  imageUrl,
  alt,
  size = 'medium',
  theme,
  style
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  console.log('🖼️ OptionImage Component:', {
    imageUrl: imageUrl?.substring(0, 100),
    alt,
    size,
    hasImageUrl: !!imageUrl
  });

  if (!imageUrl) {
    console.log('❌ OptionImage: No imageUrl provided, returning null');
    return null;
  }

  const sizeMap = {
    small: { width: 40, height: 40, borderRadius: 8 },
    medium: { width: 60, height: 60, borderRadius: 12 },
    large: { width: 120, height: 120, borderRadius: 16 }
  };

  const imageStyle = sizeMap[size];

  const handleLoadStart = () => {
    console.log('⏳ Image loading started:', imageUrl.substring(0, 50));
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    console.log('✅ Image loading ended:', imageUrl.substring(0, 50));
    setLoading(false);
  };

  const handleError = (e: any) => {
    console.log('❌ Image loading error:', {
      url: imageUrl.substring(0, 50),
      error: e.nativeEvent?.error || 'Unknown error'
    });
    setLoading(false);
    setError(true);
  };

  console.log('🎨 OptionImage Render State:', {
    loading,
    error,
    imageUrl: imageUrl.substring(0, 80),
    imageStyle
  });

  return (
    <View style={[styles.container, imageStyle, style]}>
      {loading && (
        <View style={[styles.loadingContainer, imageStyle]}>
          <ActivityIndicator 
            size="small" 
            color={theme?.colors?.primary || '#58CC02'} 
          />
        </View>
      )}
      
      {error && (
        <View style={[styles.errorContainer, imageStyle]}>
          {/* Fallback icon or placeholder */}
        </View>
      )}
      
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, imageStyle, style]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        accessibilityLabel={alt}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    zIndex: 1,
  },
  errorContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    zIndex: 1,
  },
}); 