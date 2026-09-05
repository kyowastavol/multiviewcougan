// ==============================================================================
// VERCEL SERVERLESS FUNCTION: Cek Akurat Status Live Streaming YouTube
// Versi Node.js dari fungsi PHP checkChannelLiveStatus() (Vercel tidak
// menjalankan PHP). Deteksi videoId memakai canonical link — jauh lebih
// akurat dibanding mencari videoId pertama di halaman, yang bisa salah
// menangkap video rekomendasi/tidak berhubungan dari channel lain.
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

        // Sinyal paling akurat: kalau channel sedang live, canonical link
        // halaman /channel/xxx/live akan mengarah ke watch?v=VIDEOID milik
        // channel itu sendiri. Kalau tidak live, canonical-nya tetap ke
        // halaman channel biasa (bukan watch?v=...).
        const canonicalMatch = html.match(
            /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/
        );

        const legacyLiveFlags =
            html.includes('"isLive":true') ||
            html.includes('{"style":"LIVE"') ||
            html.includes('isLiveContent":true');

        if (canonicalMatch) {
            return res.status(200).json({
                status: 'success',
                isLive: true,
                videoId: canonicalMatch[1]
            });
        }

        if (legacyLiveFlags) {
            // Fallback kalau canonical tidak ketemu tapi ada indikator live lain
            const fallbackMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
            return res.status(200).json({
                status: 'success',
                isLive: true,
                videoId: fallbackMatch ? fallbackMatch[1] : null
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
