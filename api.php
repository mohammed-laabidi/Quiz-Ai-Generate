<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$apiKey = "csk-6fv2cyxkvr4h3rkhdj338w2v44p4vrjf8899hkf52t89t93j";
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'API key not configured']);
    exit;
}

$url = "https://api.cerebras.ai/v1/chat/completions";

$suject = $_GET["suj"] ?? "js";

$prompt = "
Generate exactly 10 questions about $suject. D'ont want this'```json\'
Return ONLY a valid JSON array with this format (no explanation, no text outside JSON):

[
  {
    'question': 'string',
    'choices': ['choice1', 'choice2', 'choice3', 'choice4'],
    'correctAnswer': 'one of the choices'
  }
]
";

$ch = curl_init($url);
$data = [
    "model" => "gemma-4-31b",
    "messages" => [
        ["role" => "system", "content" => "you assistant"],
        ["role" => "user", "content" => $prompt]
    ],
    "temperature" => 0.7
];

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $apiKey
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

if (!isset($res['choices'][0]['message']['content'])) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid API response', 'details' => $res]);
    exit;
}

echo json_encode($res['choices'][0]['message']['content']);
