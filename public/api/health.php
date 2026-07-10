<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");

$configPath = __DIR__ . "/config.php";
if (!is_file($configPath)) {
    http_response_code(503);
    echo json_encode([
        "ok" => false,
        "service" => "setu-contact-api",
        "message" => "Server not configured. Copy api/config.php.example to api/config.php",
    ]);
    exit;
}

$config = require $configPath;
$dailyLimit = (int) ($config["daily_limit"] ?? 3);

echo json_encode([
    "ok" => true,
    "service" => "setu-contact-api",
    "dailyLimit" => $dailyLimit,
]);
