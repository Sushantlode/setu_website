<?php
declare(strict_types=1);

function contact_json_response(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function contact_get_origin(): string
{
    return isset($_SERVER["HTTP_ORIGIN"]) ? (string) $_SERVER["HTTP_ORIGIN"] : "";
}

function contact_set_cors(array $allowedOrigins): void
{
    $origin = contact_get_origin();

    if ($origin !== "" && in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header("Vary: Origin");
    }

    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
}

function contact_client_ip(): string
{
    if (!empty($_SERVER["HTTP_X_FORWARDED_FOR"])) {
        $parts = explode(",", (string) $_SERVER["HTTP_X_FORWARDED_FOR"]);
        return trim($parts[0]);
    }

    return (string) ($_SERVER["REMOTE_ADDR"] ?? "unknown");
}

function contact_escape_html(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, "UTF-8");
}

function contact_validate_body(array $body): array
{
    $name = trim((string) ($body["name"] ?? ""));
    $email = strtolower(trim((string) ($body["email"] ?? "")));
    $subject = trim((string) ($body["subject"] ?? ""));
    $message = trim((string) ($body["message"] ?? ""));

    if (strlen($name) < 2 || strlen($name) > 120) {
        return ["error" => "Please enter a valid name."];
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
        return ["error" => "Please enter a valid email address."];
    }

    if (strlen($subject) < 3 || strlen($subject) > 200) {
        return ["error" => "Please enter a subject (at least 3 characters)."];
    }

    if (strlen($message) < 10 || strlen($message) > 5000) {
        return ["error" => "Please enter a message (at least 10 characters)."];
    }

    return compact("name", "email", "subject", "message");
}

function contact_usage_file(string $prefix, string $value): string
{
    $safe = preg_replace("/[^a-zA-Z0-9@._:-]/", "_", "{$prefix}_{$value}");
    $date = gmdate("Y-m-d");
    return __DIR__ . "/data/usage_{$safe}_{$date}.json";
}

function contact_get_usage(string $prefix, string $value): int
{
    $file = contact_usage_file($prefix, $value);
    if (!is_file($file)) {
        return 0;
    }

    $raw = file_get_contents($file);
    $data = json_decode($raw ?: "0", true);

    return is_int($data) ? $data : (int) $data;
}

function contact_record_usage(string $prefix, string $value): void
{
    $file = contact_usage_file($prefix, $value);
    $count = contact_get_usage($prefix, $value) + 1;
    file_put_contents($file, json_encode($count), LOCK_EX);
}

function contact_daily_limit_message(int $limit): string
{
    return "You can only send {$limit} messages per day. Please try again tomorrow.";
}

function contact_smtp_send(array $config, string $to, string $subject, string $html, string $text, ?string $replyTo = null): void
{
    $host = (string) $config["smtp_host"];
    $port = (int) ($config["smtp_port"] ?? 465);
    $secure = ($config["smtp_secure"] ?? true) !== false;
    $user = (string) $config["smtp_user"];
    $pass = (string) $config["smtp_pass"];
    $from = (string) ($config["smtp_from"] ?? $user);

    $transport = $secure ? "ssl" : "tcp";
    $socket = @stream_socket_client(
        "{$transport}://{$host}:{$port}",
        $errno,
        $errstr,
        30,
        STREAM_CLIENT_CONNECT
    );

    if (!$socket) {
        throw new RuntimeException("SMTP connection failed: {$errstr}");
    }

    stream_set_timeout($socket, 30);

    $read = static function () use ($socket): string {
        $data = "";
        while (!feof($socket)) {
            $line = fgets($socket, 515);
            if ($line === false) {
                break;
            }
            $data .= $line;
            if (isset($line[3]) && $line[3] === " ") {
                break;
            }
        }
        return $data;
    };

    $write = static function (string $command) use ($socket, $read): void {
        fwrite($socket, $command . "\r\n");
        $response = $read();
        if (!preg_match("/^[23]/", $response)) {
            throw new RuntimeException("SMTP error after {$command}: {$response}");
        }
    };

    $read();
    $write("EHLO setuai.com");
    $write("AUTH LOGIN");
    $write(base64_encode($user));
    $write(base64_encode($pass));
    $write("MAIL FROM:<{$user}>");
    $write("RCPT TO:<{$to}>");
    $write("DATA");

    $headers = [
        "From: {$from}",
        "To: {$to}",
        "Subject: {$subject}",
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=UTF-8",
    ];

    if ($replyTo) {
        $headers[] = "Reply-To: {$replyTo}";
    }

    $payload = implode("\r\n", $headers) . "\r\n\r\n" . $html . "\r\n.";
    fwrite($socket, $payload . "\r\n");
    $response = $read();
    if (!preg_match("/^250/", $response)) {
        throw new RuntimeException("SMTP DATA failed: {$response}");
    }

    $write("QUIT");
    fclose($socket);
}

function contact_send_email(array $config, array $payload): void
{
    $to = (string) ($config["contact_to"] ?? "support@setuai.com");
    $siteName = (string) ($config["site_name"] ?? "SETU");

    $safeName = contact_escape_html($payload["name"]);
    $safeEmail = contact_escape_html($payload["email"]);
    $safeSubject = contact_escape_html($payload["subject"]);
    $safeMessage = nl2br(contact_escape_html($payload["message"]));

    $html = "
      <div style=\"font-family: Arial, sans-serif; color: #2a2826; line-height: 1.6; max-width: 640px;\">
        <h2 style=\"color: #3f4a54; margin-bottom: 8px;\">New website inquiry</h2>
        <p style=\"margin-top: 0; color: #6b6560;\">A visitor submitted the contact form on {$siteName}.</p>
        <table style=\"width: 100%; border-collapse: collapse; margin-top: 20px;\">
          <tr><td style=\"padding: 8px 0; font-weight: 600; width: 120px;\">Name</td><td style=\"padding: 8px 0;\">{$safeName}</td></tr>
          <tr><td style=\"padding: 8px 0; font-weight: 600;\">Email</td><td style=\"padding: 8px 0;\"><a href=\"mailto:{$safeEmail}\">{$safeEmail}</a></td></tr>
          <tr><td style=\"padding: 8px 0; font-weight: 600;\">Subject</td><td style=\"padding: 8px 0;\">{$safeSubject}</td></tr>
        </table>
        <div style=\"margin-top: 20px; padding: 16px; background: #f3f0eb; border-radius: 12px;\">
          <p style=\"margin: 0 0 8px; font-weight: 600;\">Message</p>
          <p style=\"margin: 0;\">{$safeMessage}</p>
        </div>
      </div>
    ";

    $text = implode("\n", [
        "New website inquiry",
        "",
        "Name: {$payload["name"]}",
        "Email: {$payload["email"]}",
        "Subject: {$payload["subject"]}",
        "",
        "Message:",
        $payload["message"],
    ]);

    contact_smtp_send(
        $config,
        $to,
        "[SETU Website] {$payload["subject"]}",
        $html,
        $text,
        $payload["email"]
    );

    if (!empty($config["send_user_confirmation"])) {
        $confirmHtml = "
          <div style=\"font-family: Arial, sans-serif; color: #2a2826; line-height: 1.6; max-width: 640px;\">
            <h2 style=\"color: #3f4a54;\">Thank you, {$safeName}</h2>
            <p>We have received your inquiry and our team will get back to you shortly.</p>
            <p style=\"margin-top: 20px; color: #6b6560;\">Subject: <strong>{$safeSubject}</strong></p>
          </div>
        ";

        contact_smtp_send(
            $config,
            $payload["email"],
            "We received your message — {$siteName}",
            $confirmHtml,
            "Thank you, {$payload["name"]}. We received your inquiry about \"{$payload["subject"]}\" and will get back to you shortly."
        );
    }
}
