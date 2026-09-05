<?php
// ==============================================================================
// BACKEND ENDPOINT: Cek Akurat Status Live Streaming YouTube
// ==============================================================================
function checkChannelLiveStatus($channelId) {
    $url = "https://www.youtube.com/channel/" . $channelId . "/live";
    
    $options = [
        "http" => [
            "method" => "GET",
            "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36\r\n" .
                        "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n" .
                        "Accept-Language: en-US,en;q=0.9\r\n",
            "timeout" => 5,
            "follow_location" => 1
        ]
    ];
    
    $context = stream_context_create($options);
    $html = @file_get_contents($url, false, $context);

    if ($html !== FALSE) {
        // Cek indikator status live YouTube
        if (strpos($html, '"isLive":true') !== false || strpos($html, '{"style":"LIVE"') !== false || strpos($html, 'isLiveContent":true') !== false) {
            
            // Ekstrak Video ID
            preg_match('/"videoId":"([a-zA-Z0-9_-]{11})"/', $html, $matches);
            $videoId = isset($matches[1]) ? $matches[1] : null;

            return [
                'isLive' => true,
                'videoId' => $videoId
            ];
        }
    }
    
    return [
        'isLive' => false,
        'videoId' => null
    ];
}

// Endpoint AJAX Internal
if (isset($_GET['action']) && $_GET['action'] === 'get_live_id') {
    header('Content-Type: application/json');
    $channelId = $_GET['channelId'] ?? '';
    
    if (empty($channelId)) {
        echo json_encode(['status' => 'error', 'isLive' => false]);
        exit;
    }

    $result = checkChannelLiveStatus($channelId);
    
    echo json_encode([
        'status' => 'success',
        'isLive' => $result['isLive'],
        'videoId' => $result['videoId']
    ]);
    exit;
}
?>
