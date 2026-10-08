<?php

use App\Http\Controllers\ProductsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ItemController;


Route::apiResource('items', ItemController::class);
Route::apiResource('products', ProductsController::class);
Route::apiResource('items', ItemController::class);
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
