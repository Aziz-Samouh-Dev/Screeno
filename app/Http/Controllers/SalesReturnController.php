<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use App\Models\SalesInvoice;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SalesReturnController extends Controller
{
    public function index(Request $request)
    {
        $returns = SalesReturn::with(['invoice', 'client'])
            ->when($request->search, function ($query, $search) {
                $query->where('uuid', 'like', "%{$search}%")
                    ->orWhereHas('client', fn ($q) => $q->where('nom', 'like', "%{$search}%"))
                    ->orWhereHas('invoice', fn ($q) => $q->where('code', 'like', "%{$search}%"));
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        return Inertia::render('sales_returns/Index', [
            'returns' => $returns,
            'filters' => [
                'search' => $request->search ?? '',
                'per_page' => $request->per_page ?? '10',
            ],
        ]);
    }

    public function create(Request $request)
    {
        $selectedInvoice = null;
        $returnableItems = [];

        if ($request->sales_invoice_id) {
            $selectedInvoice = SalesInvoice::with('items.product', 'client')
                ->where('uuid', $request->sales_invoice_id)
                ->firstOrFail();

            $returnableItems = $selectedInvoice->getReturnableItems();
        }

        return Inertia::render('sales_returns/Create', [
            'invoices' => SalesInvoice::with('client:id,nom')->select('id', 'uuid', 'code', 'client_id')->latest()->get()->map(fn($inv) => [
                'id'         => $inv->id,
                'uuid'       => $inv->uuid,
                'code'       => $inv->code,
                'client_nom' => $inv->client?->nom,
            ]),
            'selectedInvoice' => $selectedInvoice,
            'returnableItems' => $returnableItems,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sales_invoice_id' => 'required|exists:sales_invoices,uuid',
            'return_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:produits,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            DB::transaction(function () use ($validated) {
                $invoice = SalesInvoice::where('uuid', $validated['sales_invoice_id'])->firstOrFail();

                $return = SalesReturn::create([
                    'sales_invoice_id' => $invoice->id,
                    'client_id'        => $invoice->client_id,
                    'return_date'      => $validated['return_date'],
                    'notes'            => $validated['notes'] ?? null,
                ]);

                foreach ($validated['items'] as $itemData) {
                    $invoiceItem = $invoice->items()->where('product_id', $itemData['product_id'])->firstOrFail();

                    $alreadyReturned = SalesReturnItem::where('product_id', $itemData['product_id'])
                        ->whereHas('salesReturn', fn ($q) => $q->where('sales_invoice_id', $invoice->id))
                        ->sum('quantity');

                    $available = $invoiceItem->quantity - $alreadyReturned;

                    if ($itemData['quantity'] > $available) {
                        throw new \Exception(
                            "Quantité de retour trop élevée pour « {$invoiceItem->product_name} » — max retournable : {$available}, demandé : {$itemData['quantity']}."
                        );
                    }

                    SalesReturnItem::create([
                        'sales_return_id' => $return->id,
                        'product_id'      => $itemData['product_id'],
                        'product_name'    => $invoiceItem->product_name,
                        'unit_price'      => $invoiceItem->unit_price,
                        'quantity'        => $itemData['quantity'],
                        'total_price'     => $invoiceItem->unit_price * $itemData['quantity'],
                    ]);

                    $invoiceItem->product->increment('stock_quantity', $itemData['quantity']);
                }

                $return->calculateTotal();
                $invoice->updateTotals();
            });
        } catch (\Exception $e) {
            return redirect()->back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()->route('sales_returns.index')
            ->with('success', 'Retour de vente créé avec succès.');
    }

    public function downloadPdf(SalesReturn $salesReturn)
    {
        try {
            $salesReturn->load(['items', 'client', 'invoice']);

            $pdf = Pdf::loadView('sales_returns.return_pdf', [
                'salesReturn' => $salesReturn,
                'company'     => (CompanyProfile::first() ?? new CompanyProfile())->toArray(),
            ])->setPaper('a4', 'portrait');

            return $pdf->download("retour-{$salesReturn->uuid}.pdf");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Impossible de générer le PDF : ' . $e->getMessage());
        }
    }

    public function show(SalesReturn $salesReturn)
    {
        $salesReturn->load(['items', 'client', 'invoice']);

        return Inertia::render('sales_returns/Show', [
            'return' => $salesReturn,
        ]);
    }

    public function edit(SalesReturn $salesReturn)
    {
        $salesReturn->load(['items', 'invoice', 'client']);

        return Inertia::render('sales_returns/Edit', [
            'returnData' => $salesReturn,
            'invoices' => SalesInvoice::with('client:id,nom')->select('id', 'uuid', 'code', 'client_id')->latest()->get()->map(fn($inv) => [
                'id'         => $inv->id,
                'uuid'       => $inv->uuid,
                'code'       => $inv->code,
                'client_nom' => $inv->client?->nom,
            ]),
        ]);
    }

    public function update(Request $request, SalesReturn $salesReturn)
    {
        $validated = $request->validate([
            'return_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:produits,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            DB::transaction(function () use ($validated, $salesReturn) {
                $invoice = $salesReturn->invoice;

                foreach ($salesReturn->items as $oldItem) {
                    $oldItem->product->decrement('stock_quantity', $oldItem->quantity);
                }

                $salesReturn->items()->delete();

                $salesReturn->update([
                    'return_date' => $validated['return_date'],
                    'notes'       => $validated['notes'] ?? null,
                ]);

                foreach ($validated['items'] as $itemData) {
                    $invoiceItem = $invoice->items()->where('product_id', $itemData['product_id'])->firstOrFail();

                    $alreadyReturned = SalesReturnItem::where('product_id', $itemData['product_id'])
                        ->whereHas('salesReturn', fn ($q) => $q->where('sales_invoice_id', $invoice->id))
                        ->where('sales_return_id', '!=', $salesReturn->id)
                        ->sum('quantity');

                    $available = $invoiceItem->quantity - $alreadyReturned;

                    if ($itemData['quantity'] > $available) {
                        throw new \Exception(
                            "Quantité de retour trop élevée pour « {$invoiceItem->product_name} » — max retournable : {$available}, demandé : {$itemData['quantity']}."
                        );
                    }

                    SalesReturnItem::create([
                        'sales_return_id' => $salesReturn->id,
                        'product_id'      => $itemData['product_id'],
                        'product_name'    => $invoiceItem->product_name,
                        'unit_price'      => $invoiceItem->unit_price,
                        'quantity'        => $itemData['quantity'],
                        'total_price'     => $invoiceItem->unit_price * $itemData['quantity'],
                    ]);

                    $invoiceItem->product->increment('stock_quantity', $itemData['quantity']);
                }

                $salesReturn->calculateTotal();
                $invoice->updateTotals();
            });
        } catch (\Exception $e) {
            return redirect()->back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()->route('sales_returns.show', $salesReturn)
            ->with('success', 'Retour de vente mis à jour avec succès.');
    }

    public function destroy(SalesReturn $salesReturn)
    {
        try {
            DB::transaction(function () use ($salesReturn) {
                foreach ($salesReturn->items as $item) {
                    $item->product->decrement('stock_quantity', $item->quantity);
                }

                $salesReturn->items()->delete();
                $salesReturn->delete();

                if ($salesReturn->invoice) {
                    $salesReturn->invoice->updateTotals();
                }
            });
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->route('sales_returns.index')
            ->with('success', 'Retour de vente supprimé avec succès.');
    }

    public function getReturnableItemsForInvoice(Request $request, SalesInvoice $invoice)
{
    $excludeReturnId = null;

    if ($request->query('exclude')) {
        $excludeReturn = SalesReturn::where('uuid', $request->query('exclude'))->first();
        $excludeReturnId = $excludeReturn?->id;
    }

    return response()->json($invoice->getReturnableItems($excludeReturnId));
}

}
