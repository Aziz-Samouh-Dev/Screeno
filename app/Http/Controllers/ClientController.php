<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ClientController extends Controller
{
    /**
     * Display a listing of clients
     */
    public function index(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | GLOBAL STATS (NO FILTERS)
        |--------------------------------------------------------------------------
        */

        $totalClients = Client::count();

        $activeClients = Client::where('status', 'active')->count();

        $inactiveClients = Client::where('status', 'inactive')->count();

        /*
        |--------------------------------------------------------------------------
        | FILTERED / PAGINATED LIST
        |--------------------------------------------------------------------------
        */

        $clients = Client::query()

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

        return Inertia::render('clients/Index', [
            'clients' => $clients,

            'globalStats' => [
                'totalClients' => $totalClients,
                'activeClients' => $activeClients,
                'inactiveClients' => $inactiveClients,
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
        return Inertia::render('clients/Create');
    }

    /**
     * Store new client
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:clients,email',
            'telephone' => 'required|string|max:20',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string|max:255',
            'pays' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        Client::create($validated);

        return redirect()
            ->route('clients.index')
            ->with('success', 'Client created successfully.');
    }

    /**
     * Show client details
     */
    public function show(Client $client)
    {
        return Inertia::render('clients/Show', [
            'client' => $client->only(['uuid', 'nom', 'email', 'telephone', 'adresse', 'ville', 'notes', 'status', 'created_at', 'updated_at']),
            'invoices' => $client->salesInvoices()->orderByDesc('invoice_date')->get()->map(fn($inv) => [
                'uuid'             => $inv->uuid,
                'code'             => $inv->code,
                'invoice_date'     => $inv->invoice_date,
                'total_amount'     => $inv->total_amount,
                'paid_amount'      => $inv->paid_amount,
                'remaining_amount' => $inv->remaining_amount,
                'status'           => $inv->status,
            ]),
            'payments' => $client->payments()->with(['salesInvoice', 'paymentMethod'])->orderByDesc('payment_date')->get()->map(fn($p) => [
                'uuid'           => $p->uuid,
                'amount'         => $p->amount,
                'payment_date'   => $p->payment_date,
                'reference'      => $p->reference,
                'payment_method' => $p->paymentMethod?->name,
                'notes'          => $p->notes,
                'sales_invoice'  => $p->salesInvoice ? ['uuid' => $p->salesInvoice->uuid, 'code' => $p->salesInvoice->code] : null,
            ]),
            'salesReturns' => $client->salesReturns()->with('invoice')->orderByDesc('return_date')->get()->map(fn($r) => [
                'uuid'         => $r->uuid,
                'return_date'  => $r->return_date,
                'total_amount' => $r->total_amount,
                'notes'        => $r->notes,
                'invoice'      => $r->invoice ? ['uuid' => $r->invoice->uuid, 'code' => $r->invoice->code] : null,
            ]),
        ]);
    }

    /**
     * Full history page for a client with date/type/status filters
     */
    public function history(Request $request, Client $client)
    {
        $invoicesQuery  = $client->salesInvoices()->orderByDesc('invoice_date');
        $returnsQuery   = $client->salesReturns()->with('invoice')->orderByDesc('return_date');
        $paymentsQuery  = $client->payments()->with(['salesInvoice', 'paymentMethod'])->orderByDesc('payment_date');

        if ($request->date_from) {
            $invoicesQuery->where('invoice_date', '>=', $request->date_from);
            $returnsQuery->where('return_date',   '>=', $request->date_from);
            $paymentsQuery->where('payment_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $invoicesQuery->where('invoice_date', '<=', $request->date_to);
            $returnsQuery->where('return_date',   '<=', $request->date_to);
            $paymentsQuery->where('payment_date', '<=', $request->date_to);
        }
        if ($request->status && $request->status !== 'all') {
            $invoicesQuery->where('status', $request->status);
        }

        // Global stats (unfiltered)
        $allInvoices = $client->salesInvoices()->get();
        $allPayments = $client->payments()->get();
        $allReturns  = $client->salesReturns()->get();

        return Inertia::render('clients/History', [
            'client' => $client->only(['uuid', 'nom', 'email', 'telephone', 'adresse', 'ville', 'status']),
            'invoices' => $invoicesQuery->get()->map(fn($inv) => [
                'uuid'             => $inv->uuid,
                'code'             => $inv->code,
                'invoice_date'     => $inv->invoice_date,
                'total_amount'     => $inv->total_amount,
                'paid_amount'      => $inv->paid_amount,
                'remaining_amount' => $inv->remaining_amount,
                'status'           => $inv->status,
                'notes'            => $inv->notes,
            ]),
            'payments' => $paymentsQuery->get()->map(fn($p) => [
                'uuid'           => $p->uuid,
                'amount'         => $p->amount,
                'payment_date'   => $p->payment_date,
                'reference'      => $p->reference,
                'payment_method' => $p->paymentMethod?->name,
                'notes'          => $p->notes,
                'sales_invoice'  => $p->salesInvoice ? ['uuid' => $p->salesInvoice->uuid, 'code' => $p->salesInvoice->code] : null,
            ]),
            'salesReturns' => $returnsQuery->get()->map(fn($r) => [
                'uuid'         => $r->uuid,
                'return_date'  => $r->return_date,
                'total_amount' => $r->total_amount,
                'notes'        => $r->notes,
                'invoice'      => $r->invoice ? ['uuid' => $r->invoice->uuid, 'code' => $r->invoice->code] : null,
            ]),
            'stats' => [
                'totalSales'    => $allInvoices->sum('total_amount'),
                'totalPaid'     => $allPayments->sum('amount'),
                'totalReturned' => $allReturns->sum('total_amount'),
                'invoiceCount'  => $allInvoices->count(),
                'paymentCount'  => $allPayments->count(),
                'returnCount'   => $allReturns->count(),
            ],
            'filters' => [
                'date_from' => $request->date_from ?? '',
                'date_to'   => $request->date_to   ?? '',
                'status'    => $request->status    ?? 'all',
            ],
        ]);
    }

    /**
     * Show edit form
     */
    public function edit(Client $client)
    {
        return Inertia::render('clients/Edit', [
            'client' => $client,
        ]);
    }

    /**
     * Update client
     */
    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:clients,email,'.$client->id,
            'telephone' => 'nullable|regex:/^[0-9+\-\s]+$/',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string',
            'pays' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $client->update($validated);

        return redirect()
            ->route('clients.index')
            ->with('success', 'Client updated successfully.');
    }

    /**
     * Delete client
     */
    public function destroy(Client $client)
    {
        $client->delete();

        return redirect()
            ->route('clients.index')
            ->with('success', 'Client deleted successfully.');
    }

    /**
     * Bulk delete
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'uuids' => 'required|array',
            'uuids.*' => 'exists:clients,uuid',
        ]);

        $deleted = Client::whereIn('uuid', $validated['uuids'])->delete();

        return redirect()
            ->route('clients.index')
            ->with('success', $deleted.' clients deleted successfully.');
    }

    public function exportCsv(): StreamedResponse
    {
        $fileName = 'clients.csv';

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

            Client::chunk(500, function ($clients) use ($file) {
                foreach ($clients as $client) {
                    fputcsv($file, [
                        $client->nom,
                        $client->email,
                        $client->telephone,
                        $client->ville,
                        $client->pays,
                        $client->status,
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
