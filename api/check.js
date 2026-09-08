export default async function handler(req, res) {
  const { channelId } = req.query;

  if (!channelId) {
    return res.status(400).json({ status: 'error', isLive: false });
  }

  try {
    // 1. Cek lewat Feed RSS YouTube resmi (Tanpa API Key)
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssRes = await fetch(rssUrl, { cache: 'no-store' });
    const xmlText = await rssRes.text();

    // Ambil video ID paling terbaru dari channel
    const videoIdMatch = xmlText.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const latestVideoId = videoIdMatch ? videoIdMatch[1] : null;

    if (latestVideoId) {
      // 2. Cek status OEmbed untuk video ID terbaru
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${latestVideoId}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      
      // Jika video tersebut adalah Live Streaming aktif
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        // Cek jika title / author mengindikasikan stream
        const watchUrl = `https://www.youtube.com/watch?v=${latestVideoId}`;
        const pageRes = await fetch(watchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
          }
        });
        const pageHtml = await pageRes.text();

        const isLive = pageHtml.includes('"isLive":true') || pageHtml.includes('{"style":"LIVE"') || pageHtml.includes('isLiveContent":true');

        if (isLive) {
          return res.status(200).json({ status: 'success', isLive: true, videoId: latestVideoId });
        }
      }
    }

    // 3. Fallback: Cek Halaman Live Channel
    const livePageUrl = `https://www.youtube.com/channel/${channelId}/live`;
    const liveRes = await fetch(livePageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const liveHtml = await liveRes.text();
    const isLiveFallback = liveHtml.includes('"isLive":true') || liveHtml.includes('{"style":"LIVE"') || liveHtml.includes('isLiveContent":true') || liveHtml.includes('BADGE_STYLE_TYPE_LIVE_NOW');

    return res.status(200).json({
      status: 'success',
      isLive: isLiveFallback
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', isLive: false });
  }
}
