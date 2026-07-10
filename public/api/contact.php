<?php
declare(strict_types=1);

require __DIR__ . "/lib.php";

header("Content-Type: application/json; charset=utf-8");

$configPath = __DIR__ . "/config.php";
if (!is_file($configPath)) {
    contact_json_response(503, [
        "success" => false,
        "message" => "Email service is not configured. Please try again later.",
    ]);
}

$config = require $configPath;
$allowedOrigins = $config["allowed_origins"] ?? ["https://setuai.com", "https://www.setuai.com"];
contact_set_cors($allowedOrigins);

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    contact_json_response(405, [
        "success" => false,
        "message" => "Method not allowed.",
    ]);
}

$raw = file_get_contents("php://input");
$body = json_decode($raw ?: "{}", true);
if (!is_array($body)) {
    contact_json_response(400, [
        "success" => false,
        "message" => "Invalid request body.",
    ]);
}

$parsed = contact_validate_body($body);
if (isset($parsed["error"])) {
    contact_json_response(400, [
        "success" => false,
        "message" => $parsed["error"],
    ]);
}

$dailyLimit = (int) ($config["daily_limit"] ?? 3);
$clientIp = contact_client_ip();

if (contact_get_usage("ip", $clientIp) >= $dailyLimit) {
    contact_json_response(429, [
        "success" => false,
        "message" => contact_daily_limit_message($dailyLimit),
    ]);
}

if (contact_get_usage("email", $parsed["email"]) >= $dailyLimit) {
    contact_json_response(429, [
        "success" => false,
        "message" => contact_daily_limit_message($dailyLimit),
    ]);
}

if (empty($config["smtp_host"]) || empty($config["smtp_user"]) || empty($config["smtp_pass"])) {
    contact_json_response(503, [
        "success" => false,
        "message" => "Email service is not configured. Please try again later.",
    ]);
}

try {
    contact_send_email($config, $parsed);
    contact_record_usage("ip", $clientIp);
    contact_record_usage("email", $parsed["email"]);

    contact_json_response(200, [
        "success" => true,
        "message" => "Your message has been sent successfully.",
    ]);
} catch (Throwable $e) {
    error_log("SETU contact form error: " . $e->getMessage());
    contact_json_response(500, [
        "success" => false,
        "message" => "Failed to send your message. Please try again later.",
    ]);
}
