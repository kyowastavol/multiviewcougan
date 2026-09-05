// ==============================================================================
// VERCEL SERVERLESS FUNCTION: Cek Akurat Status Live Streaming YouTube
// Ini adalah versi Node.js dari fungsi PHP checkChannelLiveStatus(),
// karena Vercel tidak menjalankan PHP. Logikanya persis sama.
// ==============================================================================

export default async function handler(req, res) {
    const { channelId } = req.query;

    if (!channelId) {
        return res.status(200).json({ status: 'error', isLive: false, videoId: null });
    }

    try {
        const url = `https://www.youtube.com/channel/${channelId}/live`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(5000)
        });

        const html = await response.text();

        const isLive =
            html.includes('"isLive":true') ||
            html.includes('{"style":"LIVE"') ||
            html.includes('isLiveContent":true');

        if (isLive) {
            const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
            const videoId = match ? match[1] : null;

            return res.status(200).json({
                status: 'success',
                isLive: true,
                videoId
            });
        }

        return res.status(200).json({
            status: 'success',
            isLive: false,
            videoId: null
        });
    } catch (err) {
        return res.status(200).json({
            status: 'success',
            isLive: false,
            videoId: null
        });
    }
}
