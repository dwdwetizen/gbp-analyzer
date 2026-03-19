exports.handler = async function(event) {
  const GOOGLE_KEY = process.env.GOOGLE_API_KEY;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (!GOOGLE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key não configurada' }) };
  }

  const params = event.queryStringParameters || {};
  const action = params.action;

  try {
    let url = '';

    if (action === 'search') {
      const query = params.query || '';
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_KEY}&language=pt-BR`;

    } else if (action === 'details') {
      const placeId = params.place_id || '';
      const fields = 'place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,photos,types,business_status,geometry,reviews,price_level,url';
      url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_KEY}&language=pt-BR`;

    } else if (action === 'nearby') {
      const location = params.location || '';
      const radius = params.radius || '3000';
      const keyword = params.keyword || '';
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${GOOGLE_KEY}&language=pt-BR`;

    } else if (action === 'photo') {
      const ref = params.ref || '';
      const maxwidth = params.maxwidth || '600';
      url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${ref}&key=${GOOGLE_KEY}`;
      // For photos, redirect
      return {
        statusCode: 302,
        headers: { ...headers, Location: url },
        body: ''
      };

    } else if (action === 'resolve_url') {
      // Try to extract place info from a Google Maps URL
      const mapsUrl = params.url || '';
      
      // Extract place name from URL
      let query = '';
      
      // Pattern: /maps/place/NAME/@lat,lng
      const placeMatch = mapsUrl.match(/\/maps\/place\/([^/@]+)/);
      if (placeMatch) {
        query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      }
      
      // Pattern: ?q=NAME
      const qMatch = mapsUrl.match(/[?&]q=([^&]+)/);
      if (!query && qMatch) {
        query = decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
      }

      // Extract coordinates if present
      const coordMatch = mapsUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      let searchUrl = '';

      if (coordMatch && query) {
        searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${coordMatch[1]},${coordMatch[2]}&radius=500&key=${GOOGLE_KEY}&language=pt-BR`;
      } else if (query) {
        searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_KEY}&language=pt-BR`;
      } else {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Não foi possível extrair informações da URL' }) };
      }

      const response = await fetch(searchUrl);
      const data = await response.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };

    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ação inválida' }) };
    }

    const response = await fetch(url);
    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
