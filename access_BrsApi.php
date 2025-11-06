<?php
declare(strict_types=1);

class ConnectionTester {
    public const DEFAULT_HOST = 'brsapi.ir';
    private const PORTS = [80, 443];
    private const TIMEOUT = 1;
    private const CURL_TIMEOUT = 2;

    private string $host;
    private string $serverIp;
    private string $publicIp;

    public function __construct(string $host = self::DEFAULT_HOST) {
        $this->host = $this->sanitizeHost($host);
        $this->serverIp = $_SERVER['SERVER_ADDR'] ?? 'نامشخص';
        $this->publicIp = $this->getPublicIP();
    }

    private function sanitizeHost(string $host): string {
        $host = trim($host);
        if (!preg_match('/^https?:\/\//i', $host)) $host = 'https://' . $host;
        $parsed = parse_url($host);
        return ($parsed === false || !isset($parsed['host'])) ? self::DEFAULT_HOST : $parsed['host'];
    }

    private function displayResult(string $test, string $result, bool $isError = false): void {
        $color = $isError ? '#ff4444' : '#4CAF50';
        $icon = $isError ? '❌' : '✅';
        echo "<div style='margin:5px 0; padding:8px; border-left:3px solid $color; background:#f8f9fa;'>
                <span style='color:$color;'>$icon $test:</span> $result
              </div>";
    }

    private function getPublicIP(): string {
        if (function_exists('socket_create') && ($socket = @socket_create(AF_INET, SOCK_DGRAM, SOL_UDP))) {
            @socket_connect($socket, '8.8.8.8', 53);
            @socket_getsockname($socket, $ip);
            @socket_close($socket);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
        if (($ip = gethostbyname(gethostname())) !== gethostname() && filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        if (function_exists('shell_exec')) foreach (['dig +short myip.opendns.com @resolver1.opendns.com','curl -s ifconfig.me','curl -s icanhazip.com'] as $cmd)
            if (filter_var($ip = trim(@shell_exec($cmd)), FILTER_VALIDATE_IP)) return $ip;
        return 'نامشخص';
    }

    public function runTests(): void {
        echo "<div style='background:#e3f2fd; padding:15px; margin-bottom:15px; border-radius:5px;'>
                <div><strong>مشخصات هاست فعلی</strong></div>
                <div><strong>IP داخلی:</strong> {$this->serverIp}</div>
                <div><strong>IP عمومی:</strong> {$this->publicIp}</div>
                <div><strong>زمان:</strong> " . date("Y-m-d H:i:s") . "</div>
              </div>";

        // بررسی DNS
        $ip = gethostbyname($this->host);
        $this->displayResult('DNS', ($ip === $this->host) ? "ناموفق - نام هاست قابل تبدیل به IP نیست" : "موفق - $this->host → $ip", $ip === $this->host);
        if ($ip === $this->host) return;

        // بررسی پورت‌ها
        foreach (self::PORTS as $port) {
            $service = ($port === 443) ? 'HTTPS' : 'HTTP';
            $socket = @fsockopen($ip, $port, $errno, $errstr, self::TIMEOUT);
            $this->displayResult("$service (پورت $port)", $socket ? "موفق - پورت باز است" : "ناموفق - $errstr", !$socket);
            if ($socket) fclose($socket);
        }

        // بررسی SSL
        $ch = curl_init("https://{$this->host}");
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT=>self::CURL_TIMEOUT, CURLOPT_SSL_VERIFYPEER=>true,
            CURLOPT_FAILONERROR=>true, CURLOPT_HEADER=>true, CURLOPT_NOBODY=>true, CURLOPT_VERBOSE=>true]);
        ob_start();
        $response = curl_exec($ch);
        $verbose = ob_get_clean();
        if ($response === false) {
            $error = curl_error($ch);
            $this->displayResult('SSL', "ناموفق - $error", true);
            if (in_array(curl_errno($ch), [60, 77])) $this->displayResult('SSL Certificate', "مشکل در تأیید گواهی", true);
        } else {
            $this->displayResult('SSL', "موفق - وضعیت HTTP: " . curl_getinfo($ch, CURLINFO_HTTP_CODE));
        }
        curl_close($ch);

        // Traceroute
        if (function_exists('shell_exec') && !in_array('shell_exec', explode(',', ini_get('disable_functions')))) {
            $cmd = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? 'tracert -d -w 1 -h 15 ' : 'traceroute -n -w 1 -m 15 ';
            $this->displayResult('Traceroute', "نتایج در جزئیات فنی", false);
            echo "<pre style='background:#f5f5f5; padding:10px; font-size:12px;'>" . htmlspecialchars(@shell_exec($cmd . escapeshellarg($this->host) . " 2>&1")) . "</pre>";
        } else {
            $this->displayResult('Traceroute', "غیرفعال", true);
        }
    }
}

// شروع اجرای صفحه
header('Content-Type: text/html; charset=utf-8');

// مقدار ورودی از GET یا مقدار پیش‌فرض
$hostInput = $_GET['host'] ?? ConnectionTester::DEFAULT_HOST;

echo '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>بررسی اتصال سرور</title>
      <style>
      body{font-family:Tahoma; direction:rtl; padding:15px; max-width:800px; margin:auto; line-height:1.6;}
      pre{direction:ltr; text-align:left; background:#f5f5f5; padding:10px; font-size:12px;}
      form{margin-bottom:20px;} input[type=text]{padding:6px 10px; width:300px;} button{padding:6px 15px;}
      </style></head><body>';

// فرم ورودی برای دریافت هاست
echo '<form method="get" action="">
        <label for="host"><strong>آدرس هاست مورد نظر:</strong></label><br>
        <input type="text" name="host" id="host" value="' . htmlspecialchars($hostInput) . '" placeholder="مثلاً: brsapi.ir">
        <button type="submit">بررسی</button>
      </form>';

// اجرای تست
(new ConnectionTester($hostInput))->runTests();

echo '</body></html>';
