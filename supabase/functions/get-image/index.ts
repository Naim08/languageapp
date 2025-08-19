import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { word, style = 'cartoon', source = 'auto' } = await req.json()

    if (!word) {
      throw new Error('Word parameter is required')
    }

    // Check cache first
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: cached } = await supabase
      .from('generated_images')
      .select('image_url')
      .eq('word', word.toLowerCase())
      .eq('style', style)
      .single()

    if (cached) {
      return new Response(
        JSON.stringify({ imageUrl: cached.image_url, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch from appropriate source
    let imageUrl = null
    let imageSource = 'placeholder'

    // Try Pixabay first (best for cartoon style)
    if (source === 'auto' || source === 'pixabay') {
      const pixabayKey = Deno.env.get('PIXABAY_API')
      if (pixabayKey) {
        const searchQuery = style === 'cartoon' ? `${word} cartoon` : word
        const response = await fetch(
          `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(searchQuery)}&image_type=${style === 'cartoon' ? 'illustration' : 'photo'}&safesearch=true&per_page=3`
        )
        const data = await response.json()
        
        if (data.hits && data.hits.length > 0) {
          imageUrl = data.hits[0].webformatURL
          imageSource = 'pixabay'
        }
      }
    }

    // Try Unsplash if no image yet and style is realistic
    if (!imageUrl && (source === 'auto' || source === 'unsplash') && style !== 'cartoon') {
      const unsplashKey = Deno.env.get('UNSPLASH_ACCESS_KEY')
      if (unsplashKey) {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(word)}&per_page=3&orientation=squarish`,
          {
            headers: {
              'Authorization': `Client-ID ${unsplashKey}`,
              'Accept-Version': 'v1'
            }
          }
        )
        const data = await response.json()
        
        if (data.results && data.results.length > 0) {
          imageUrl = data.results[0].urls.regular
          imageSource = 'unsplash'
        }
      }
    }

    // Fallback to placeholder
    if (!imageUrl) {
      const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'F7DC6F', 'BB8FCE']
      const color = colors[Math.abs(word.charCodeAt(0)) % colors.length]
      
      if (style === 'cartoon') {
        imageUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(word)}&backgroundColor=${color}`
      } else {
        imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(word)}&background=${color}&color=fff&size=400`
      }
      imageSource = 'placeholder'
    }

    // Cache the result
    if (imageUrl && imageSource !== 'placeholder') {
      await supabase
        .from('generated_images')
        .upsert({
          word: word.toLowerCase(),
          language: 'English',
          image_url: imageUrl,
          style: style,
          source: imageSource
        }, {
          onConflict: 'word,language,style'
        })
    }

    return new Response(
      JSON.stringify({ 
        imageUrl, 
        source: imageSource,
        fromCache: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})