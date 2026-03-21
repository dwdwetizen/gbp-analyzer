module.exports = async function handler(req, res) {
  const GOOGLE_KEY = process.env.GOOGLE_API_KEY;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!GOOGLE_KEY) return res.status(500).json({ error: 'API key não configurada' });

  const params = req.query;
  const action = params.action;

  try {
    let url = '';

    if (action === 'search') {
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(params.query || '')}&key=${GOOGLE_KEY}&language=pt-BR`;
    } else if (action === 'details') {
      const fields = 'place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,photos,types,business_status,geometry,reviews,price_level,url';
      url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${params.place_id || ''}&fields=${fields}&key=${GOOGLE_KEY}&language=pt-BR`;
    } else if (action === 'nearby') {
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${params.location || ''}&radius=${params.radius || '3000'}&keyword=${encodeURIComponent(params.keyword || '')}&key=${GOOGLE_KEY}&language=pt-BR`;
    } else if (action === 'photo') {
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${params.maxwidth || '600'}&photoreference=${params.ref || ''}&key=${GOOGLE_KEY}`;
      return res.redirect(302, photoUrl);
    } else if (action === 'resolve_url') {
      const mapsUrl = params.url || '';
      let query = '';

      const placeMatch = mapsUrl.match(/\/maps\/place\/([^/@]+)/);
      if (placeMatch) query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));

      const qMatch = mapsUrl.match(/[?&]q=([^&]+)/);
      if (!query && qMatch) query = decodeURIComponent(qMatch[1].replace(/\+/g, ' '));

      if (!query) return res.status(400).json({ error: 'Não foi possível extrair informações da URL' });

      const coordMatch = mapsUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      let searchUrl = coordMatch
        ? `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${coordMatch[1]},${coordMatch[2]}&radius=500&key=${GOOGLE_KEY}&language=pt-BR`
        : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_KEY}&language=pt-BR`;

      const response = await fetch(searchUrl);
      const data = await response.json();
      return res.status(200).json(data);
    } else {
      return res.status(400).json({ error: 'Ação inválida' });
    }

    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
