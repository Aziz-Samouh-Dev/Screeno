'use client';

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, TrendingUp, TrendingDown, PackageX, Search, AlertTriangle } from 'lucide-react';

interface OutstandingItem {
    product_id: number;
    product_name: string;
    amount_owed: number;
}

interface PaymentMethod {
    id: number;
    name: string;
    code: string;
}

interface Client {
    uuid: string;
    nom: string;
    telephone?: string;
}

interface Props {
    client: Client;
    balance: number;
    outstandingItems: OutstandingItem[];
    paymentMethods: PaymentMethod[];
}

const fmt = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

export default function Payment({ client, balance, outstandingItems, paymentMethods }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clients', href: '/clients' },
        { title: client.nom, href: `/clients/${client.uuid}` },
        { title: 'Paiement', href: `/clients/${client.uuid}/payment` },
    ];

    const [search, setSearch] = useState('');
    // checked product_ids
    const [checked, setChecked] = useState<Set<number>>(new Set());
    // per-product custom amount (overrides default amount_owed)
    const [amounts, setAmounts] = useState<Record<number, string>>({});
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const filtered = outstandingItems.filter(i =>
        i.product_name.toLowerCase().includes(search.toLowerCase())
    );

    const toggleAll = () => {
        if (filtered.every(i => checked.has(i.product_id))) {
            const next = new Set(checked);
            filtered.forEach(i => next.delete(i.product_id));
            setChecked(next);
        } else {
            setChecked(prev => {
                const next = new Set(prev);
                filtered.forEach(i => {
                    next.add(i.product_id);
                    if (!amounts[i.product_id]) {
                        setAmounts(a => ({ ...a, [i.product_id]: String(i.amount_owed) }));
                    }
                });
                return next;
            });
        }
    };

    const toggle = (id: number, defaultAmt: number) => {
        setChecked(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
                if (!amounts[id]) {
                    setAmounts(a => ({ ...a, [id]: String(defaultAmt) }));
                }
            }
            return next;
        });
    };

    const setAmount = (id: number, val: string) => {
        setAmounts(prev => ({ ...prev, [id]: val }));
    };

    const selectedTotal = outstandingItems
        .filter(i => checked.has(i.product_id))
        .reduce((sum, i) => {
            const v = parseFloat(amounts[i.product_id] ?? String(i.amount_owed));
            return sum + (isNaN(v) ? 0 : v);
        }, 0);

    const canSubmit = checked.size > 0 && selectedTotal > 0 && !processing;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setProcessing(true);

        const payments = outstandingItems
            .filter(i => checked.has(i.product_id))
            .map(i => ({
                product_id:   i.product_id,
                product_name: i.product_name,
                amount:       parseFloat(amounts[i.product_id] ?? String(i.amount_owed)) || i.amount_owed,
            }));

        router.post(`/clients/${client.uuid}/payment`, {
            payments,
            reference,
            notes,
        }, { onFinish: () => setProcessing(false) });
    };

    if (outstandingItems.length === 0) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Paiement — ${client.nom}`} />
                <div className="flex flex-col gap-6 p-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl"
                            onClick={() => router.visit(`/clients/${client.uuid}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl font-bold text-slate-900">Paiement — {client.nom}</h1>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col items-center gap-3 py-20 text-slate-400">
                        <PackageX className="h-12 w-12 opacity-20" />
                        <p className="font-semibold text-lg">Aucun solde à payer</p>
                        <p className="text-sm">Ce client n'a aucune dette en cours.</p>
                        <Button variant="outline" className="rounded-xl mt-2"
                            onClick={() => router.visit(`/clients/${client.uuid}`)}>
                            Retour au client
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Paiement — ${client.nom}`} />

            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl"
                        onClick={() => router.visit(`/clients/${client.uuid}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Enregistrer un paiement</h1>
                        <p className="text-sm text-slate-400">
                            {client.nom}{client.telephone ? ` · ${client.telephone}` : ''}
                        </p>
                    </div>
                </div>

                {/* Balance card */}
                <div className={`rounded-2xl p-5 flex items-center justify-between ${
                    balance > 0 ? 'bg-slate-900' : 'border border-green-200 bg-green-50'
                }`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {balance > 0
                                ? <TrendingUp className="h-4 w-4 text-amber-400" />
                                : <TrendingDown className="h-4 w-4 text-green-500" />}
                            <p className={`text-xs font-bold uppercase tracking-wide ${
                                balance > 0 ? 'text-slate-400' : 'text-green-500'
                            }`}>Solde total à payer</p>
                        </div>
                        <p className={`text-3xl font-bold font-mono ${
                            balance > 0 ? 'text-amber-400' : 'text-green-600'
                        }`}>{fmt(balance)}</p>
                    </div>
                    {balance <= 0 && (
                        <span className="text-xs font-bold text-green-600 bg-green-100 rounded-full px-3 py-1">Soldé</span>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    {/* Products table */}
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Rechercher un produit…"
                                    className="pl-8 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200" />
                            </div>
                            <button type="button" onClick={toggleAll}
                                className="text-xs font-semibold text-green-600 hover:underline whitespace-nowrap">
                                {filtered.every(i => checked.has(i.product_id)) && filtered.length > 0
                                    ? 'Tout décocher' : 'Tout sélectionner'}
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs font-bold uppercase text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-2 w-8" />
                                        <th className="px-5 py-2 text-left">Produit</th>
                                        <th className="px-5 py-2 text-right w-40">Montant dû</th>
                                        <th className="px-5 py-2 text-right w-44">Montant à payer</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm">
                                                Aucun produit trouvé
                                            </td>
                                        </tr>
                                    )}
                                    {filtered.map(item => {
                                        const isChecked = checked.has(item.product_id);
                                        const amt = amounts[item.product_id] ?? String(item.amount_owed);
                                        return (
                                            <tr key={item.product_id}
                                                className={`transition-colors cursor-pointer ${isChecked ? 'bg-green-50/60' : 'hover:bg-slate-50/60'}`}
                                                onClick={() => toggle(item.product_id, item.amount_owed)}>
                                                <td className="px-5 py-3 text-center">
                                                    <input type="checkbox" readOnly checked={isChecked}
                                                        className="h-4 w-4 accent-green-600 pointer-events-none" />
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="font-medium text-slate-900">{item.product_name}</span>
                                                </td>
                                                <td className="px-5 py-3 text-right font-mono text-sm text-amber-700 font-semibold">
                                                    {fmt(item.amount_owed)}
                                                </td>
                                                <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                                                    {isChecked ? (
                                                        <input type="number" min="0.01" step="0.01"
                                                            value={amt}
                                                            onChange={e => setAmount(item.product_id, e.target.value)}
                                                            className="w-36 rounded-lg border border-green-300 bg-white px-2 py-1 text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-green-200"
                                                        />
                                                    ) : (
                                                        <span className="text-slate-300 text-xs">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Reference + Notes + Summary */}
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">

                        {/* Payment method */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                Moyen de paiement
                            </label>
                            {paymentMethods.length === 0 ? (
                                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    Aucun moyen de paiement actif —{' '}
                                    <a href="/settings/payment_methods" className="underline font-semibold">
                                        Configurer dans Paramètres
                                    </a>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {paymentMethods.map(m => (
                                        <button key={m.id} type="button"
                                            onClick={() => setReference(prev => prev === m.name ? '' : m.name)}
                                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                                reference === m.name
                                                    ? 'bg-green-600 text-white border-green-600'
                                                    : 'border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700'
                                            }`}>
                                            {m.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                Notes (optionnel)
                            </label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                rows={2} placeholder="Remarques, numéro de chèque…"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-200" />
                        </div>

                        {/* Summary + submit */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                            <div>
                                {checked.size > 0 ? (
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-slate-500">
                                            {checked.size} produit(s) sélectionné(s)
                                        </p>
                                        <p className="text-xl font-bold font-mono text-green-700">
                                            {fmt(selectedTotal)}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400">Sélectionnez au moins un produit</p>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" className="rounded-xl"
                                    onClick={() => router.visit(`/clients/${client.uuid}`)}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={!canSubmit}
                                    className="rounded-xl px-6 bg-green-600 hover:bg-green-700">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    {processing ? 'Enregistrement…' : 'Confirmer le paiement'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
