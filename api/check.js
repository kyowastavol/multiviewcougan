export default async function handler(req, res) {
    // Header CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { channelId } = req.query;

    if (!channelId) {
        return res.status(400).json({ status: 'error', isLive: false, videoId: null, message: 'Channel ID kosong' });
    }

    try {
        const url = `https://www.youtube.com/channel/${channelId}/live`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const html = await response.text();

        // Indikator Live (Termasuk Streamlabs & OBS)
        const isLive = html.includes('"isLive":true') ||
                       html.includes('{"style":"LIVE"') ||
                       html.includes('isLiveContent":true') ||
                       html.includes('hqdefault_live.jpg');

        if (isLive) {
            let videoId = null;

            // Lapisan 1: Canonical Tag (Sangat Akurat untuk Streamlabs)
            const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
            
            // Lapisan 2: Microformat Video ID
            const microMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);

            // Lapisan 3: Watch URL Pattern
            const watchMatch = html.match(/watch\?v=([a-zA-Z0-9_-]{11})/);

            if (canonicalMatch && canonicalMatch[1]) {
                videoId = canonicalMatch[1];
            } else if (microMatch && microMatch[1]) {
                videoId = microMatch[1];
            } else if (watchMatch && watchMatch[1]) {
                videoId = watchMatch[1];
            }

            return res.status(200).json({
                status: 'success',
                isLive: true,
                videoId: videoId
            });
        }

        return res.status(200).json({
            status: 'success',
            isLive: false,
            videoId: null
        });

    } catch (error) {
        console.error(`[API ERROR] ${channelId}:`, error);
        return res.status(500).json({
            status: 'error',
            isLive: false,
            videoId: null,
            message: error.message
        });
    }
}
