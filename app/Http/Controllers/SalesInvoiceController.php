<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\PaymentMethod;
use App\Models\Produit;
use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SalesInvoiceController extends Controller
{
    /**
     * Display a listing of sales invoices
     */
    public function index(Request $request)
    {
        $invoices = SalesInvoice::with('client')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('uuid', 'like', "%{$search}%")
                        ->orWhereHas('client', function ($clientQuery) use ($search) {
                            $clientQuery->where('nom', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->status && $request->status !== 'all', function ($query) use ($request) {
                $query->where('status', $request->status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 5)
            ->withQueryString();

        return Inertia::render('sales_invoices/Index', [
            'salesInvoices' => $invoices,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
                'per_page' => $request->per_page ?? 5,
            ],
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        return Inertia::render('sales_invoices/Create', [
            'clients' => Client::all(),
            'products' => Produit::select('id', 'nom', 'sale_price', 'stock_quantity')->get(),
        ]);
    }

    /**
     * Store sales invoice
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'client_name' => 'nullable|string|max:255',
            'client_phone' => 'nullable|string|max:50',

            'invoice_date' => 'required|date',
            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:produits,id',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        DB::transaction(function () use ($validated) {

            /*
            |----------------------------------------
            | 1️⃣ CREATE CLIENT IF NEW
            |----------------------------------------
            */
            if (! empty($validated['client_name'])) {
                $client = Client::create([
                    'nom' => $validated['client_name'],
                    'telephone' => $validated['client_phone'] ?? null,
                ]);
            } else {
                $client = Client::findOrFail($validated['client_id']);
            }

            /*
            |----------------------------------------
            | 2️⃣ CREATE INVOICE
            |----------------------------------------
            */
            $invoice = SalesInvoice::create([
                'client_id' => $client->id,
                'invoice_date' => $validated['invoice_date'],
                'notes' => $validated['notes'] ?? null,
            ]);

            /*
            |----------------------------------------
            | 3️⃣ CREATE ITEMS
            |----------------------------------------
            */
            foreach ($validated['items'] as $item) {
                $product = Produit::findOrFail($item['product_id']);

                if ($product->stock_quantity < $item['quantity']) {
                    throw new \Exception("Not enough stock for product {$product->nom}");
                }

                $totalPrice = $item['unit_price'] * $item['quantity'];

                SalesInvoiceItem::create([
                    'sales_invoice_id' => $invoice->id,
                    'product_id' => $product->id,
                    'product_name' => $product->nom,
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'total_price' => $totalPrice,
                ]);

                $product->decrement('stock_quantity', $item['quantity']);
            }

            $invoice->updateTotals();
        });

        return redirect()->route('sales_invoices.index')
            ->with('success', 'Sales invoice created successfully.');
    }

    /**
     * Show single invoice
     */
    public function show(SalesInvoice $salesInvoice)
    {
        $methods = PaymentMethod::where('is_active', true)
            ->get(['uuid', 'name']);

        $salesInvoice->load([
            'client',
            'items.product',
            'payments.paymentMethod',
        ]);

        return Inertia::render('sales_invoices/Show', [
            'invoice' => $salesInvoice,
            'paymentMethods' => $methods,
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(SalesInvoice $salesInvoice)
    {
        $salesInvoice->load('items');

        return Inertia::render('sales_invoices/Edit', [
            'invoice' => $salesInvoice,
            'clients' => Client::all(),
            'products' => Produit::select('id', 'nom', 'sale_price', 'stock_quantity')->get(),

        ]);
    }

    /**
     * Update invoice
     */
    public function update(Request $request, SalesInvoice $salesInvoice)
    {
        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'client_name' => 'nullable|string|max:255',
            'client_phone' => 'nullable|string|max:50',

            'invoice_date' => 'required|date',
            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:produits,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $salesInvoice) {

            /*
            |----------------------------------------
            | 1️⃣ RESTORE OLD STOCK
            |----------------------------------------
            */
            foreach ($salesInvoice->items as $oldItem) {
                $oldItem->product?->increment('stock_quantity', $oldItem->quantity);
            }

            /*
            |----------------------------------------
            | 2️⃣ DELETE OLD ITEMS
            |----------------------------------------
            */
            $salesInvoice->items()->delete();

            /*
            |----------------------------------------
            | 3️⃣ CREATE OR GET CLIENT
            |----------------------------------------
            */
            if (! empty($validated['client_name'])) {
                $client = Client::create([
                    'nom' => $validated['client_name'],
                    'telephone' => $validated['client_phone'] ?? null,
                ]);
            } else {
                $client = Client::findOrFail($validated['client_id']);
            }

            /*
            |----------------------------------------
            | 4️⃣ UPDATE INVOICE
            |----------------------------------------
            */
            $salesInvoice->update([
                'client_id' => $client->id,
                'invoice_date' => $validated['invoice_date'],
                'notes' => $validated['notes'] ?? null,
            ]);

            /*
            |----------------------------------------
            | 5️⃣ RECREATE ITEMS
            |----------------------------------------
            */
            foreach ($validated['items'] as $item) {
                $product = Produit::findOrFail($item['product_id']);

                if ($product->stock_quantity < $item['quantity']) {
                    throw new \Exception("Not enough stock for product {$product->nom}");
                }

                $salesInvoice->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->nom,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                ]);

                $product->decrement('stock_quantity', $item['quantity']);
            }

            /*
            |----------------------------------------
            | 6️⃣ UPDATE TOTALS
            |----------------------------------------
            */
            $salesInvoice->updateTotals();
        });

        return redirect()
            ->route('sales_invoices.index')
            ->with('success', 'Sales invoice updated successfully.');
    }

    /**
     * Delete invoice
     */
    public function destroy(SalesInvoice $salesInvoice)
    {
        DB::transaction(function () use ($salesInvoice) {

            foreach ($salesInvoice->items as $item) {
                $item->product?->increment('stock_quantity', $item->quantity);
            }

            $salesInvoice->items()->delete();
            $salesInvoice->delete();
        });

        return redirect()->route('sales_invoices.index')
            ->with('success', 'Sales invoice deleted successfully.');
    }
}
