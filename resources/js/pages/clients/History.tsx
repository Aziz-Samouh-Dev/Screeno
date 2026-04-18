'use client';

import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    FileText,
    CreditCard,
    PackageX,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Filter,
    X,
    ReceiptText,
    Banknote,
    RotateCcw,
    ExternalLink,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Invoice {
    uuid: string;
    code: string;
    invoice_date: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: 'unpaid' | 'partial' | 'paid';
    notes?: string | null;
}

interface Payment {
    uuid: string;
    amount: number;
    payment_date: string;
    reference?: string | null;
    payment_method?: string | null;
    notes?: string | null;
    sales_invoice?: { uuid: string; code: string } | null;
}

interface SalesReturn {
    uuid: string;
    return_date: string;
    total_amount: number;
    notes?: string | null;
    invoice?: { uuid: string; code: string } | null;
}

interface Client {
    uuid: string;
    nom: string;
    email?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    ville?: string | null;
    status: 'active' | 'inactive';
}

interface Stats {
    totalSales: number;
    totalPaid: number;
    totalReturned: number;
    invoiceCount: number;
    paymentCount: number;
    returnCount: number;
}

interface Filters {
    date_from: string;
    date_to: string;
    status: string;
}

interface Props {
    client: Client;
    invoices: Invoice[];
    payments: Payment[];
    salesReturns: SalesReturn[];
    stats: Stats;
    filters: Filters;
}

type EntryType = 'all' | 'invoices' | 'payments' | 'returns';
type StatusFilter = 'all' | 'unpaid' | 'partial' | 'paid';

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function ClientHistory({ client, invoices, payments, salesReturns, stats, filters: serverFilters }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clients', href: '/clients' },
        { title: client.nom, href: `/clients/${client.uuid}` },
        { title: 'Full History', href: `/clients/${client.uuid}/history` },
    ];

    /* ---- local filter state (the rest are applied server-side) ---- */
    const [typeFilter, setTypeFilter]     = useState<EntryType>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [search, setSearch]             = useState('');

    /* ---- server-side filter form state ---- */
    const [dateFrom, setDateFrom] = useState(serverFilters.date_from);
    const [dateTo, setDateTo]     = useState(serverFilters.date_to);

    const applyServerFilters = () => {
        router.get(`/clients/${client.uuid}/history`, {
            date_from: dateFrom || undefined,
            date_to:   dateTo   || undefined,
            status:    statusFilter !== 'all' ? statusFilter : undefined,
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setDateFrom('');
        setDateTo('');
        setStatusFilter('all');
        setTypeFilter('all');
        setSearch('');
        router.get(`/clients/${client.uuid}/history`, {}, { replace: true });
    };

    const hasActiveFilters = dateFrom || dateTo || statusFilter !== 'all' || typeFilter !== 'all' || search;

    /* ----------------------------------------------------------------
       Build unified timeline
    ---------------------------------------------------------------- */

    type HistoryEntry = {
        id: string;
        ref: string;
        type: 'invoice' | 'payment' | 'return';
        date: string;
        amount: number;
        paid_amount?: number;
        remaining_amount?: number;
        status: string;
        method?: string | null;
        reference?: string | null;
        notes?: string | null;
        linked_code?: string | null;
    };

    const allEntries = useMemo<HistoryEntry[]>(() => [
        ...invoices.map((inv) => ({
            id:               inv.uuid,
            ref:              inv.code,
            type:             'invoice' as const,
            date:             inv.invoice_date,
            amount:           Number(inv.total_amount),
            paid_amount:      Number(inv.paid_amount),
            remaining_amount: Number(inv.remaining_amount),
            status:           inv.status,
            notes:            inv.notes,
        })),
        ...payments.map((p) => ({
            id:          p.uuid,
            ref:         p.sales_invoice?.code ?? '—',
            type:        'payment' as const,
            date:        p.payment_date,
            amount:      Number(p.amount),
            status:      'completed',
            method:      p.payment_method,
            reference:   p.reference,
            notes:       p.notes,
            linked_code: p.sales_invoice?.code,
        })),
        ...salesReturns.map((r) => ({
            id:          r.uuid,
            ref:         r.invoice?.code ?? '—',
            type:        'return' as const,
            date:        r.return_date,
            amount:      Number(r.total_amount),
            status:      'returned',
            notes:       r.notes,
            linked_code: r.invoice?.code,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [invoices, payments, salesReturns]);

    /* ---- client-side filtering ---- */
    const filtered = useMemo(() => allEntries.filter((e) => {
        if (typeFilter !== 'all') {
            if (typeFilter === 'invoices' && e.type !== 'invoice') return false;
            if (typeFilter === 'payments' && e.type !== 'payment') return false;
            if (typeFilter === 'returns'  && e.type !== 'return')  return false;
        }
        if (statusFilter !== 'all' && e.type === 'invoice' && e.status !== statusFilter) return false;
        if (search) {
            const s = search.toLowerCase();
            if (!e.ref.toLowerCase().includes(s) && !(e.notes ?? '').toLowerCase().includes(s) && !(e.method ?? '').toLowerCase().includes(s)) return false;
        }
        return true;
    }), [allEntries, typeFilter, statusFilter, search]);

    /* ----------------------------------------------------------------
       Helpers
    ---------------------------------------------------------------- */

    const fmt = (n: number) => n.toFixed(2) + ' MAD';

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            paid:      'bg-green-50 text-green-700 border border-green-200',
            partial:   'bg-amber-50 text-amber-700 border border-amber-200',
            unpaid:    'bg-red-50 text-red-700 border border-red-200',
            completed: 'bg-green-50 text-green-700 border border-green-200',
            returned:  'bg-purple-50 text-purple-700 border border-purple-200',
        };
        return map[status] ?? 'bg-slate-50 text-slate-600';
    };

    const balance = stats.totalSales - stats.totalPaid - stats.totalReturned;

    const rowClick = (item: HistoryEntry) => {
        if (item.type === 'invoice') router.visit(`/sales_invoices/${item.id}`);
        if (item.type === 'return')  router.visit(`/sales_returns/${item.id}`);
    };

    /* ----------------------------------------------------------------
       Render
    ---------------------------------------------------------------- */

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${client.nom} — Full History`} />

            <div className="flex flex-col gap-6 p-6">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="link" onClick={() => router.visit(`/clients/${client.uuid}`)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to {client.nom}
                        </Button>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{client.nom}</h1>
                        <p className="text-sm text-slate-400">
                            {client.ville ?? ''}{client.email ? ` · ${client.email}` : ''}
                        </p>
                    </div>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
                    {/* Total Sales */}
                    <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-xl bg-blue-50 p-2">
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Sales</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{fmt(stats.totalSales)}</p>
                        <p className="mt-1 text-xs text-slate-400">{stats.invoiceCount} invoice{stats.invoiceCount !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Total Paid */}
                    <div className="xl:col-span-2 rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-xl bg-white p-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Total Paid</p>
                        </div>
                        <p className="text-2xl font-bold text-green-800">{fmt(stats.totalPaid)}</p>
                        <p className="mt-1 text-xs text-green-500">{stats.paymentCount} payment{stats.paymentCount !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Total Returned */}
                    <div className="xl:col-span-1 rounded-3xl border border-purple-100 bg-purple-50 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-xl bg-white p-2">
                                <PackageX className="h-4 w-4 text-purple-500" />
                            </div>
                            <p className="text-xs font-bold text-purple-500 uppercase tracking-wide">Returned</p>
                        </div>
                        <p className="text-xl font-bold text-purple-800">{fmt(stats.totalReturned)}</p>
                        <p className="mt-1 text-xs text-purple-400">{stats.returnCount} return{stats.returnCount !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Balance */}
                    <div className="xl:col-span-2 rounded-3xl bg-slate-900 p-5 shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-xl bg-slate-800 p-2">
                                <AlertCircle className="h-4 w-4 text-amber-400" />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Balance Due</p>
                        </div>
                        <p className={`text-2xl font-bold ${balance > 0 ? 'text-amber-400' : 'text-green-400'}`}>{fmt(balance)}</p>
                        <p className="mt-1 text-xs text-slate-500">{balance <= 0 ? 'Fully settled' : 'Outstanding'}</p>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-end gap-4">
                        {/* Search */}
                        <div className="flex-1 min-w-48">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Search</label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Reference, method, notes…"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">From</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">To</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Type</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as EntryType)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                                <option value="all">All Types</option>
                                <option value="invoices">Invoices</option>
                                <option value="payments">Payments</option>
                                <option value="returns">Returns</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                                <option value="all">All Statuses</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                            <Button onClick={applyServerFilters} className="rounded-xl">
                                <Filter className="mr-2 h-4 w-4" /> Apply
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={clearFilters} className="rounded-xl">
                                    <X className="mr-2 h-4 w-4" /> Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* SUMMARY COUNTS */}
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="font-semibold text-slate-800">{filtered.length} entries</span>
                    {typeFilter === 'all' && (
                        <>
                            <span className="flex items-center gap-1"><ReceiptText className="h-3.5 w-3.5 text-blue-500" /> {filtered.filter(e => e.type === 'invoice').length} invoices</span>
                            <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5 text-green-500" /> {filtered.filter(e => e.type === 'payment').length} payments</span>
                            <span className="flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5 text-purple-500" /> {filtered.filter(e => e.type === 'return').length} returns</span>
                        </>
                    )}
                </div>

                {/* HISTORY TABLE */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left">Reference</th>
                                    <th className="px-6 py-4 text-left">Type</th>
                                    <th className="px-6 py-4 text-left">Date</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4 text-right">Paid</th>
                                    <th className="px-6 py-4 text-right">Remaining</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                    <th className="px-6 py-4 text-left">Method / Info</th>
                                    <th className="px-6 py-4 text-left">Notes</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Filter className="h-8 w-8 opacity-30" />
                                                <p className="font-medium">No records match your filters</p>
                                                <button onClick={clearFilters} className="text-xs text-blue-500 hover:underline">Clear filters</button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((item) => (
                                        <tr
                                            key={`${item.type}-${item.id}`}
                                            className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors"
                                        >
                                            {/* Reference */}
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-semibold text-slate-800">{item.ref}</span>
                                            </td>

                                            {/* Type */}
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 text-xs">
                                                    {item.type === 'invoice' && <><FileText className="h-4 w-4 text-blue-500" /><span className="font-medium text-blue-700">Invoice</span></>}
                                                    {item.type === 'payment' && <><CreditCard className="h-4 w-4 text-green-500" /><span className="font-medium text-green-700">Payment</span></>}
                                                    {item.type === 'return'  && <><PackageX className="h-4 w-4 text-purple-500" /><span className="font-medium text-purple-700">Return</span></>}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                                                {new Date(item.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>

                                            {/* Total */}
                                            <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-slate-900">
                                                {item.type === 'payment' ? (
                                                    <span className="text-green-600">+{fmt(item.amount)}</span>
                                                ) : item.type === 'return' ? (
                                                    <span className="text-purple-600">-{fmt(item.amount)}</span>
                                                ) : (
                                                    fmt(item.amount)
                                                )}
                                            </td>

                                            {/* Paid */}
                                            <td className="px-6 py-4 text-right font-mono text-xs text-green-600">
                                                {item.type === 'invoice' && item.paid_amount !== undefined
                                                    ? fmt(item.paid_amount)
                                                    : item.type === 'payment'
                                                    ? fmt(item.amount)
                                                    : '—'}
                                            </td>

                                            {/* Remaining */}
                                            <td className="px-6 py-4 text-right font-mono text-xs">
                                                {item.type === 'invoice' && item.remaining_amount !== undefined ? (
                                                    <span className={item.remaining_amount > 0 ? 'text-red-500 font-semibold' : 'text-green-500'}>
                                                        {fmt(item.remaining_amount)}
                                                    </span>
                                                ) : '—'}
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            {/* Method / Info */}
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {item.type === 'payment' && (
                                                    <div className="space-y-0.5">
                                                        {item.method && <div className="font-medium text-slate-700">{item.method}</div>}
                                                        {item.reference && <div className="text-slate-400">Ref: {item.reference}</div>}
                                                        {item.linked_code && <div className="text-blue-500 font-mono">{item.linked_code}</div>}
                                                    </div>
                                                )}
                                                {item.type === 'return' && item.linked_code && (
                                                    <span className="font-mono text-blue-500">{item.linked_code}</span>
                                                )}
                                            </td>

                                            {/* Notes */}
                                            <td className="px-6 py-4 text-xs text-slate-400 max-w-xs">
                                                <span className="line-clamp-2">{item.notes ?? '—'}</span>
                                            </td>

                                            {/* Action */}
                                            <td className="px-6 py-4 text-center">
                                                {item.type !== 'payment' ? (
                                                    <button
                                                        onClick={() => rowClick(item)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                                                    >
                                                        <ExternalLink className="h-3 w-3" /> View
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-300 text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer summary */}
                    {filtered.length > 0 && (
                        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-wrap gap-6 text-sm">
                            <div>
                                <span className="text-slate-400 mr-2">Invoiced:</span>
                                <span className="font-bold text-slate-800">
                                    {fmt(filtered.filter(e => e.type === 'invoice').reduce((s, e) => s + e.amount, 0))}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 mr-2">Collected:</span>
                                <span className="font-bold text-green-700">
                                    {fmt(filtered.filter(e => e.type === 'payment').reduce((s, e) => s + e.amount, 0))}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 mr-2">Returned:</span>
                                <span className="font-bold text-purple-700">
                                    {fmt(filtered.filter(e => e.type === 'return').reduce((s, e) => s + e.amount, 0))}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
