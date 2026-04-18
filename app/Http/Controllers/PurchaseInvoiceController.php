<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use App\Models\Produit;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseInvoiceItem;
use App\Models\Supplier;
// use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\Browsershot\Browsershot;
use Spatie\LaravelPdf\Facades\Pdf;

class PurchaseInvoiceController extends Controller
{
    public function downloadPdf(PurchaseInvoice $invoice)
    {
        $invoice->load('supplier', 'items');

        return Pdf::view('purchase_invoices.pdf', compact('invoice'))
        // return Pdf::view('pages.purchase_invoices.pdf', compact('invoice'))
            ->format('a4')
            ->name($invoice->code.'.pdf')
            ->withBrowsershot(function (Browsershot $browsershot) {
                $browsershot
                    ->setNodeBinary('C:/Program Files/nodejs/node.exe')
                    ->setNpmBinary('C:/Program Files/nodejs/npm.cmd')
                    ->setChromePath('C:/Program Files/Google/Chrome/Application/chrome.exe');
            })
            ->download();
    }

    /**
     * Display a listing of purchase invoices
     */
    public function index(Request $request)
    {
        // Optional filters
        $invoices = PurchaseInvoice::with('supplier')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('uuid', 'like', "%{$search}%")
                        ->orWhereHas('supplier', function ($supplierQuery) use ($search) {
                            $supplierQuery->where('nom', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->status && $request->status !== 'all', function ($query) use ($request) {
                $query->where('status', $request->status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 5)
            ->withQueryString();

        return Inertia::render('purchase_invoices/Index', [
            'purchaseInvoices' => $invoices,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
                'per_page' => $request->per_page ?? 5,
            ],
        ]);
    }

    /**
     * Show form to create a new invoice
     */
    public function create()
    {
        return Inertia::render('purchase_invoices/Create', [
            'suppliers' => Supplier::all(),
            'products' => Produit::select('id', 'nom', 'purchase_price', 'sale_price', 'stock_quantity')->get(),
            //                                                                            ^^^^^^^^^^^^^^ ADD THIS
        ]);
    }

    /**
     * Store a new invoice
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'nullable|exists:suppliers,id',
            'supplier_name' => 'nullable|string|max:255',
            'supplier_phone' => 'nullable|string|max:50',

            'invoice_date' => 'required|date',
            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',

            'items.*.product_id' => 'nullable|exists:produits,id',
            'items.*.product_name' => 'nullable|string|max:255',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.sale_price' => 'nullable|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.is_new' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($validated) {

            /*
            |----------------------------------------
            | 1️⃣ CREATE SUPPLIER IF NEW
            |----------------------------------------
            */

            if (! empty($validated['supplier_name'])) {

                $supplier = Supplier::create([
                    'nom' => $validated['supplier_name'],
                    'telephone' => $validated['supplier_phone'] ?? null,
                ]);

            } else {

                $supplier = Supplier::findOrFail($validated['supplier_id']);

            }

            /*
            |----------------------------------------
            | 2️⃣ CREATE INVOICE
            |----------------------------------------
            */

            $invoice = PurchaseInvoice::create([
                'supplier_id' => $supplier->id,
                'invoice_date' => $validated['invoice_date'],
                'notes' => $validated['notes'] ?? null,
            ]);

            /*
            |----------------------------------------
            | 3️⃣ CREATE ITEMS
            |----------------------------------------
            */

            foreach ($validated['items'] as $item) {

                if (! empty($item['is_new'])) {

                    $product = Produit::create([
                        'nom' => $item['product_name'],
                        'purchase_price' => $item['unit_price'],
                        'sale_price' => $item['sale_price'] ?? 0,
                        'stock_quantity' => 0,
                    ]);

                } else {

                    $product = Produit::findOrFail($item['product_id']);

                    if ($product->purchase_price != $item['unit_price']) {
                        $product->update([
                            'purchase_price' => $item['unit_price'],
                        ]);
                    }

                }

                PurchaseInvoiceItem::create([
                    'purchase_invoice_id' => $invoice->id,
                    'product_id' => $product->id,
                    'product_name' => $product->nom,
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'total_price' => $item['unit_price'] * $item['quantity'],
                ]);

                $product->increment('stock_quantity', $item['quantity']);
            }

            $invoice->updateTotals();

        });

        return redirect()->route('purchase_invoices.index')
            ->with('success', 'Purchase invoice created successfully.');
    }

    /**
     * Show a single invoice
     */
    public function show(PurchaseInvoice $purchaseInvoice)
    {
        $methods = PaymentMethod::where('is_active', true)->get(['uuid', 'name']);
        $purchaseInvoice->load([
            'supplier',
            'items.product',
            'payments.paymentMethod',
        ]);

        return Inertia::render('purchase_invoices/Show', [
            'invoice' => $purchaseInvoice,
            'paymentMethods' => $methods,
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(PurchaseInvoice $purchaseInvoice)
    {
        $purchaseInvoice->load('items');

        return Inertia::render('purchase_invoices/Edit', [
            'invoice' => $purchaseInvoice,
            'suppliers' => Supplier::all(),
            'products' => Produit::select('id', 'nom', 'purchase_price', 'sale_price', 'stock_quantity')->get(),
            //                                                                            ^^^^^^^^^^^^^^ ADD THIS
        ]);
    }

    /**
     * Update invoice and items
     */
    public function update(Request $request, PurchaseInvoice $purchase_invoice)
    {
        $validated = $request->validate([
            'supplier_id' => 'nullable|exists:suppliers,id',
            'supplier_name' => 'nullable|string|max:255',
            'supplier_phone' => 'nullable|string|max:50',

            'invoice_date' => 'required|date',
            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',

            'items.*.product_id' => 'nullable|exists:produits,id',
            'items.*.product_name' => 'nullable|string|max:255',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.sale_price' => 'nullable|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.is_new' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($validated, $purchase_invoice) {

            /*
            |----------------------------------------
            | 1️⃣ ROLLBACK OLD STOCK
            |----------------------------------------
            */

            foreach ($purchase_invoice->items as $oldItem) {
                $oldItem->product?->decrement('stock_quantity', $oldItem->quantity);
            }

            /*
            |----------------------------------------
            | 2️⃣ DELETE OLD ITEMS
            |----------------------------------------
            */

            $purchase_invoice->items()->delete();

            /*
            |----------------------------------------
            | 3️⃣ CREATE OR GET SUPPLIER
            |----------------------------------------
            */

            if (! empty($validated['supplier_name'])) {

                $supplier = Supplier::create([
                    'nom' => $validated['supplier_name'],
                    'telephone' => $validated['supplier_phone'] ?? null,
                ]);

            } else {

                $supplier = Supplier::findOrFail($validated['supplier_id']);

            }

            /*
            |----------------------------------------
            | 4️⃣ UPDATE INVOICE
            |----------------------------------------
            */

            $purchase_invoice->update([
                'supplier_id' => $supplier->id,
                'invoice_date' => $validated['invoice_date'],
                'notes' => $validated['notes'] ?? null,
            ]);

            /*
            |----------------------------------------
            | 5️⃣ CREATE ITEMS
            |----------------------------------------
            */

            foreach ($validated['items'] as $item) {

                if (! empty($item['is_new'])) {

                    $product = Produit::create([
                        'nom' => $item['product_name'],
                        'purchase_price' => $item['unit_price'],
                        'sale_price' => $item['sale_price'] ?? 0,
                        'stock_quantity' => 0,
                    ]);

                } else {

                    $product = Produit::findOrFail($item['product_id']);

                    if ($product->purchase_price != $item['unit_price']) {
                        $product->update([
                            'purchase_price' => $item['unit_price'],
                        ]);
                    }

                }

                $purchase_invoice->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->nom,
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'total_price' => $item['unit_price'] * $item['quantity'],
                ]);

                $product->increment('stock_quantity', $item['quantity']);
            }

            /*
            |----------------------------------------
            | 6️⃣ UPDATE TOTALS
            |----------------------------------------
            */

            $purchase_invoice->updateTotals();
        });

        return redirect()
            ->route('purchase_invoices.index')
            ->with('success', 'Purchase invoice updated successfully.');
    }

    // public function downloadPDF(PurchaseInvoice $purchaseInvoice)
    // {
    //     $purchaseInvoice->load('supplier', 'items');

    //     $html = view('purchase_invoices.pdf_template', [
    //         'invoice' => $purchaseInvoice,
    //     ])->render();

    //     $pdf = Pdf::loadHTML($html)
    //         ->setPaper('a4', 'portrait')
    //         ->setOption('defaultFont', 'DejaVu Sans');

    //     return $pdf->download("Invoice_{$purchaseInvoice->code}.pdf");
    // }

    // public function downloadPDF(Request $request, PurchaseInvoice $purchaseInvoice)
    // {
    //     $html = $request->input('html');

    //     if (! $html) {
    //         $purchaseInvoice->load('supplier', 'items');
    //         $html = view('purchase_invoices.pdf_template', [
    //             'invoice' => $purchaseInvoice,
    //         ])->render();
    //     }

    //     $pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');

    //     return $pdf->download("Invoice_{$purchaseInvoice->code}.pdf");
    // }

    /**
     * Delete invoice
     */
    public function destroy(PurchaseInvoice $purchaseInvoice)
    {
        DB::transaction(function () use ($purchaseInvoice) {

            foreach ($purchaseInvoice->items()->with('product')->get() as $item) {
                if ($item->product) {
                    $item->product->decrement('stock_quantity', $item->quantity);
                }
            }

            $purchaseInvoice->items()->delete();
            $purchaseInvoice->delete();
        });

        return redirect()->route('purchase_invoices.index')
            ->with('success', 'Invoice deleted successfully.');
    }
}
