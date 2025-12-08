import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, match_count = 10, full_text_weight = 1.0, semantic_weight = 1.0 } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'query parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ایجاد Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // گرفتن embedding با OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // فراخوانی OpenAI API برای embedding
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        dimensions: 1536, // یا 512 بسته به تنظیمات جدولت
      }),
    })

    const embeddingData = await embeddingResponse.json()
    
    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI API error: ${embeddingData.error?.message || 'Unknown error'}`)
    }

    const embedding = embeddingData.data[0].embedding

    // فراخوانی hybrid_search function
    const { data: documents, error } = await supabase.rpc('hybrid_search', {
      query_text: query,
      query_embedding: embedding,
      match_count: match_count,
      full_text_weight: full_text_weight,
      semantic_weight: semantic_weight,
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        query, 
        match_count: documents?.length || 0,
        results: documents 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})