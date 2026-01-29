<?php
// Configurazione di esempio per la connessione MySQL
return [
    'db' => [
        'host' => '127.0.0.1',
        'name' => 'trello_clone',
        'user' => 'root',
        'pass' => 'dF{REEGnh=9a{9Ia',
        'charset' => 'utf8mb4',
    ],
    'cors' => [
        'allowed_origins' => '*',
        'allowed_methods' => 'GET, POST, PUT, DELETE, OPTIONS',
        'allowed_headers' => 'Content-Type, Authorization'
    ]
];
