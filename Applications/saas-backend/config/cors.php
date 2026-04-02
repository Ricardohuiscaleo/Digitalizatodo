<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'info/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['http://localhost:3001', 'http://localhost:3002', 'https://app.digitalizatodo.cl', 'https://admin.digitalizatodo.cl'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
