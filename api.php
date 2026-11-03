<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$apiKeyGemini = getenv("API_KEY");

if (!$apiKeyGemini) {
    http_response_code(500);
    echo json_encode(['error' => 'API key not configured']);
    exit;
}

$subject = $_GET["suj"] ?? "js";

$prompt = "
Generate exactly 5 questions about $subject.
Return ONLY a valid JSON array with this format (no explanation, no markdown, no text outside JSON):

[
  {
    \"question\": \"string\",
    \"choices\": [\"choice1\", \"choice2\", \"choice3\", \"choice4\"],
    \"correctAnswer\": \"one of the choices\"
  }
]
";

$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=" . $apiKeyGemini;

$data = [
    "contents" => [
        ["parts" => [["text" => $prompt]]]
    ],
    "generationConfig" => [
        "temperature" => 0.7,
        "responseMimeType" => "application/json"
    ]
];

$ch = curl_init($url);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json"
]);

$res = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(502);
    echo json_encode(['error' => curl_error($ch)]);
    curl_close($ch);
    exit;
}

curl_close($ch);

$res = json_decode($res, true);

if (!isset($res['candidates'][0]['content']['parts'][0]['text'])) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid API response', 'details' => $res]);
    exit;
}

$text = trim($res['candidates'][0]['content']['parts'][0]['text']);

// Remove ```json fences if Gemini still adds them
$text = preg_replace('/^```(json)?\s*/i', '', $text);
$text = preg_replace('/\s*```$/', '', $text);
$text = trim($text);

// Validate it is valid JSON, then output it directly (not double-encoded)
$questions = json_decode($text, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid JSON from Gemini', 'details' => $text]);
    exit;
}

echo json_encode($questions);
