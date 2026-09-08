export default async function handler(req, res) {
  const { channelId } = req.query;

  if (!channelId) {
    return res.status(400).json({ status: 'error', isLive: false });
  }

  try {
    const url = `https://www.youtube.com/channel/${channelId}/live`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      return res.status(200).json({ status: 'success', isLive: false, videoId: null });
    }

    const html = await response.text();
    const isLive = html.includes('"isLive":true') || html.includes('{"style":"LIVE"') || html.includes('isLiveContent":true');

    let videoId = null;
    if (isLive) {
      const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        videoId = match[1];
      }
    }

    return res.status(200).json({
      status: 'success',
      isLive: isLive,
      videoId: videoId
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', isLive: false, error: error.message });
  }
}
