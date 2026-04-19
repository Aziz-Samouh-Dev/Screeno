'use client';

import { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
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
    Printer,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface InvoiceItem {
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface Invoice {
    uuid: string;
    code: string;
    invoice_date: string;
    created_at?: string | null;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: 'unpaid' | 'partial' | 'paid';
    notes?: string | null;
    items?: InvoiceItem[];
}

interface Payment {
    uuid: string;
    amount: number;
    payment_date: string;
    created_at?: string | null;
    reference?: string | null;
    payment_method?: string | null;
    notes?: string | null;
    sales_invoice?: { uuid: string; code: string } | null;
}

interface ReturnItem {
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface SalesReturn {
    uuid: string;
    return_date: string;
    created_at?: string | null;
    total_amount: number;
    notes?: string | null;
    invoice?: { uuid: string; code: string } | null;
    items?: ReturnItem[];
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

interface Company {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    tax_id?: string;
    ice?: string;
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
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

function fmtDateTime(iso?: string | null) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(s: string) {
    return new Date(s).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function ClientHistory({ client, invoices, payments, salesReturns, stats, filters: serverFilters }: Props) {
    const { company } = usePage().props as { company: Company };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clients', href: '/clients' },
        { title: client.nom, href: `/clients/${client.uuid}` },
        { title: 'Full History', href: `/clients/${client.uuid}/history` },
    ];

    /* ---- local filter state ---- */
    const [typeFilter, setTypeFilter]     = useState<EntryType>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [search, setSearch]             = useState('');
    const [dateFrom, setDateFrom]         = useState(serverFilters.date_from);
    const [dateTo, setDateTo]             = useState(serverFilters.date_to);

    const applyServerFilters = () => {
        router.get(`/clients/${client.uuid}/history`, {
            date_from: dateFrom || undefined,
            date_to:   dateTo   || undefined,
            status:    statusFilter !== 'all' ? statusFilter : undefined,
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setDateFrom(''); setDateTo(''); setStatusFilter('all'); setTypeFilter('all'); setSearch('');
        router.get(`/clients/${client.uuid}/history`, {}, { replace: true });
    };

    const hasActiveFilters = dateFrom || dateTo || statusFilter !== 'all' || typeFilter !== 'all' || search;

    /* ---- unified timeline ---- */
    type HistoryEntry = {
        id: string; ref: string; type: 'invoice' | 'payment' | 'return';
        date: string; createdAt?: string | null; amount: number;
        paid_amount?: number; remaining_amount?: number;
        status: string; method?: string | null; reference?: string | null;
        notes?: string | null; linked_code?: string | null;
    };

    const allEntries = useMemo<HistoryEntry[]>(() => [
        ...invoices.map((inv) => ({
            id: inv.uuid, ref: inv.code, type: 'invoice' as const,
            date: inv.invoice_date, createdAt: inv.created_at,
            amount: Number(inv.total_amount), paid_amount: Number(inv.paid_amount),
            remaining_amount: Number(inv.remaining_amount), status: inv.status, notes: inv.notes,
        })),
        ...payments.map((p) => ({
            id: p.uuid, ref: p.sales_invoice?.code ?? '—', type: 'payment' as const,
            date: p.payment_date, createdAt: p.created_at,
            amount: Number(p.amount), status: 'completed',
            method: p.payment_method, reference: p.reference, notes: p.notes,
            linked_code: p.sales_invoice?.code,
        })),
        ...salesReturns.map((r) => ({
            id: r.uuid, ref: r.invoice?.code ?? '—', type: 'return' as const,
            date: r.return_date, createdAt: r.created_at,
            amount: Number(r.total_amount), status: 'returned', notes: r.notes,
            linked_code: r.invoice?.code,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [invoices, payments, salesReturns]);

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

    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total_amount), 0);
    const totalPaid     = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalReturned = salesReturns.reduce((s, r) => s + Number(r.total_amount), 0);

    /* ----------------------------------------------------------------
       Render
    ---------------------------------------------------------------- */

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${client.nom} — Full History`} />

            {/* ===== PDF TEMPLATE (off-screen, captured by html2pdf) ===== */}
            <div ref={pdfRef} style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', background: 'white' }}
                className="bg-white text-slate-900 text-sm font-sans">
                <div className="p-8 space-y-8">

                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-blue-600 pb-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">CLIENT HISTORY</h1>
                            <p className="text-sm text-slate-500 mt-1">Printed: {new Date().toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' })} at {new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-slate-900">{company?.name || 'My Company'}</p>
                            {company?.address  && <p className="text-xs text-slate-500">{company.address}</p>}
                            {(company?.city || company?.country) && <p className="text-xs text-slate-500">{[company.city, company.country].filter(Boolean).join(', ')}</p>}
                            {company?.phone    && <p className="text-xs text-slate-500">{company.phone}</p>}
                            {company?.tax_id   && <p className="text-xs text-slate-500">IF: {company.tax_id}</p>}
                            {company?.ice      && <p className="text-xs text-slate-500">ICE: {company.ice}</p>}
                        </div>
                    </div>

                    {/* Client info */}
                    <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-lg p-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Client</p>
                            <p className="font-black text-lg">{client.nom}</p>
                            {client.email     && <p className="text-xs text-slate-500">{client.email}</p>}
                            {client.telephone && <p className="text-xs text-slate-500">{client.telephone}</p>}
                            {client.adresse   && <p className="text-xs text-slate-500">{client.adresse}</p>}
                            {client.ville     && <p className="text-xs text-slate-500">{client.ville}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Summary</p>
                            <p className="text-xs text-slate-600">Total Invoiced: <span className="font-bold">{fmt(totalInvoiced)}</span></p>
                            <p className="text-xs text-slate-600">Total Paid: <span className="font-bold text-green-700">{fmt(totalPaid)}</span></p>
                            <p className="text-xs text-slate-600">Total Returned: <span className="font-bold text-purple-700">{fmt(totalReturned)}</span></p>
                            <p className="text-xs font-bold mt-1">Balance Due: <span className={balance > 0 ? 'text-amber-600' : 'text-green-700'}>{fmt(balance)}</span></p>
                        </div>
                    </div>

                    {/* ---- INVOICES ---- */}
                    {invoices.length > 0 && (
                        <div>
                            <h2 className="text-base font-black uppercase tracking-wide text-blue-700 border-b border-blue-200 pb-2 mb-4">
                                Sales Invoices ({invoices.length})
                            </h2>
                            <div className="space-y-5">
                                {invoices.map((inv) => (
                                    <div key={inv.uuid} className="border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="flex justify-between items-center bg-blue-50 px-4 py-2">
                                            <div>
                                                <span className="font-black text-blue-800 font-mono">{inv.code}</span>
                                                <span className="ml-3 text-xs text-slate-500">Date: {fmtDate(inv.invoice_date)}</span>
                                                {inv.created_at && <span className="ml-3 text-xs text-slate-400">Created: {fmtDateTime(inv.created_at)}</span>}
                                            </div>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                inv.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'}`}>
                                                {inv.status}
                                            </span>
                                        </div>
                                        {inv.items && inv.items.length > 0 && (
                                            <table className="w-full text-xs">
                                                <thead className="bg-slate-50">
                                                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wide">
                                                        <th className="px-4 py-1.5 text-left">Product</th>
                                                        <th className="px-4 py-1.5 text-center">Qty</th>
                                                        <th className="px-4 py-1.5 text-right">Unit Price</th>
                                                        <th className="px-4 py-1.5 text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {inv.items.map((item, i) => (
                                                        <tr key={i}>
                                                            <td className="px-4 py-1.5 font-medium">{item.product_name}</td>
                                                            <td className="px-4 py-1.5 text-center">{item.quantity}</td>
                                                            <td className="px-4 py-1.5 text-right font-mono">{fmt(item.unit_price)}</td>
                                                            <td className="px-4 py-1.5 text-right font-mono font-semibold">{fmt(item.total_price)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                        <div className="flex justify-between px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs">
                                            <div className="flex gap-4">
                                                <span className="text-slate-500">Paid: <span className="font-bold text-green-700">{fmt(Number(inv.paid_amount))}</span></span>
                                                <span className="text-slate-500">Remaining: <span className={`font-bold ${Number(inv.remaining_amount) > 0 ? 'text-red-600' : 'text-green-700'}`}>{fmt(Number(inv.remaining_amount))}</span></span>
                                            </div>
                                            <span className="font-bold">Total: {fmt(Number(inv.total_amount))}</span>
                                        </div>
                                        {inv.notes && <p className="px-4 py-1.5 text-xs text-slate-400 italic border-t border-slate-100">{inv.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ---- RETURNS ---- */}
                    {salesReturns.length > 0 && (
                        <div>
                            <h2 className="text-base font-black uppercase tracking-wide text-purple-700 border-b border-purple-200 pb-2 mb-4">
                                Sales Returns ({salesReturns.length})
                            </h2>
                            <div className="space-y-5">
                                {salesReturns.map((ret) => (
                                    <div key={ret.uuid} className="border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="flex justify-between items-center bg-purple-50 px-4 py-2">
                                            <div>
                                                <span className="font-black text-purple-800 font-mono">{ret.uuid.slice(0, 8)}…</span>
                                                {ret.invoice && <span className="ml-3 text-xs text-blue-600 font-mono">Invoice: {ret.invoice.code}</span>}
                                                <span className="ml-3 text-xs text-slate-500">Date: {fmtDate(ret.return_date)}</span>
                                                {ret.created_at && <span className="ml-3 text-xs text-slate-400">Created: {fmtDateTime(ret.created_at)}</span>}
                                            </div>
                                            <span className="text-xs font-bold text-purple-700">{fmt(Number(ret.total_amount))}</span>
                                        </div>
                                        {ret.items && ret.items.length > 0 && (
                                            <table className="w-full text-xs">
                                                <thead className="bg-slate-50">
                                                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wide">
                                                        <th className="px-4 py-1.5 text-left">Product</th>
                                                        <th className="px-4 py-1.5 text-center">Qty</th>
                                                        <th className="px-4 py-1.5 text-right">Unit Price</th>
                                                        <th className="px-4 py-1.5 text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {ret.items.map((item, i) => (
                                                        <tr key={i}>
                                                            <td className="px-4 py-1.5 font-medium">{item.product_name}</td>
                                                            <td className="px-4 py-1.5 text-center">{item.quantity}</td>
                                                            <td className="px-4 py-1.5 text-right font-mono">{fmt(item.unit_price)}</td>
                                                            <td className="px-4 py-1.5 text-right font-mono font-semibold">{fmt(item.total_price)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                        {ret.notes && <p className="px-4 py-1.5 text-xs text-slate-400 italic border-t border-slate-100">{ret.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ---- PAYMENTS ---- */}
                    {payments.length > 0 && (
                        <div>
                            <h2 className="text-base font-black uppercase tracking-wide text-green-700 border-b border-green-200 pb-2 mb-4">
                                Payments ({payments.length})
                            </h2>
                            <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                                <thead className="bg-green-50">
                                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wide">
                                        <th className="px-4 py-2 text-left">Date</th>
                                        <th className="px-4 py-2 text-left">Time</th>
                                        <th className="px-4 py-2 text-left">Invoice</th>
                                        <th className="px-4 py-2 text-left">Method</th>
                                        <th className="px-4 py-2 text-left">Reference</th>
                                        <th className="px-4 py-2 text-left">Notes</th>
                                        <th className="px-4 py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {payments.map((p) => (
                                        <tr key={p.uuid}>
                                            <td className="px-4 py-2">{fmtDate(p.payment_date)}</td>
                                            <td className="px-4 py-2 text-slate-400">{p.created_at ? new Date(p.created_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                            <td className="px-4 py-2 font-mono text-blue-600">{p.sales_invoice?.code ?? '—'}</td>
                                            <td className="px-4 py-2 font-medium">{p.payment_method ?? '—'}</td>
                                            <td className="px-4 py-2 text-slate-500">{p.reference ?? '—'}</td>
                                            <td className="px-4 py-2 text-slate-400 italic">{p.notes ?? '—'}</td>
                                            <td className="px-4 py-2 text-right font-mono font-bold text-green-700">{fmt(Number(p.amount))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-green-50 border-t border-green-200">
                                    <tr>
                                        <td colSpan={6} className="px-4 py-2 font-bold text-right text-slate-600">Total Payments:</td>
                                        <td className="px-4 py-2 text-right font-black text-green-700 font-mono">{fmt(totalPaid)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* ---- Grand totals ---- */}
                    <div className="border-t-2 border-slate-900 pt-4">
                        <div className="flex justify-end">
                            <div className="w-72 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total Invoiced</span>
                                    <span className="font-bold font-mono">{fmt(totalInvoiced)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total Returned</span>
                                    <span className="font-bold font-mono text-purple-700">- {fmt(totalReturned)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total Paid</span>
                                    <span className="font-bold font-mono text-green-700">- {fmt(totalPaid)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-300 pt-1 font-black text-base">
                                    <span>Balance Due</span>
                                    <span className={`font-mono ${balance > 0 ? 'text-red-600' : 'text-green-700'}`}>{fmt(balance)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ===== SCREEN VIEW ===== */}
            <div className="flex flex-col gap-6 p-6">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="link" onClick={() => router.visit(`/clients/${client.uuid}`)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to {client.nom}
                        </Button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <h1 className="text-xl font-bold text-slate-900">{client.nom}</h1>
                            <p className="text-sm text-slate-400">
                                {client.ville ?? ''}{client.email ? ` · ${client.email}` : ''}
                            </p>
                        </div>
                        <Button variant="outline" className="rounded-xl" onClick={handleDownloadPdf}>
                            <Printer className="mr-2 h-4 w-4" /> Télécharger PDF
                        </Button>
                    </div>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
                    <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-xl bg-blue-50 p-2"><TrendingUp className="h-4 w-4 text-blue-500" /></div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Sales</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{fmt(stats.totalSales)}</p>
                        <p className="mt-1 text-xs text-slate-400">{stats.invoiceCount} invoice{stats.invoiceCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="xl:col-span-2 rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-xl bg-white p-2"><CheckCircle2 className="h-4 w-4 text-green-500" /></div>
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Total Paid</p>
                        </div>
                        <p className="text-2xl font-bold text-green-800">{fmt(stats.totalPaid)}</p>
                        <p className="mt-1 text-xs text-green-500">{stats.paymentCount} payment{stats.paymentCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="xl:col-span-1 rounded-3xl border border-purple-100 bg-purple-50 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-xl bg-white p-2"><PackageX className="h-4 w-4 text-purple-500" /></div>
                            <p className="text-xs font-bold text-purple-500 uppercase tracking-wide">Returned</p>
                        </div>
                        <p className="text-xl font-bold text-purple-800">{fmt(stats.totalReturned)}</p>
                        <p className="mt-1 text-xs text-purple-400">{stats.returnCount} return{stats.returnCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="xl:col-span-2 rounded-3xl bg-slate-900 p-5 shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-xl bg-slate-800 p-2"><AlertCircle className="h-4 w-4 text-amber-400" /></div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Balance Due</p>
                        </div>
                        <p className={`text-2xl font-bold ${balance > 0 ? 'text-amber-400' : 'text-green-400'}`}>{fmt(balance)}</p>
                        <p className="mt-1 text-xs text-slate-500">{balance <= 0 ? 'Fully settled' : 'Outstanding'}</p>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-48">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Search</label>
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Reference, method, notes…"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">From</label>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">To</label>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Type</label>
                            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as EntryType)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300">
                                <option value="all">All Types</option>
                                <option value="invoices">Invoices</option>
                                <option value="payments">Payments</option>
                                <option value="returns">Returns</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Status</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300">
                                <option value="all">All Statuses</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
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
                                    <th className="px-6 py-4 text-left">Date / Time</th>
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
                                        <tr key={`${item.type}-${item.id}`}
                                            className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-semibold text-slate-800">{item.ref}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 text-xs">
                                                    {item.type === 'invoice' && <><FileText className="h-4 w-4 text-blue-500" /><span className="font-medium text-blue-700">Invoice</span></>}
                                                    {item.type === 'payment' && <><CreditCard className="h-4 w-4 text-green-500" /><span className="font-medium text-green-700">Payment</span></>}
                                                    {item.type === 'return'  && <><PackageX className="h-4 w-4 text-purple-500" /><span className="font-medium text-purple-700">Return</span></>}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs whitespace-nowrap">
                                                <div className="text-slate-700 font-medium">{fmtDate(item.date)}</div>
                                                {item.createdAt && <div className="text-slate-400">{fmtDateTime(item.createdAt)}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-slate-900">
                                                {item.type === 'payment' ? (
                                                    <span className="text-green-600">+{fmt(item.amount)}</span>
                                                ) : item.type === 'return' ? (
                                                    <span className="text-purple-600">-{fmt(item.amount)}</span>
                                                ) : (
                                                    fmt(item.amount)
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-xs text-green-600">
                                                {item.type === 'invoice' && item.paid_amount !== undefined
                                                    ? fmt(item.paid_amount)
                                                    : item.type === 'payment'
                                                    ? fmt(item.amount)
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-xs">
                                                {item.type === 'invoice' && item.remaining_amount !== undefined ? (
                                                    <span className={item.remaining_amount > 0 ? 'text-red-500 font-semibold' : 'text-green-500'}>
                                                        {fmt(item.remaining_amount)}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {item.type === 'payment' && (
                                                    <div className="space-y-0.5">
                                                        {item.method    && <div className="font-medium text-slate-700">{item.method}</div>}
                                                        {item.reference && <div className="text-slate-400">Ref: {item.reference}</div>}
                                                        {item.linked_code && <div className="text-blue-500 font-mono">{item.linked_code}</div>}
                                                    </div>
                                                )}
                                                {item.type === 'return' && item.linked_code && (
                                                    <span className="font-mono text-blue-500">{item.linked_code}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400 max-w-xs">
                                                <span className="line-clamp-2">{item.notes ?? '—'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.type !== 'payment' ? (
                                                    <button onClick={() => rowClick(item)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
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
