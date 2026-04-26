<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\ClientTransactionController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\PurchaseInvoiceController;
use App\Http\Controllers\SalesInvoiceController;
use App\Http\Controllers\SalesReturnController;
use App\Http\Controllers\SupplierController;
use App\Models\Client;
use App\Models\ClientTransaction;
use App\Models\DamagedStock;
use App\Models\Produit;
use App\Models\PurchaseInvoice;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function (Request $request) {

    /* ── Period filter ── */
    $period   = $request->get('period', 'month');
    $dateFrom = $request->get('date_from');
    $dateTo   = $request->get('date_to');

    [$from, $to] = match ($period) {
        'day'    => [now()->startOfDay(),          now()->endOfDay()],
        'week'   => [now()->subDays(6)->startOfDay(), now()->endOfDay()],
        'year'   => [now()->startOfYear(),         now()->endOfYear()],
        'custom' => [
            $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : now()->subDays(29)->startOfDay(),
            $dateTo   ? Carbon::parse($dateTo)->endOfDay()     : now()->endOfDay(),
        ],
        default  => [now()->subDays(29)->startOfDay(), now()->endOfDay()], // month
    };

    /* ── Chart grouping ── */
    $diffDays = (int) $from->diffInDays($to);

    if ($period === 'day') {
        $sqlFmt  = '%H';
        $keys    = collect(range(0, 23))->map(fn ($h) => str_pad($h, 2, '0', STR_PAD_LEFT));
        $labels  = $keys->map(fn ($h) => $h . ':00');
    } elseif ($period === 'year' || $diffDays > 60) {
        $sqlFmt  = '%Y-%m';
        $months  = collect();
        $cur     = $from->copy()->startOfMonth();
        while ($cur->lte($to)) {
            $months->push($cur->format('Y-m'));
            $cur->addMonth();
        }
        $keys   = $months;
        $labels = $months->map(fn ($m) => Carbon::createFromFormat('Y-m', $m)->locale('fr')->isoFormat('MMM YY'));
    } else {
        $sqlFmt  = '%Y-%m-%d';
        $keys    = collect(range($diffDays, 0))
            ->map(fn ($d) => $to->copy()->subDays($d)->format('Y-m-d'));
        $labels  = $keys->map(fn ($d) => Carbon::parse($d)->format('d/m'));
    }

    /* ── Helper: group a query by the chosen format ── */
    $grpTxn = function (string $type) use ($from, $to, $sqlFmt) {
        return ClientTransaction::where('type', $type)
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw("DATE_FORMAT(created_at, '{$sqlFmt}') as grp, SUM(total_price) as total")
            ->groupBy('grp')
            ->pluck('total', 'grp');
    };

    $grpPurch = PurchaseInvoice::whereBetween('created_at', [$from, $to])
        ->selectRaw("DATE_FORMAT(created_at, '{$sqlFmt}') as grp, SUM(total_amount) as total")
        ->groupBy('grp')
        ->pluck('total', 'grp');

    $dataF = $grpTxn('F');
    $dataR = $grpTxn('R');
    $dataP = $grpTxn('P');

    $trendData = $keys->values()->map(fn ($k, $i) => [
        'label'     => $labels->values()[$i] ?? $k,
        'sales'     => round((float) ($dataF[$k] ?? 0), 2),
        'returns'   => round((float) ($dataR[$k] ?? 0), 2),
        'payments'  => round((float) ($dataP[$k] ?? 0), 2),
        'purchases' => round((float) ($grpPurch[$k] ?? 0), 2),
    ])->values();

    /* ── Filtered aggregates ── */
    $totalF     = (float) ClientTransaction::whereBetween('created_at', [$from, $to])->where('type', 'F')->sum('total_price');
    $totalR     = (float) ClientTransaction::whereBetween('created_at', [$from, $to])->where('type', 'R')->sum('total_price');
    $totalP     = (float) ClientTransaction::whereBetween('created_at', [$from, $to])->where('type', 'P')->sum('total_price');
    $crmBalance = round($totalF - $totalR - $totalP, 2);

    $purchasePaid        = (float) PurchaseInvoice::whereBetween('created_at', [$from, $to])->sum('paid_amount');
    $purchaseOutstanding = (float) PurchaseInvoice::where('status', '!=', 'paid')->sum('remaining_amount');

    /* ── Top 5 clients (filtered) ── */
    $topClients = ClientTransaction::whereBetween('client_transactions.created_at', [$from, $to])
        ->where('client_transactions.type', 'F')
        ->join('clients', 'clients.id', '=', 'client_transactions.client_id')
        ->selectRaw('clients.uuid, clients.nom, SUM(client_transactions.total_price) as total_purchased')
        ->groupBy('clients.id', 'clients.uuid', 'clients.nom')
        ->orderByDesc('total_purchased')
        ->take(5)->get()
        ->map(fn ($r) => [
            'uuid'            => $r->uuid,
            'nom'             => $r->nom,
            'total_purchased' => round((float) $r->total_purchased, 2),
        ]);

    /* ── Recent transactions (always last 8, unfiltered) ── */
    $recentTxns = ClientTransaction::with('client')->latest()->take(8)->get()
        ->map(fn ($t) => [
            'uuid'         => $t->uuid         ?? '',
            'type'         => $t->type         ?? 'F',
            'client_uuid'  => $t->client?->uuid ?? '',
            'client_nom'   => $t->client?->nom  ?? 'N/A',
            'product_name' => $t->product_name  ?? null,
            'total_price'  => (float) ($t->total_price ?? 0),
            'created_at'   => $t->created_at?->toIso8601String() ?? '',
        ]);

    return Inertia::render('dashboard', [
        'crm' => [
            'total_f'   => round($totalF, 2),
            'total_r'   => round($totalR, 2),
            'total_p'   => round($totalP, 2),
            'balance'   => $crmBalance,
            'txn_count' => ClientTransaction::whereBetween('created_at', [$from, $to])->count(),
        ],
        'purchases' => [
            'paid'        => round($purchasePaid, 2),
            'outstanding' => round($purchaseOutstanding, 2),
            'count'       => PurchaseInvoice::whereBetween('created_at', [$from, $to])->count(),
        ],
        'counts' => [
            'clients'        => Client::count(),
            'active_clients' => Client::where('status', 'active')->count(),
            'suppliers'      => Supplier::count(),
            'products'       => Produit::count(),
            'low_stock'      => Produit::where('stock_quantity', '<=', 5)->count(),
            'damaged_qty'    => (int) DamagedStock::sum('quantity'),
        ],
        'trendData'        => $trendData,
        'topClients'       => $topClients,
        'recentTxns'       => $recentTxns,
        'lowStockProducts' => Produit::where('stock_quantity', '<=', 5)
            ->orderBy('stock_quantity')->take(6)->get(['uuid', 'nom', 'sku', 'stock_quantity']),
        'filters' => [
            'period'    => $period,
            'date_from' => $dateFrom ?? '',
            'date_to'   => $dateTo   ?? '',
        ],
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {

    // PRODUITS
    Route::post('/produits/bulk-delete', [ProduitController::class, 'bulkDelete'])
        ->name('produits.bulk-delete');
    Route::resource('produits', ProduitController::class);

    // CLIENTS
    Route::get('/clients/{client}/history', [ClientController::class, 'history'])
        ->name('clients.history');
    Route::get('/clients/{client}/history/pdf', [ClientController::class, 'historyPdf'])
        ->name('clients.history.pdf');

    // CLIENT TRANSACTIONS (F / R / P / Ledger)
    Route::get('/payments', [ClientTransactionController::class, 'paymentsList'])->name('payments.index');
    Route::get('/stock',    [ClientTransactionController::class, 'stockList'])->name('stock.index');

    Route::get('/clients/{client}/ledger',     [ClientTransactionController::class, 'ledger'])->name('clients.ledger');
    Route::get('/clients/{client}/ledger/pdf', [ClientTransactionController::class, 'ledgerPdf'])->name('clients.ledger.pdf');
    Route::get('/clients/{client}/sell',       [ClientTransactionController::class, 'sell'])->name('clients.sell');
    Route::post('/clients/{client}/sell',      [ClientTransactionController::class, 'storeSell'])->name('clients.sell.store');
    Route::get('/clients/{client}/return',     [ClientTransactionController::class, 'returnForm'])->name('clients.return');
    Route::post('/clients/{client}/return',    [ClientTransactionController::class, 'storeReturn'])->name('clients.return.store');
    Route::get('/clients/{client}/payment',    [ClientTransactionController::class, 'paymentForm'])->name('clients.payment');
    Route::post('/clients/{client}/payment',   [ClientTransactionController::class, 'storePayment'])->name('clients.payment.store');

    Route::resource('clients', ClientController::class);
    Route::post('/clients/bulk-delete', [ClientController::class, 'bulkDelete'])
        ->name('clients.bulk-delete');
    Route::get('/clients/export/csv', [ClientController::class, 'exportCsv'])
        ->name('clients.export');

    // SUPPLIERS
    Route::get('/suppliers/{supplier}/history/pdf', [SupplierController::class, 'historyPdf'])
        ->name('suppliers.history.pdf');
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


    Route::get('/sales_invoices/{salesInvoice}/pdf', [SalesInvoiceController::class, 'downloadPdf'])
        ->name('sales_invoices.pdf');
    Route::resource('sales_invoices', SalesInvoiceController::class);

    // Route::resource('sales_returns', SalesReturnController::class);
    // Route::get('sales_returns/returnable-items/{invoice}', [SalesReturnController::class, 'getReturnableItemsForInvoice']);

    Route::get('sales_returns/returnable-items/{invoice:uuid}', [SalesReturnController::class, 'getReturnableItemsForInvoice'])
        ->name('sales_returns.returnable_items');
    Route::get('/sales_returns/{salesReturn}/pdf', [SalesReturnController::class, 'downloadPdf'])
        ->name('sales_returns.pdf');
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
