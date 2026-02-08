<?php
// Utility per risposte JSON standardizzate
class Response
{
    public static function json($data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['data' => $data], JSON_UNESCAPED_UNICODE);
    }

    public static function error(string $message, string $code, int $status = 400): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => [
                'message' => $message,
                'code' => $code,
            ]
        ], JSON_UNESCAPED_UNICODE);
    }
}
