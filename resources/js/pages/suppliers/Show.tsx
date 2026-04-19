'use client';

import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
    Info,
    ClockIcon,
    ArrowLeft,
    Edit2,
    Trash2,
    Check,
    FileText,
    CreditCard,
    FileDown,
    CheckCircle2,
    AlertCircle,
    Clock,
    Building2,
    Mail,
    Phone,
    MapPin,
    Calendar,
} from 'lucide-react';
import { useState } from 'react';

interface Invoice {
    uuid: string;
    code: string;
    invoice_date: string;
    total_amount: number;
    status: 'unpaid' | 'partial' | 'paid';
}

interface Payment {
    uuid: string;
    amount: number;
    payment_date: string;
    purchase_invoice?: {
        uuid: string;
        code: string;
    };
}

interface Supplier {
    uuid: string;
    nom: string;
    email?: string | null;
    telephone: string ;
    adresse?: string | null;
    ville?: string | null;
    notes?: string | null;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

interface Props {
    supplier: Supplier;
    invoices: Invoice[];
    payments: Payment[];
}

export default function ShowSupplier({ supplier, invoices, payments }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Fournisseurs', href: '/suppliers' },
        { title: supplier.nom, href: `/suppliers/${supplier.uuid}` },
    ];

    /* ---------------- FINANCIAL STATS ---------------- */

    const totalPurchased = invoices.reduce(
        (sum, inv) => sum + Number(inv.total_amount),
        0,
    );

    const totalPaid = payments.reduce(
        (sum, pay) => sum + Number(pay.amount),
        0,
    );

    const balance = totalPurchased - totalPaid;

    /* ---------------- HISTORY ---------------- */

    const history = [
        ...invoices.map((inv) => ({
            id: inv.uuid,
            ref: inv.code,
            type: 'invoice',
            date: inv.invoice_date,
            amount: inv.total_amount,
            status: inv.status,
        })),
        ...payments.map((pay) => ({
            id: pay.uuid,
            ref: pay.purchase_invoice?.code ?? '-',
            type: 'payment',
            date: pay.payment_date,
            amount: pay.amount,
            status: 'completed',
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={supplier.nom} />

            <div className="flex flex-col gap-6 p-6">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="link"
                        onClick={() => router.visit('/suppliers')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour aux fournisseurs
                    </Button>

                    <div className="flex space-x-3">
                        <Button
                            variant="ghost"
                            onClick={() =>
                                router.visit(`/suppliers/${supplier.uuid}/edit`)
                            }
                        >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Modifier
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (confirm('Supprimer ce fournisseur ?')) {
                                    router.delete(
                                        `/suppliers/${supplier.uuid}`,
                                    );
                                }
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </Button>
                    </div>
                </div>

                {/* FINANCIAL STATS */}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-start justify-between">
                            <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Total achats
                            </p>
                            <div className="rounded-lg bg-slate-50 p-2">
                                <FileDown className="h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {totalPurchased.toFixed(2)} MAD{' '}
                        </h3>
                        <p className="mt-2 text-xs text-slate-400">
                            Achats cumulés
                        </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-start justify-between">
                            <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Total payé
                            </p>
                            <div className="rounded-lg bg-green-50 p-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {totalPaid.toFixed(2)} MAD
                        </h3>
                        <p className="mt-2 text-xs font-medium text-green-600">
                            Montants versés
                        </p>
                    </div>

                    <div className="rounded-3xl bg-slate-900 p-6 shadow-xl">
                        <div className="mb-4 flex items-start justify-between">
                            <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                Solde dû
                            </p>
                            <div className="rounded-lg bg-slate-800 p-2">
                                <AlertCircle className="h-4 w-4 text-amber-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white">
                            {balance.toFixed(2)} MAD
                        </h3>
                        <p className="mt-2 text-xs text-slate-400">
                            Paiements en attente
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* SUPPLIER INFO */}

                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                            <h4 className="font-bold text-slate-900 mb-6 flex items-center">
                                <Building2 className="w-4 h-4 mr-2" /> Informations fournisseur
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Téléphone</p>
                                        <p className="text-sm text-slate-900 font-medium">{supplier.telephone ?? 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">E-mail</p>
                                        <p className="text-sm text-slate-900 font-medium">{supplier.email ?? 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Adresse</p>
                                        <p className="text-sm text-slate-900 font-medium leading-relaxed">{supplier.adresse ?? 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Fournisseur depuis</p>
                                        <p className="text-sm text-slate-900 font-medium">{supplier.created_at}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* HISTORY TABLE */}

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <h3 className="flex items-center font-bold text-slate-900">
                                <Clock className="mr-2 h-4 w-4" /> Historique financier
                            </h3>
                            <div className="flex items-center space-x-2">
                                <button className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-900">
                                    Tout
                                </button>
                                <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-900">
                                    Achats
                                </button>
                                <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-900">
                                    Paiements
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            Référence
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-right">
                                            Montant
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            Statut
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="cursor-pointer border-t hover:bg-slate-50"
                                            onClick={() => {
                                                if (item.type === 'invoice') {
                                                    router.visit(
                                                        `/purchase_invoices/${item.id}`,
                                                    );
                                                }
                                            }}
                                        >
                                            <td className="px-6 py-4 font-mono">
                                                {item.ref}
                                            </td>

                                            <td className="flex items-center gap-2 px-6 py-4">
                                                {item.type === 'invoice' ? (
                                                    <>
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                        Facture
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard className="h-4 w-4 text-green-600" />
                                                        Paiement
                                                    </>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {new Date(
                                                    item.date,
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="px-6 py-4 text-right font-bold">
                                                {item.type === 'payment' ? '-' : ''}
                                                {Number(item.amount).toFixed(2)} MAD
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === 'paid'
                                                            ? 'bg-green-50 text-green-700'
                                                            : item.status ===
                                                                'partial'
                                                                ? 'bg-amber-50 text-amber-700'
                                                                : item.status ===
                                                                    'unpaid'
                                                                    ? 'bg-red-50 text-red-700'
                                                                    : 'bg-green-50 text-green-700'
                                                        }`}
                                                >
                                                    {item.status === 'paid' ? 'Payée' : item.status === 'partial' ? 'Partielle' : item.status === 'unpaid' ? 'Impayée' : 'Payé'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t border-slate-100 bg-slate-50 p-4 text-center">
                            <button className="text-xs font-bold text-slate-500 transition-colors hover:text-slate-900">
                                Charger plus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
