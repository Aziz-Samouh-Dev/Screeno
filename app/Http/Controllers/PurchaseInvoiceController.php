<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use App\Models\PaymentMethod;
use App\Models\Produit;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseInvoiceItem;
use App\Models\Supplier;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseInvoiceController extends Controller
{
    public function downloadPdf(PurchaseInvoice $invoice)
    {
        try {
            $invoice->load(['supplier', 'items', 'payments.paymentMethod']);

            $pdf = Pdf::loadView('purchase_invoices.invoice_pdf', [
                'invoice' => $invoice,
                'company' => (CompanyProfile::first() ?? new CompanyProfile())->toArray(),
            ])->setPaper('a4', 'portrait');

            return $pdf->download("{$invoice->code}.pdf");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Impossible de générer le PDF : ' . $e->getMessage());
        }
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
            'suppliers' => Supplier::select('id', 'nom', 'email', 'telephone')->orderBy('nom')->get(),
            'products'  => Produit::select('id', 'nom', 'purchase_price', 'sale_price', 'stock_quantity')->get(),
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

        try {
            DB::transaction(function () use ($validated) {

                if (! empty($validated['supplier_name'])) {
                    $supplier = Supplier::create([
                        'nom'       => $validated['supplier_name'],
                        'telephone' => $validated['supplier_phone'] ?? null,
                    ]);
                } else {
                    $supplier = Supplier::findOrFail($validated['supplier_id']);
                }

                $invoice = PurchaseInvoice::create([
                    'supplier_id'  => $supplier->id,
                    'invoice_date' => $validated['invoice_date'],
                    'notes'        => $validated['notes'] ?? null,
                ]);

                foreach ($validated['items'] as $item) {
                    if (! empty($item['is_new']) && ! empty($item['product_name'])) {
                        $product = Produit::create([
                            'nom'            => $item['product_name'],
                            'purchase_price' => $item['unit_price'],
                            'sale_price'     => $item['sale_price'] ?? 0,
                            'stock_quantity' => 0,
                        ]);
                    } else {
                        $product = Produit::findOrFail($item['product_id']);
                        if ($product->purchase_price != $item['unit_price']) {
                            $product->update(['purchase_price' => $item['unit_price']]);
                        }
                    }

                    PurchaseInvoiceItem::create([
                        'purchase_invoice_id' => $invoice->id,
                        'product_id'          => $product->id,
                        'product_name'        => $product->nom,
                        'unit_price'          => $item['unit_price'],
                        'quantity'            => $item['quantity'],
                        'total_price'         => $item['unit_price'] * $item['quantity'],
                    ]);

                    $product->increment('stock_quantity', $item['quantity']);
                }

                $invoice->updateTotals();
            });
        } catch (\Exception $e) {
            return redirect()->back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()->route('purchase_invoices.index')
            ->with('success', 'Facture d\'achat créée avec succès.');
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
            'invoice'   => $purchaseInvoice,
            'suppliers' => Supplier::select('id', 'nom', 'email', 'telephone')->orderBy('nom')->get(),
            'products'  => Produit::select('id', 'nom', 'purchase_price', 'sale_price', 'stock_quantity')->get(),
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

        try { DB::transaction(function () use ($validated, $purchase_invoice) {

            foreach ($purchase_invoice->items as $oldItem) {
                $oldItem->product?->decrement('stock_quantity', $oldItem->quantity);
            }

            $purchase_invoice->items()->delete();

            if (! empty($validated['supplier_name'])) {
                $supplier = Supplier::create([
                    'nom'       => $validated['supplier_name'],
                    'telephone' => $validated['supplier_phone'] ?? null,
                ]);
            } else {
                $supplier = Supplier::findOrFail($validated['supplier_id']);
            }

            $purchase_invoice->update([
                'supplier_id'  => $supplier->id,
                'invoice_date' => $validated['invoice_date'],
                'notes'        => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {

                if (! empty($item['is_new']) && ! empty($item['product_name'])) {
                    $product = Produit::create([
                        'nom'            => $item['product_name'],
                        'purchase_price' => $item['unit_price'],
                        'sale_price'     => $item['sale_price'] ?? 0,
                        'stock_quantity' => 0,
                    ]);
                } else {
                    $product = Produit::findOrFail($item['product_id']);
                    if ($product->purchase_price != $item['unit_price']) {
                        $product->update(['purchase_price' => $item['unit_price']]);
                    }

                }

                $purchase_invoice->items()->create([
                    'product_id'   => $product->id,
                    'product_name' => $product->nom,
                    'unit_price'   => $item['unit_price'],
                    'quantity'     => $item['quantity'],
                    'total_price'  => $item['unit_price'] * $item['quantity'],
                ]);

                $product->increment('stock_quantity', $item['quantity']);
            }

            $purchase_invoice->updateTotals();
        }); } catch (\Exception $e) {
            return redirect()->back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()
            ->route('purchase_invoices.index')
            ->with('success', 'Facture d\'achat mise à jour avec succès.');
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
        try {
            DB::transaction(function () use ($purchaseInvoice) {
                foreach ($purchaseInvoice->items()->with('product')->get() as $item) {
                    $item->product?->decrement('stock_quantity', $item->quantity);
                }
                $purchaseInvoice->items()->delete();
                $purchaseInvoice->delete();
            });
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->route('purchase_invoices.index')
            ->with('success', 'Facture d\'achat supprimée avec succès.');
    }
}
