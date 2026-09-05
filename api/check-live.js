export default async function handler(req, res) {
  // Set CORS Header agar bisa dipanggil dari frontend Vercel kamu
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { channelId } = req.query;

  if (!channelId) {
    return res.status(400).json({ isLive: false, error: 'Channel ID missing' });
  }

  try {
    const url = `https://www.youtube.com/channel/${channelId}/live`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();

    // Deteksi status Live & ambil Video ID dari YouTube HTML
    const isLive = html.includes('"isLive":true') || 
                   html.includes('{"style":"LIVE"') || 
                   html.includes('"status":"OK"') && html.includes('isLiveContent');

    let videoId = null;
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (match && match[1]) {
      videoId = match[1];
    }

    return res.status(200).json({ isLive: isLive && !!videoId, videoId: videoId });
  } catch (error) {
    return res.status(500).json({ isLive: false, error: error.message });
  }
}
