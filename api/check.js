<?php
header('Content-Type: application/json');

$channelId = isset($_GET['channelId']) ? trim($_GET['channelId']) : '';

if (empty($channelId)) {
    echo json_encode(['status' => 'error', 'message' => 'Channel ID kosong']);
    exit;
}

// Scrape halaman live channel
$url = "https://www.youtube.com/channel/{$channelId}/live";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
$html = curl_exec($ch);
curl_close($ch);

if ($html) {
    // 1. Cari canonical URL / videoId dari canonical tag
    if (preg_match('/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)">/', $html, $matches)) {
        $videoId = $matches[1];
        
        // 2. Verifikasi apakah video ini benar-benar sedang status "isLive"
        if (strpos($html, '"isLive":true') !== false || strpos($html, '"isLiveContent":true') !== false || strpos($html, 'hqdefault_live.jpg') !== false) {
            echo json_encode([
                'status' => 'success',
                'isLive' => true,
                'videoId' => $videoId
            ]);
            exit;
        }
    }
}

echo json_encode([
    'status' => 'success',
    'isLive' => false,
    'videoId' => null
]);
