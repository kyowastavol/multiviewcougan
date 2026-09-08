export default async function handler(req, res) {
  const { channelId } = req.query;

  if (!channelId) {
    return res.status(400).json({ status: 'error', isLive: false });
  }

  try {
    // Pakai CORS proxy ringan khusus client/backend
    const response = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();
    const isLive = html.includes('"isLive":true') || html.includes('{"style":"LIVE"') || html.includes('isLiveContent":true');

    return res.status(200).json({
      status: 'success',
      isLive: isLive
    });
  } catch (error) {
    return res.status(200).json({ status: 'success', isLive: false });
  }
}
