'use client';

import { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, RotateCcw, Search, ChevronDown, PackageX, AlertTriangle } from 'lucide-react';

interface ReturnableProduct {
    product_id: number;
    product_name: string;
    total_purchased: number;
    total_returned: number;
    available: number;
    unit_price: number;
}

interface Client {
    uuid: string;
    nom: string;
    telephone?: string;
}

interface ReturnItem {
    product_id: number | null;
    product_name: string;
    available: number;
    unit_price: number;
    quantity: number;
}

interface Props {
    client: Client;
    returnableProducts: ReturnableProduct[];
}

const fmt = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

/* ── Product Combobox (fixed position) ── */

function ReturnCombobox({
    products,
    value,
    onChange,
    disabledIds,
}: {
    products: ReturnableProduct[];
    value: number | null;
    onChange: (p: ReturnableProduct) => void;
    disabledIds: number[];
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handle = (e: MouseEvent) => {
            if (!triggerRef.current?.contains(e.target as Node) && !dropdownRef.current?.contains(e.target as Node)) {
                setOpen(false); setSearch('');
            }
        };
        const onScroll = () => { setOpen(false); setSearch(''); };
        document.addEventListener('mousedown', handle);
        window.addEventListener('scroll', onScroll, true);
        return () => { document.removeEventListener('mousedown', handle); window.removeEventListener('scroll', onScroll, true); };
    }, [open]);

    const openDropdown = () => {
        if (triggerRef.current) {
            const r = triggerRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 320) });
        }
        setOpen(v => !v);
    };

    const filtered = products.filter(p =>
        p.product_name.toLowerCase().includes(search.toLowerCase())
    );
    const selected = products.find(p => p.product_id === value);

    return (
        <div className="relative">
            <button ref={triggerRef} type="button" onClick={openDropdown}
                className="flex h-9 w-full items-center justify-between rounded-lg border border-purple-200 bg-white px-3 text-sm hover:border-purple-300 transition-colors">
                <span className={selected ? 'font-medium text-slate-900 truncate' : 'text-slate-400'}>
                    {selected ? selected.product_name : 'Sélectionner un produit…'}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div ref={dropdownRef}
                    style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
                    className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
                            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher un produit…"
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
                        </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                        {filtered.length > 0 ? filtered.map(p => {
                            const disabled = disabledIds.includes(p.product_id) && value !== p.product_id;
                            return (
                                <button key={p.product_id} type="button" disabled={disabled}
                                    onClick={() => { if (!disabled) { onChange(p); setOpen(false); setSearch(''); } }}
                                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                                        value === p.product_id ? 'bg-purple-50' :
                                        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'
                                    }`}>
                                    <span className="font-medium text-slate-900 text-sm truncate">{p.product_name}</span>
                                    <span className="text-xs font-mono shrink-0 text-purple-600 font-semibold">
                                        {p.available} dispo.
                                    </span>
                                </button>
                            );
                        }) : <p className="px-3 py-4 text-sm text-center text-slate-400">Aucun produit retournable</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Main Component ── */

export default function Return({ client, returnableProducts }: Props) {
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const serverError = props.errors?.return_error;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clients', href: '/clients' },
        { title: client.nom, href: `/clients/${client.uuid}` },
        { title: 'Retour', href: `/clients/${client.uuid}/return` },
    ];

    const [items, setItems] = useState<ReturnItem[]>([
        { product_id: null, product_name: '', available: 0, unit_price: 0, quantity: 1 },
    ]);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const selectedIds = items.map(i => i.product_id).filter(Boolean) as number[];

    const selectProduct = (index: number, p: ReturnableProduct) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, product_id: p.product_id, product_name: p.product_name, available: p.available, unit_price: p.unit_price, quantity: 1 } : item
        ));
    };

    const updateQty = (index: number, qty: number) => {
        setItems(prev => prev.map((item, i) => {
            if (i !== index) return item;
            return { ...item, quantity: Math.min(Math.max(1, qty), item.available || 1) };
        }));
    };

    const addRow = () => setItems(prev => [...prev, { product_id: null, product_name: '', available: 0, unit_price: 0, quantity: 1 }]);
    const removeRow = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

    const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

    const anyEmpty = items.some(i => i.product_id === null);
    const anyOver = items.some(i => i.product_id !== null && i.quantity > i.available);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (anyEmpty || anyOver) return;
        setProcessing(true);
        router.post(`/clients/${client.uuid}/return`, {
            items: items.map(({ product_id, quantity }) => ({ product_id, quantity })),
            notes,
        }, { onFinish: () => setProcessing(false) });
    };

    if (returnableProducts.length === 0) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Retour — ${client.nom}`} />
                <div className="flex flex-col gap-6 p-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.visit(`/clients/${client.uuid}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl font-bold text-slate-900">Retour — {client.nom}</h1>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col items-center gap-3 py-20 text-slate-400">
                        <PackageX className="h-12 w-12 opacity-20" />
                        <p className="font-semibold text-lg">Aucun produit retournable</p>
                        <p className="text-sm">Ce client n'a encore rien acheté ou tout a déjà été retourné.</p>
                        <Button variant="outline" className="rounded-xl mt-2" onClick={() => router.visit(`/clients/${client.uuid}`)}>
                            Retour au client
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Retour — ${client.nom}`} />

            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl"
                        onClick={() => router.visit(`/clients/${client.uuid}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Enregistrer un retour</h1>
                        <p className="text-sm text-slate-400">{client.nom}{client.telephone ? ` · ${client.telephone}` : ''}</p>
                    </div>
                </div>

                {serverError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {serverError}
                    </div>
                )}

                {anyOver && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Quantité demandée dépasse le maximum retournable pour un ou plusieurs produits.
                    </div>
                )}

                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
                    <PackageX className="h-4 w-4 shrink-0" />
                    Les produits retournés seront transférés au stock endommagé — ils ne reviennent pas en stock vendable.
                </div>

                <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-purple-50 text-xs font-bold uppercase text-slate-500 border-b border-purple-100">
                                <tr>
                                    <th className="px-5 py-3 text-left">Produit</th>
                                    <th className="px-5 py-3 w-28 text-center">Max retournable</th>
                                    <th className="px-5 py-3 w-24 text-center">Qté</th>
                                    <th className="px-5 py-3 w-32 text-right">Prix unit. moy.</th>
                                    <th className="px-5 py-3 w-32 text-right">Total</th>
                                    <th className="px-5 py-3 w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((item, index) => {
                                    const overLimit = item.product_id !== null && item.quantity > item.available;
                                    return (
                                        <tr key={index} className={overLimit ? 'bg-red-50' : 'hover:bg-slate-50/50'}>
                                            <td className="px-5 py-2">
                                                <ReturnCombobox
                                                    products={returnableProducts}
                                                    value={item.product_id}
                                                    onChange={p => selectProduct(index, p)}
                                                    disabledIds={selectedIds}
                                                />
                                            </td>
                                            <td className="px-5 py-2 text-center">
                                                {item.product_id ? (
                                                    <span className="inline-block rounded-full px-2 py-0.5 text-xs font-bold font-mono bg-purple-100 text-purple-700">
                                                        {item.available}
                                                    </span>
                                                ) : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="px-5 py-2 text-center">
                                                <div>
                                                    <Input type="number" min={1} max={item.available || undefined}
                                                        value={item.quantity}
                                                        onChange={e => updateQty(index, Number(e.target.value))}
                                                        className={`w-20 mx-auto text-center h-9 ${overLimit ? 'border-red-400' : ''}`} />
                                                    {overLimit && (
                                                        <p className="text-xs text-red-500 mt-0.5">max {item.available}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-2 text-right font-mono text-xs text-slate-600">
                                                {item.unit_price ? fmt(item.unit_price) : '—'}
                                            </td>
                                            <td className="px-5 py-2 text-right font-semibold font-mono text-xs text-purple-700">
                                                {item.unit_price ? fmt(item.quantity * item.unit_price) : '—'}
                                            </td>
                                            <td className="px-5 py-2">
                                                {items.length > 1 && (
                                                    <Button type="button" variant="ghost" size="icon"
                                                        onClick={() => removeRow(index)}
                                                        className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                            <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Cliquez sur « Ajouter » pour commencer.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                        <Button type="button" variant="outline" size="sm" className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
                            disabled={selectedIds.length >= returnableProducts.length}
                            onClick={addRow}>
                            <Plus className="w-3 h-3 mr-1" /> Ajouter un produit
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Notes (optionnel)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                    rows={2} placeholder="Motif du retour, état des produits…"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200" />
                            </div>

                            <div className="bg-purple-50 rounded-2xl p-4 space-y-2">
                                <div className="flex justify-between text-sm text-purple-600">
                                    <span>Total remboursé</span>
                                    <span className="font-mono">{fmt(total)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-purple-900 text-lg border-t border-purple-200 pt-2">
                                    <span>Total</span>
                                    <span className="font-mono">{fmt(total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" className="rounded-xl"
                                onClick={() => router.visit(`/clients/${client.uuid}`)}>Annuler</Button>
                            <Button type="submit"
                                disabled={processing || anyEmpty || anyOver}
                                className="rounded-xl px-6 bg-purple-600 hover:bg-purple-700">
                                <RotateCcw className="w-4 h-4 mr-2" />
                                {processing ? 'Enregistrement…' : 'Confirmer le retour'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
