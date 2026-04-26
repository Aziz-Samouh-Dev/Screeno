'use client';

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { CreditCard, Search, Filter, X, ExternalLink } from 'lucide-react';

interface PaymentRecord {
    uuid: string;
    client_uuid: string;
    client_nom: string;
    product_name: string | null;
    total_price: number;
    notes: string | null;
    created_at: string;
}

interface PaginatedPayments {
    data: PaymentRecord[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    payments: PaginatedPayments;
    total: number;
    filters: { date_from: string; date_to: string; search: string };
}

const fmt = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

function fmtDT(iso: string) {
    const d = new Date(iso);
    const dd  = String(d.getDate()).padStart(2, '0');
    const mm  = String(d.getMonth() + 1).padStart(2, '0');
    const yy  = d.getFullYear();
    const hh  = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Paiements', href: '/payments' },
];

export default function Payments({ payments, total, filters: sf }: Props) {
    const [search,   setSearch]   = useState(sf.search);
    const [dateFrom, setDateFrom] = useState(sf.date_from);
    const [dateTo,   setDateTo]   = useState(sf.date_to);

    const apply = () => {
        router.get('/payments', {
            search:    search    || undefined,
            date_from: dateFrom  || undefined,
            date_to:   dateTo    || undefined,
        }, { replace: true });
    };

    const clear = () => {
        setSearch(''); setDateFrom(''); setDateTo('');
        router.get('/payments', {}, { replace: true });
    };

    const hasFilters = search || dateFrom || dateTo;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paiements" />

            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Paiements clients</h1>
                        <p className="text-sm text-slate-400">{payments.total} paiement(s) enregistré(s)</p>
                    </div>
                    <div className="rounded-2xl bg-green-50 border border-green-200 px-5 py-3 text-right">
                        <p className="text-xs font-bold text-green-500 uppercase tracking-wide mb-0.5">Total encaissé</p>
                        <p className="text-xl font-bold font-mono text-green-800">{fmt(total)}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-end gap-3 flex-wrap rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <div className="flex-1 min-w-48">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Recherche</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && apply()}
                                placeholder="Client, produit…"
                                className="pl-9 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Du</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Au</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                    </div>
                    <Button size="sm" className="rounded-xl" onClick={apply}>
                        <Filter className="h-3.5 w-3.5 mr-1" /> Filtrer
                    </Button>
                    {hasFilters && (
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={clear}>
                            <X className="h-3.5 w-3.5 mr-1" /> Réinitialiser
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3 text-left">Date &amp; Heure</th>
                                    <th className="px-5 py-3 text-left">Client</th>
                                    <th className="px-5 py-3 text-left">Produit / Libellé</th>
                                    <th className="px-5 py-3 text-left">Notes</th>
                                    <th className="px-5 py-3 text-right w-36">Montant</th>
                                    <th className="px-5 py-3 w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                                            <CreditCard className="w-10 h-10 mx-auto opacity-20 mb-2" />
                                            <p>Aucun paiement trouvé</p>
                                        </td>
                                    </tr>
                                ) : payments.data.map((p, idx) => (
                                    <tr key={p.uuid}
                                        className={`hover:bg-slate-50/60 transition-colors ${idx % 2 !== 0 ? 'bg-slate-50/30' : ''}`}>
                                        <td className="px-5 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                                            {fmtDT(p.created_at)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <button type="button"
                                                onClick={() => router.visit(`/clients/${p.client_uuid}/ledger`)}
                                                className="font-medium text-slate-800 hover:text-green-700 hover:underline text-left">
                                                {p.client_nom}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3 text-slate-700">{p.product_name ?? '—'}</td>
                                        <td className="px-5 py-3 text-xs text-slate-400 max-w-xs">
                                            <span className="line-clamp-1">{p.notes ?? '—'}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono font-semibold text-green-700">
                                            +{fmt(p.total_price)}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <button type="button"
                                                onClick={() => router.visit(`/clients/${p.client_uuid}/ledger`)}
                                                className="text-slate-400 hover:text-slate-700 transition-colors">
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {payments.last_page > 1 && (
                        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex items-center gap-1">
                            {payments.links.map((link, i) => (
                                <button key={i} disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                    className={`min-w-8 h-8 rounded-lg text-xs font-semibold transition-colors px-2 ${
                                        link.active
                                            ? 'bg-green-600 text-white'
                                            : link.url
                                            ? 'text-slate-600 hover:bg-slate-100'
                                            : 'text-slate-300 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
