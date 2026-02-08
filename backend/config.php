<?php
// Configurazione di esempio per la connessione MySQL
return [
    'db' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'name' => getenv('DB_NAME') ?: 'trello_clone',
        'user' => getenv('DB_USER') ?: 'root',
        'pass' => getenv('DB_PASS') ?: 'dF{REEGnh=9a{9Ia',
        'charset' => getenv('DB_CHARSET') ?: 'utf8mb4',
    ],
    'cors' => [
        'allowed_origins' => getenv('CORS_ALLOWED_ORIGINS') ?: '*',
        'allowed_methods' => getenv('CORS_ALLOWED_METHODS') ?: 'GET, POST, PUT, DELETE, OPTIONS',
        'allowed_headers' => getenv('CORS_ALLOWED_HEADERS') ?: 'Content-Type, Authorization'
    ]
];
