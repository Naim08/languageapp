import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

export const ImageLoadTest: React.FC = () => {
  // Test with a known working R2 URL from our database
  const testImageUrl = 'https://dym4g2epj2h5t.cloudfront.net/spanish_question_0_option_a_image.png';
  
  console.log('🧪 ImageLoadTest: Testing R2 URL:', testImageUrl);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image Load Test</Text>
      <Text style={styles.subtitle}>Testing R2 URL Loading:</Text>
      
      <Image
        source={{ uri: testImageUrl }}
        style={styles.image}
        onLoad={() => console.log('✅ Image loaded successfully!')}
        onError={(e) => console.log('❌ Image load error:', e.nativeEvent)}
        onLoadStart={() => console.log('⏳ Image loading started...')}
        onLoadEnd={() => console.log('🏁 Image loading ended')}
      />
      
      <Text style={styles.url}>{testImageUrl}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
  },
  url: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});