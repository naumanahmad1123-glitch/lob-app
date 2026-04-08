const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, input, place_id } = await req.json();
    const API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'autocomplete') {
      const response = await fetch(
        `https://places.googleapis.com/v1/places:autocomplete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
          },
          body: JSON.stringify({ input }),
        }
      );
      const data = await response.json();
      // Normalize to legacy shape the component expects
      const predictions = (data.suggestions || []).map((s: any) => ({
        place_id: s.placePrediction?.placeId || '',
        description: s.placePrediction?.text?.text || '',
        structured_formatting: {
          main_text: s.placePrediction?.structuredFormat?.mainText?.text || s.placePrediction?.text?.text || '',
          secondary_text: s.placePrediction?.structuredFormat?.secondaryText?.text || '',
        },
      }));
      return new Response(JSON.stringify({ predictions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (type === 'details') {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${place_id}`,
        {
          headers: {
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': 'displayName,formattedAddress,location',
          },
        }
      );
      const data = await response.json();
      return new Response(JSON.stringify({
        result: {
          name: data.displayName?.text || '',
          formatted_address: data.formattedAddress || '',
          geometry: {
            location: {
              lat: data.location?.latitude || null,
              lng: data.location?.longitude || null,
            },
          },
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
