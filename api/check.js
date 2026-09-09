export default async function handler(req, res) {
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

        // 1. Pastikan Halaman Memang Memiliki Status Live Aktif
        const isLive = html.includes('"isLive":true') || 
                       html.includes('"liveStreamability"') ||
                       html.includes('{"style":"LIVE"}');

        if (!isLive) {
            return res.status(200).json({
                status: 'success',
                isLive: false,
                videoId: null
            });
        }

        let videoId = null;

        // 2. Metode 1: Ekstrak Spesifik dari objek JSON `ytInitialPlayerResponse`
        const playerResponseMatch = html.match(/var ytInitialPlayerResponse\s*=\s*({.+?});<\/script>/s) ||
                                  html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);

        if (playerResponseMatch && playerResponseMatch[1]) {
            try {
                const playerData = JSON.parse(playerResponseMatch[1]);
                const videoDetails = playerData?.videoDetails;

                // Validasi bahwa video benar-benar milik channel tersebut & sedang LIVE
                if (videoDetails && videoDetails.isLive && videoDetails.channelId === channelId) {
                    videoId = videoDetails.videoId;
                }
            } catch (e) {
                // Ignore JSON parse error
            }
        }

        // 3. Metode 2 (Fallback Validasi Streamlabs/OBS): Ambil dari Canonical Watch Link
        if (!videoId) {
            const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
            if (canonicalMatch && canonicalMatch[1]) {
                videoId = canonicalMatch[1];
            }
        }

        if (videoId) {
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
