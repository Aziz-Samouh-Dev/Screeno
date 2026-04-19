'use client';

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, Edit2, Trash2, FileText, CreditCard,
    CheckCircle2, AlertCircle, TrendingUp, Clock,
    Building2, Mail, Phone, MapPin, Calendar,
    PackageX, History, StickyNote, ExternalLink,
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
    notes?: string | null;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

interface Props {
    client: Client;
    invoices: Invoice[];
    payments: Payment[];
    salesReturns: SalesReturn[];
}

type Filter = 'all' | 'invoices' | 'payments' | 'returns';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => Number(n).toFixed(2) + ' MAD';
const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const statusBadge = (status: string) => {
    const m: Record<string, string> = {
        paid:      'bg-green-50 text-green-700 border border-green-200',
        partial:   'bg-amber-50 text-amber-700 border border-amber-200',
        unpaid:    'bg-red-50 text-red-700 border border-red-200',
        completed: 'bg-green-50 text-green-700 border border-green-200',
        returned:  'bg-purple-50 text-purple-700 border border-purple-200',
    };
    return m[status] ?? 'bg-slate-50 text-slate-600 border border-slate-200';
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function ShowClient({ client, invoices, payments, salesReturns = [] }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clients', href: '/clients' },
        { title: client.nom, href: `/clients/${client.uuid}` },
    ];

    const [filter, setFilter] = useState<Filter>('all');

    /* --- stats --- */
    const totalSales    = invoices.reduce((s, i) => s + Number(i.total_amount), 0);
    const totalPaid     = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalReturned = salesReturns.reduce((s, r) => s + Number(r.total_amount), 0);
    const balance       = totalSales - totalPaid - totalReturned;
    const paidPct       = totalSales > 0 ? Math.min(100, (totalPaid / totalSales) * 100) : 0;

    /* --- unified history --- */
    type Entry = {
        id: string; ref: string; type: 'invoice' | 'payment' | 'return';
        date: string; amount: number; paid?: number; remaining?: number;
        status: string; sub?: string | null; notes?: string | null;
    };

    const history: Entry[] = [
        ...invoices.map(i => ({
            id: i.uuid, ref: i.code, type: 'invoice' as const,
            date: i.invoice_date, amount: Number(i.total_amount),
            paid: Number(i.paid_amount), remaining: Number(i.remaining_amount),
            status: i.status,
        })),
        ...payments.map(p => ({
            id: p.uuid, ref: p.sales_invoice?.code ?? '—', type: 'payment' as const,
            date: p.payment_date, amount: Number(p.amount),
            status: 'completed', sub: p.payment_method ?? p.reference, notes: p.notes,
        })),
        ...salesReturns.map(r => ({
            id: r.uuid, ref: r.invoice?.code ?? '—', type: 'return' as const,
            date: r.return_date, amount: Number(r.total_amount),
            status: 'returned', notes: r.notes,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filtered = filter === 'all' ? history : history.filter(e =>
        (filter === 'invoices' && e.type === 'invoice') ||
        (filter === 'payments' && e.type === 'payment') ||
        (filter === 'returns'  && e.type === 'return')
    );

    const rowClick = (e: Entry) => {
        if (e.type === 'invoice') router.visit(`/sales_invoices/${e.id}`);
        if (e.type === 'return')  router.visit(`/sales_returns/${e.id}`);
    };

    /* ---------------------------------------------------------------- */

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={client.nom} />

            <div className="flex flex-col gap-6 p-6">

                {/* HEADER */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit('/clients')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-lg">
                                {getInitials(client.nom)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-slate-900">{client.nom}</h1>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                                        client.status === 'active'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-red-50 text-red-600 border-red-200'
                                    }`}>{client.status === 'active' ? 'Actif' : 'Inactif'}</span>
                                </div>
                                <p className="text-sm text-slate-400">{client.email ?? client.telephone ?? client.ville ?? 'Aucun contact'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={() => router.visit(`/clients/${client.uuid}/history`)}>
                            <History className="mr-2 h-4 w-4" /> Historique complet
                        </Button>
                        <Button variant="outline" className="rounded-xl" onClick={() => router.visit(`/clients/${client.uuid}/edit`)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Modifier
                        </Button>
                        <Button variant="destructive" className="rounded-xl" onClick={() => {
                            if (confirm('Supprimer ce client ?')) router.delete(`/clients/${client.uuid}`);
                        }}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="rounded-lg bg-blue-50 p-1.5"><TrendingUp className="h-4 w-4 text-blue-500" /></div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Facturé</p>
                        </div>
                        <p className="text-xl font-bold text-slate-900">{fmt(totalSales)}</p>
                        <p className="text-xs text-slate-400 mt-1">{invoices.length} facture{invoices.length !== 1 ? 's' : ''}</p>
                    </div>

                    <div className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="rounded-lg bg-white p-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /></div>
                            <p className="text-xs font-bold text-green-500 uppercase tracking-wide">Encaissé</p>
                        </div>
                        <p className="text-xl font-bold text-green-800">{fmt(totalPaid)}</p>
                        <div className="mt-2 h-1.5 rounded-full bg-green-200">
                            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${paidPct}%` }} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="rounded-lg bg-white p-1.5"><PackageX className="h-4 w-4 text-purple-500" /></div>
                            <p className="text-xs font-bold text-purple-400 uppercase tracking-wide">Retourné</p>
                        </div>
                        <p className="text-xl font-bold text-purple-800">{fmt(totalReturned)}</p>
                        <p className="text-xs text-purple-400 mt-1">{salesReturns.length} retour{salesReturns.length !== 1 ? 's' : ''}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-900 p-5 shadow-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="rounded-lg bg-slate-800 p-1.5"><AlertCircle className="h-4 w-4 text-amber-400" /></div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Solde dû</p>
                        </div>
                        <p className={`text-xl font-bold ${balance > 0 ? 'text-amber-400' : 'text-green-400'}`}>{fmt(balance)}</p>
                        <p className="text-xs text-slate-500 mt-1">{balance <= 0 ? 'Soldé' : 'En attente'}</p>
                    </div>
                </div>

                {/* BODY */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* CLIENT INFO */}
                    <div className="space-y-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-slate-400" /> Coordonnées
                            </h4>
                            <div className="space-y-4">
                                {client.email && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-slate-50 p-1.5 mt-0.5"><Mail className="h-3.5 w-3.5 text-slate-400" /></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">E-mail</p>
                                            <p className="text-sm font-medium text-slate-800">{client.email}</p>
                                        </div>
                                    </div>
                                )}
                                {client.telephone && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-slate-50 p-1.5 mt-0.5"><Phone className="h-3.5 w-3.5 text-slate-400" /></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Téléphone</p>
                                            <p className="text-sm font-medium text-slate-800">{client.telephone}</p>
                                        </div>
                                    </div>
                                )}
                                {(client.adresse || client.ville) && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-slate-50 p-1.5 mt-0.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Adresse</p>
                                            <p className="text-sm font-medium text-slate-800 leading-relaxed">
                                                {[client.adresse, client.ville].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-slate-50 p-1.5 mt-0.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /></div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Client depuis</p>
                                        <p className="text-sm font-medium text-slate-800">
                                            {new Date(client.created_at).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                {client.notes && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-slate-50 p-1.5 mt-0.5"><StickyNote className="h-3.5 w-3.5 text-slate-400" /></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Notes</p>
                                            <p className="text-sm text-slate-600 leading-relaxed">{client.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* HISTORY */}
                    <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="flex items-center gap-2 font-bold text-slate-800">
                                <Clock className="h-4 w-4 text-slate-400" /> Historique récent
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                                    {(['all','invoices','payments','returns'] as Filter[]).map(f => (
                                        <button key={f} onClick={() => setFilter(f)}
                                            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                filter === f ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
                                            }`}
                                        >{{all:'Tout',invoices:'Factures',payments:'Paiements',returns:'Retours'}[f]}</button>
                                    ))}
                                </div>
                                <button onClick={() => router.visit(`/clients/${client.uuid}/history`)}
                                    className="text-xs text-blue-500 hover:underline font-semibold whitespace-nowrap">
                                    Voir tout →
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-400 uppercase border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3 text-left">Référence</th>
                                        <th className="px-5 py-3 text-left">Type</th>
                                        <th className="px-5 py-3 text-left">Date</th>
                                        <th className="px-5 py-3 text-right">Montant</th>
                                        <th className="px-5 py-3 text-left">Statut</th>
                                        <th className="px-5 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                                                Aucun enregistrement
                                            </td>
                                        </tr>
                                    ) : filtered.map(item => (
                                        <tr key={`${item.type}-${item.id}`}
                                            className={`border-t border-slate-50 hover:bg-slate-50/60 transition-colors ${item.type !== 'payment' ? 'cursor-pointer' : ''}`}
                                            onClick={() => rowClick(item)}
                                        >
                                            <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">{item.ref}</td>

                                            <td className="px-5 py-3.5">
                                                <span className="flex items-center gap-1.5 text-xs font-medium">
                                                    {item.type === 'invoice' && <><FileText className="h-3.5 w-3.5 text-blue-500" /><span className="text-blue-700">Facture</span></>}
                                                    {item.type === 'payment' && <><CreditCard className="h-3.5 w-3.5 text-green-500" /><span className="text-green-700">Paiement</span></>}
                                                    {item.type === 'return'  && <><PackageX className="h-3.5 w-3.5 text-purple-500" /><span className="text-purple-700">Retour</span></>}
                                                </span>
                                                {item.sub && <p className="text-xs text-slate-400 mt-0.5 ml-5">{item.sub}</p>}
                                            </td>

                                            <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                                                {new Date(item.date).toLocaleDateString('fr-MA', { day:'2-digit', month:'short', year:'numeric' })}
                                            </td>

                                            <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold">
                                                <span className={
                                                    item.type === 'payment' ? 'text-green-600' :
                                                    item.type === 'return'  ? 'text-purple-600' : 'text-slate-800'
                                                }>
                                                    {item.type === 'payment' ? '+' : item.type === 'return' ? '-' : ''}
                                                    {fmt(item.amount)}
                                                </span>
                                                {item.type === 'invoice' && (item.remaining ?? 0) > 0 && (
                                                    <div className="text-xs text-red-400 font-normal">-{fmt(item.remaining!)} restant</div>
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(item.status)}`}>
                                                    {item.status === 'paid' ? 'Payée' : item.status === 'partial' ? 'Partielle' : item.status === 'unpaid' ? 'Impayée' : item.status === 'completed' ? 'Payé' : 'Retourné'}
                                                </span>
                                            </td>

                                            <td className="px-3 py-3.5">
                                                {item.type !== 'payment' && (
                                                    <ExternalLink className="h-3.5 w-3.5 text-slate-300 hover:text-slate-600 transition-colors" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
