<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\CompanyProfile;
use App\Models\PaymentMethod;
use App\Models\Produit;
use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use Barryvdh\DomPDF\Facade\Pdf;
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
            'clients'  => Client::select('id', 'nom', 'email', 'telephone')->orderBy('nom')->get(),
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

        try {
            DB::transaction(function () use ($validated) {

                if (! empty($validated['client_name'])) {
                    $client = Client::create([
                        'nom' => $validated['client_name'],
                        'telephone' => $validated['client_phone'] ?? null,
                    ]);
                } else {
                    $client = Client::findOrFail($validated['client_id']);
                }

                $invoice = SalesInvoice::create([
                    'client_id'    => $client->id,
                    'invoice_date' => $validated['invoice_date'],
                    'notes'        => $validated['notes'] ?? null,
                ]);

                foreach ($validated['items'] as $item) {
                    $product = Produit::findOrFail($item['product_id']);

                    if ($product->stock_quantity < $item['quantity']) {
                        throw new \Exception(
                            "Stock insuffisant pour « {$product->nom} » — disponible : {$product->stock_quantity}, demandé : {$item['quantity']}."
                        );
                    }

                    SalesInvoiceItem::create([
                        'sales_invoice_id' => $invoice->id,
                        'product_id'       => $product->id,
                        'product_name'     => $product->nom,
                        'unit_price'       => $item['unit_price'],
                        'quantity'         => $item['quantity'],
                        'total_price'      => $item['unit_price'] * $item['quantity'],
                    ]);

                    $product->decrement('stock_quantity', $item['quantity']);
                }

                $invoice->updateTotals();
            });
        } catch (\Exception $e) {
            return redirect()->back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()->route('sales_invoices.index')
            ->with('success', 'Facture de vente créée avec succès.');
    }

    /**
     * Download invoice as PDF
     */
    public function downloadPdf(SalesInvoice $salesInvoice)
    {
        try {
            $salesInvoice->load(['client', 'items', 'payments.paymentMethod']);

            $pdf = Pdf::loadView('sales_invoices.invoice_pdf', [
                'invoice' => $salesInvoice,
                'company' => (CompanyProfile::first() ?? new CompanyProfile())->toArray(),
            ])->setPaper('a4', 'portrait');

            return $pdf->download("{$salesInvoice->code}.pdf");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Impossible de générer le PDF : ' . $e->getMessage());
        }
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
            'invoice'  => $salesInvoice,
            'clients'  => Client::select('id', 'nom', 'email', 'telephone')->orderBy('nom')->get(),
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

        try { DB::transaction(function () use ($validated, $salesInvoice) {

            foreach ($salesInvoice->items as $oldItem) {
                $oldItem->product?->increment('stock_quantity', $oldItem->quantity);
            }

            $salesInvoice->items()->delete();

            if (! empty($validated['client_name'])) {
                $client = Client::create([
                    'nom' => $validated['client_name'],
                    'telephone' => $validated['client_phone'] ?? null,
                ]);
            } else {
                $client = Client::findOrFail($validated['client_id']);
            }

            $salesInvoice->update([
                'client_id'    => $client->id,
                'invoice_date' => $validated['invoice_date'],
                'notes'        => $validated['notes'] ?? null,
            ]);

            /*
            |----------------------------------------
            | 5️⃣ RECREATE ITEMS
            |----------------------------------------
            */
            foreach ($validated['items'] as $item) {
                $product = Produit::findOrFail($item['product_id']);

                if ($product->stock_quantity < $item['quantity']) {
                    throw new \Exception(
                        "Stock insuffisant pour « {$product->nom} » — disponible : {$product->stock_quantity}, demandé : {$item['quantity']}."
                    );
                }

                $salesInvoice->items()->create([
                    'product_id'   => $product->id,
                    'product_name' => $product->nom,
                    'quantity'     => $item['quantity'],
                    'unit_price'   => $item['unit_price'],
                    'total_price'  => $item['quantity'] * $item['unit_price'],
                ]);

                $product->decrement('stock_quantity', $item['quantity']);
            }

            $salesInvoice->updateTotals();
        }); } catch (\Exception $e) {
            return redirect()->back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()
            ->route('sales_invoices.index')
            ->with('success', 'Facture de vente mise à jour avec succès.');
    }

    /**
     * Delete invoice
     */
    public function destroy(SalesInvoice $salesInvoice)
    {
        try {
            DB::transaction(function () use ($salesInvoice) {
                foreach ($salesInvoice->items as $item) {
                    $item->product?->increment('stock_quantity', $item->quantity);
                }
                $salesInvoice->items()->delete();
                $salesInvoice->delete();
            });
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->route('sales_invoices.index')
            ->with('success', 'Facture de vente supprimée avec succès.');
    }
}
