<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (!auth()->check()) {
        return redirect('/clientes/login');
    }

    $user = auth()->user();

    if (is_null($user->tenant_id)) {
        return redirect('/admin');
    }

    return redirect('/' . $user->tenant_id);
});

Route::get('/login', function () {
    return redirect('/clientes/login');
})->name('login');

Route::get('/trial-expirado', function () {
    return view('trial-expired');
})->name('trial.expired');