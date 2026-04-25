<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use App\Models\Supplier;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers
     */
    public function index(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | GLOBAL STATS (NO FILTERS)
        |--------------------------------------------------------------------------
        */

        $totalSuppliers = Supplier::count();
        $activeSuppliers = Supplier::where('status', 'active')->count();
        $inactiveSuppliers = Supplier::where('status', 'inactive')->count();

        /*
        |--------------------------------------------------------------------------
        | FILTERED / PAGINATED LIST
        |--------------------------------------------------------------------------
        */

        $suppliers = Supplier::query()

            // 🔎 Search
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('telephone', 'like', "%{$search}%");
                });
            })

            // 🟢 Status filter
            ->when($request->status, function ($query, $status) {
                if ($status !== 'all') {
                    $query->where('status', $status);
                }
            })

            // 🔃 Sorting
            ->when($request->sort, function ($query, $sort) {

                $allowedSorts = [
                    'name' => 'nom',
                    'email' => 'email',
                    'city' => 'ville',
                    'status' => 'status',
                ];

                if (str_contains($sort, '_')) {
                    [$field, $direction] = explode('_', $sort);

                    if (isset($allowedSorts[$field]) && in_array($direction, ['asc', 'desc'])) {
                        $query->orderBy($allowedSorts[$field], $direction);

                        return;
                    }
                }

                $query->orderBy('created_at', 'desc');

            }, function ($query) {
                $query->orderBy('created_at', 'desc');
            })

            ->paginate($request->per_page ?? 5)
            ->withQueryString();

        return Inertia::render('suppliers/Index', [
            'suppliers' => $suppliers,

            'globalStats' => [
                'totalSuppliers' => $totalSuppliers,
                'activeSuppliers' => $activeSuppliers,
                'inactiveSuppliers' => $inactiveSuppliers,
            ],

            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
                'sort' => $request->sort ?? '',
                'per_page' => $request->per_page ?? '5',
            ],
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        return Inertia::render('suppliers/Create');
    }

    /**
     * Store new supplier
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'telephone' => 'required|regex:/^[0-9+\-\s]+$/',

            'email' => 'nullable|email|unique:suppliers,email',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string|max:255',
            'pays' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        $validated['status'] = $validated['status'] ?? 'active';

        $supplier = Supplier::create($validated);

        if ($request->header('X-Inertia')) {
            return back()->with('newSupplier', $supplier);
        }

        return redirect()
            ->route('suppliers.index')
            ->with('success', 'Fournisseur créé avec succès.');
    }

    /**
     * Show supplier details
     */
    public function show(Supplier $supplier)
    {
        $supplier->load([
            'purchaseInvoices',
            'purchaseInvoices.payments',
        ]);

        return Inertia::render('suppliers/Show', [
            'supplier' => $supplier,
            'invoices' => $supplier->purchaseInvoices,
            'payments' => $supplier->payments()->with('purchaseInvoice')->get(),
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(Supplier $supplier)
    {
        return Inertia::render('suppliers/Edit', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Update supplier
     */
    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'nullable|email|unique:suppliers,email,'.$supplier->id,
            'telephone' => 'required|regex:/^[0-9+\-\s]+$/',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string',
            'pays' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $supplier->update($validated);

        return redirect()
            ->route('suppliers.index')
            ->with('success', 'Fournisseur mis à jour avec succès.');
    }

    /**
     * Delete supplier
     */
    public function destroy(Supplier $supplier)
    {
        $supplier->delete();

        return redirect()
            ->route('suppliers.index')
            ->with('success', 'Fournisseur supprimé avec succès.');
    }

    /**
     * Bulk delete
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'uuids' => 'required|array',
            'uuids.*' => 'exists:suppliers,uuid',
        ]);

        $deleted = Supplier::whereIn('uuid', $validated['uuids'])->delete();

        return redirect()
            ->route('suppliers.index')
            ->with('success', $deleted.' fournisseur(s) supprimé(s) avec succès.');
    }

    /**
     * Download supplier history as PDF
     */
    public function historyPdf(Request $request, Supplier $supplier)
    {
        $invoicesQuery = $supplier->purchaseInvoices()->with('items')->orderByDesc('invoice_date');
        $paymentsQuery = $supplier->payments()->with(['purchaseInvoice', 'paymentMethod'])->orderByDesc('payment_date');

        if ($request->date_from) {
            $invoicesQuery->where('invoice_date', '>=', $request->date_from);
            $paymentsQuery->where('payment_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $invoicesQuery->where('invoice_date', '<=', $request->date_to);
            $paymentsQuery->where('payment_date', '<=', $request->date_to);
        }
        if ($request->status && $request->status !== 'all') {
            $invoicesQuery->where('status', $request->status);
        }

        $invoices = $invoicesQuery->get()->map(fn($inv) => [
            'code'             => $inv->code,
            'invoice_date'     => $inv->invoice_date,
            'created_at'       => $inv->created_at->format('d/m/Y H:i'),
            'total_amount'     => (float) $inv->total_amount,
            'paid_amount'      => (float) $inv->paid_amount,
            'remaining_amount' => (float) $inv->remaining_amount,
            'status'           => $inv->status,
            'notes'            => $inv->notes,
            'items'            => $inv->items->map(fn($i) => [
                'product_name' => $i->product_name,
                'quantity'     => $i->quantity,
                'unit_price'   => (float) $i->unit_price,
                'total_price'  => (float) $i->total_price,
            ]),
        ]);

        $payments = $paymentsQuery->get()->map(fn($p) => [
            'amount'         => (float) $p->amount,
            'payment_date'   => $p->payment_date,
            'created_at'     => $p->created_at->format('d/m/Y H:i'),
            'reference'      => $p->reference,
            'payment_method' => $p->paymentMethod?->name,
            'notes'          => $p->notes,
            'invoice_code'   => $p->purchaseInvoice?->code,
        ]);

        $totalPurchased = $invoices->sum('total_amount');
        $totalPaid      = $payments->sum('amount');
        $balance        = $totalPurchased - $totalPaid;

        $pdf = Pdf::loadView('suppliers.history_pdf', compact(
            'supplier', 'invoices', 'payments',
            'totalPurchased', 'totalPaid', 'balance'
        ) + ['company' => (CompanyProfile::first() ?? new CompanyProfile())->toArray()])->setPaper('a4', 'portrait');

        return $pdf->download("historique-{$supplier->nom}.pdf");
    }

    /**
     * Export CSV
     */
    public function exportCsv(): StreamedResponse
    {
        $fileName = 'suppliers.csv';

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=$fileName",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate',
            'Expires' => '0',
        ];

        $columns = ['Name', 'Email', 'Phone', 'City', 'Country', 'Status'];

        $callback = function () use ($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            Supplier::chunk(500, function ($suppliers) use ($file) {
                foreach ($suppliers as $supplier) {
                    fputcsv($file, [
                        $supplier->nom,
                        $supplier->email,
                        $supplier->telephone,
                        $supplier->ville,
                        $supplier->pays,
                        $supplier->status,
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
