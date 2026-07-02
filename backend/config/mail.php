<?php

return [

    'default' => env('MAIL_MAILER', 'log'),

    'mailers' => [

        'smtp' => [
            'transport'  => 'smtp',
            'scheme'     => env('MAIL_SCHEME'),
            'url'        => env('MAIL_URL'),
            'host'       => env('MAIL_HOST', '127.0.0.1'),
            'port'       => env('MAIL_PORT', 2525),
            'username'   => env('MAIL_USERNAME'),
            'password'   => env('MAIL_PASSWORD'),
            'timeout'    => null,
        ],

        'sendgrid' => [
            'transport' => 'smtp',
            'host'      => 'smtp.sendgrid.net',
            'port'      => 587,
            'encryption'=> 'tls',
            'username'  => 'apikey',
            'password'  => env('SENDGRID_API_KEY'),
        ],

        'log' => [
            'transport' => 'log',
            'channel'   => env('MAIL_LOG_CHANNEL'),
        ],

    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@peppy.app'),
        'name'    => env('MAIL_FROM_NAME', 'Peppy'),
    ],

];
