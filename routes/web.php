<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\PurchaseInvoiceController;
use App\Http\Controllers\SalesInvoiceController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SalesReturnController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {

    // PRODUITS
    Route::post('/produits/bulk-delete', [ProduitController::class, 'bulkDelete'])
        ->name('produits.bulk-delete');
    Route::resource('produits', ProduitController::class);

    // CLIENTS
    Route::get('/clients/{client}/history', [ClientController::class, 'history'])
        ->name('clients.history');
    Route::resource('clients', ClientController::class);
    Route::post('/clients/bulk-delete', [ClientController::class, 'bulkDelete'])
        ->name('clients.bulk-delete');
    Route::get('/clients/export/csv', [ClientController::class, 'exportCsv'])
        ->name('clients.export');

    // SUPPLIERS
    Route::resource('suppliers', SupplierController::class);
    Route::post('/suppliers/bulk-delete', [SupplierController::class, 'bulkDelete'])
        ->name('suppliers.bulk-delete');
    Route::get('/suppliers/export/csv', [SupplierController::class, 'exportCsv'])
        ->name('suppliers.export');

    // PURCHASE INVOICES
    Route::post('/purchase_invoices/bulk-delete', [PurchaseInvoiceController::class, 'bulkDelete'])
        ->name('purchase_invoices.bulk-delete');

    // ✅ PDF route FIRST
    Route::get('/purchase_invoices/{invoice}/pdf', [PurchaseInvoiceController::class, 'downloadPdf'])
        ->name('purchase_invoices.pdf');

    // Resource route AFTER
    Route::resource('purchase_invoices', PurchaseInvoiceController::class);


    Route::get('purchase_invoices/{purchaseInvoice}/download', [PurchaseInvoiceController::class, 'downloadPDF'])
    ->name('purchase_invoices.download');


    Route::resource('sales_invoices', SalesInvoiceController::class);

    // Route::resource('sales_returns', SalesReturnController::class);
    // Route::get('sales_returns/returnable-items/{invoice}', [SalesReturnController::class, 'getReturnableItemsForInvoice']);
    
    Route::get('sales_returns/returnable-items/{invoice:uuid}', [SalesReturnController::class, 'getReturnableItemsForInvoice'])
    ->name('sales_returns.returnable_items');
 
    Route::resource('sales_returns', SalesReturnController::class);

    // Paiment Parts

    Route::resource('/settings/payment_methods', PaymentMethodController::class);

    // PURCHASE INVOICES - Paiment

    // Payments
    Route::post('/purchase_invoices/{invoiceUuid}/payments', [PaymentController::class, 'store'])
        ->name('purchase_invoices.payments.store');

    Route::post('/sales_invoices/{invoiceUuid}/payments', [PaymentController::class, 'storeSalesPayment'])
        ->name('sales_invoices.payments.store');

});

require __DIR__.'/settings.php';
