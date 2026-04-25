"use client";
import { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2, PackageX, AlertCircle, ChevronDown, Search } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Invoice {
    id: number;
    uuid: string;
    code: string;
    client_nom?: string;
}

interface ReturnableItem {
    product_id: number;
    product_name: string;
    unit_price: number;
    available_quantity: number;
}

interface FormItem {
    product_id: number;
    product_name: string;
    unit_price: number;
    available_quantity: number;
    quantity: number;
}

interface DefaultValues {
    sales_invoice_id: string | null;
    return_date: string;
    return_uuid?: string;
    items: FormItem[];
    notes: string;
}

interface Props {
    invoices: Invoice[];
    defaultValues: DefaultValues;
    onSubmit: (data: any) => void;
    isEdit: boolean;
    processing: boolean;
}

/* ------------------------------------------------------------------ */
/*  Invoice Combobox                                                    */
/* ------------------------------------------------------------------ */

function InvoiceCombobox({
    invoices,
    value,
    onChange,
}: {
    invoices: Invoice[];
    value: string;
    onChange: (uuid: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    const filtered = invoices.filter(inv =>
        inv.code.toLowerCase().includes(search.toLowerCase()) ||
        inv.client_nom?.toLowerCase().includes(search.toLowerCase())
    );

    const selected = invoices.find(i => i.uuid === value);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:border-slate-300 transition-colors"
            >
                <div className="flex flex-col items-start min-w-0 flex-1">
                    {selected ? (
                        <>
                            <span className="font-semibold text-slate-900 font-mono leading-tight">{selected.code}</span>
                            {selected.client_nom && (
                                <span className="text-xs text-slate-400 leading-tight">{selected.client_nom}</span>
                            )}
                        </>
                    ) : (
                        <span className="text-slate-400">Sélectionner une facture...</span>
                    )}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
                            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher par code ou client..."
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length > 0 ? filtered.map(inv => (
                            <button
                                key={inv.uuid}
                                type="button"
                                className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 flex flex-col gap-0.5 transition-colors ${value === inv.uuid ? 'bg-blue-50' : ''}`}
                                onClick={() => { onChange(inv.uuid); setOpen(false); setSearch(''); }}
                            >
                                <span className="font-semibold text-slate-900 text-sm font-mono">{inv.code}</span>
                                {inv.client_nom && <span className="text-xs text-slate-400">{inv.client_nom}</span>}
                            </button>
                        )) : (
                            <p className="px-3 py-4 text-sm text-center text-slate-400">Aucun résultat</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function SalesReturnForm({
    invoices,
    defaultValues,
    onSubmit,
    isEdit,
    processing,
}: Props) {
    const [invoiceId, setInvoiceId]             = useState<string>(defaultValues.sales_invoice_id ?? "");
    const [returnDate, setReturnDate]           = useState(defaultValues.return_date);
    const [notes, setNotes]                     = useState(defaultValues.notes);
    const [items, setItems]                     = useState<FormItem[]>(defaultValues.items ?? []);
    const [returnableItems, setReturnableItems] = useState<ReturnableItem[]>([]);
    const [loadingItems, setLoadingItems]       = useState(false);
    const [invoiceError, setInvoiceError]       = useState<string | null>(null);
    const [errors, setErrors]                   = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isEdit || !defaultValues.sales_invoice_id) return;

        const load = async () => {
            setLoadingItems(true);
            try {
                const exclude = defaultValues.return_uuid
                    ? `?exclude=${defaultValues.return_uuid}`
                    : "";

                const res = await fetch(
                    `/sales_returns/returnable-items/${defaultValues.sales_invoice_id}${exclude}`
                );
                if (!res.ok) throw new Error("server error");

                const serverItems: ReturnableItem[] = await res.json();

                const serverMap: Record<number, ReturnableItem> = {};
                serverItems.forEach((s) => { serverMap[s.product_id] = s; });

                const allReturnable: ReturnableItem[] = [
                    ...serverItems,
                    ...defaultValues.items
                        .filter((i) => !serverMap[i.product_id])
                        .map((i) => ({
                            product_id: i.product_id,
                            product_name: i.product_name,
                            unit_price: i.unit_price,
                            available_quantity: i.quantity,
                        })),
                ];

                setReturnableItems(allReturnable);

                setItems((prev) =>
                    prev.map((item) => ({
                        ...item,
                        available_quantity: serverMap[item.product_id]
                            ? serverMap[item.product_id].available_quantity
                            : item.quantity,
                    }))
                );
            } catch {
                const fallback = defaultValues.items.map((i) => ({
                    product_id: i.product_id,
                    product_name: i.product_name,
                    unit_price: i.unit_price,
                    available_quantity: i.quantity,
                }));
                setReturnableItems(fallback);
                setItems((prev) =>
                    prev.map((item) => ({
                        ...item,
                        available_quantity:
                            defaultValues.items.find((d) => d.product_id === item.product_id)
                                ?.quantity ?? item.quantity,
                    }))
                );
            } finally {
                setLoadingItems(false);
            }
        };

        load();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleInvoiceChange = async (uuid: string) => {
        setInvoiceId(uuid);
        setItems([]);
        setReturnableItems([]);
        setInvoiceError(null);
        if (!uuid) return;

        setLoadingItems(true);
        try {
            const res = await fetch(`/sales_returns/returnable-items/${uuid}`);
            if (!res.ok) throw new Error();
            const data: ReturnableItem[] = await res.json();
            if (!data.length) {
                setInvoiceError("Tous les articles de cette facture ont déjà été retournés.");
            }
            setReturnableItems(data);
        } catch {
            setInvoiceError("Impossible de charger les articles. Veuillez réessayer.");
        } finally {
            setLoadingItems(false);
        }
    };

    const addItem = (productId: number) => {
        const source = returnableItems.find((r) => r.product_id === productId);
        if (!source || items.some((i) => i.product_id === productId)) return;
        setItems((prev) => [
            ...prev,
            {
                product_id:         source.product_id,
                product_name:       source.product_name,
                unit_price:         source.unit_price,
                available_quantity: source.available_quantity,
                quantity:           1,
            },
        ]);
    };

    const updateQty = (productId: number, raw: number) => {
        setItems((prev) =>
            prev.map((i) => {
                if (i.product_id !== productId) return i;
                return { ...i, quantity: Math.min(Math.max(1, raw), i.available_quantity) };
            })
        );
    };

    const removeItem = (productId: number) =>
        setItems((prev) => prev.filter((i) => i.product_id !== productId));

    const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const fmtMAD = (n: number) =>
        Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD';

    const availableToAdd = returnableItems.filter(
        (r) => !items.some((i) => i.product_id === r.product_id)
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!invoiceId)    errs.invoice     = "Veuillez sélectionner une facture.";
        if (!returnDate)   errs.return_date = "La date de retour est obligatoire.";
        if (!items.length) errs.items       = "Ajoutez au moins un article à retourner.";
        items.forEach((item, idx) => {
            if (item.quantity > item.available_quantity) {
                errs[`item_${idx}`] =
                    `"${item.product_name}" dépasse la quantité max retournable (${item.available_quantity}).`;
            }
        });
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});
        onSubmit({
            sales_invoice_id: invoiceId,
            return_date:      returnDate,
            notes,
            items: items.map(({ product_id, quantity }) => ({ product_id, quantity })),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">

            {/* ── Facture & Date ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="invoice" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Facture d'origine <span className="text-red-500">*</span>
                    </Label>
                    {isEdit ? (
                        <div className="flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 font-mono">
                            {invoices.find((inv) => inv.uuid === invoiceId)?.code ?? invoiceId}
                        </div>
                    ) : (
                        <InvoiceCombobox
                            invoices={invoices}
                            value={invoiceId}
                            onChange={handleInvoiceChange}
                        />
                    )}
                    {errors.invoice && <p className="text-xs text-red-500">{errors.invoice}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="return_date" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Date du retour <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="return_date"
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className={`bg-slate-50 border-slate-200 rounded-xl ${errors.return_date ? "border-red-400" : ""}`}
                    />
                    {errors.return_date && <p className="text-xs text-red-500">{errors.return_date}</p>}
                </div>
            </div>

            {/* ── Articles à retourner ────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between min-h-9">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Articles à retourner
                    </Label>

                    {availableToAdd.length > 0 && (
                        <Select onValueChange={(v) => addItem(Number(v))}>
                            <SelectTrigger className="w-60 rounded-xl">
                                <SelectValue placeholder="+ Ajouter un article" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableToAdd.map((r) => (
                                    <SelectItem key={r.product_id} value={String(r.product_id)}>
                                        {r.product_name}{" "}
                                        <span className="text-slate-400 text-xs">
                                            (max {r.available_quantity})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Chargement */}
                {loadingItems && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isEdit ? "Chargement des quantités disponibles…" : "Chargement des articles de la facture…"}
                    </div>
                )}

                {/* Erreur */}
                {invoiceError && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {invoiceError}
                    </div>
                )}

                {/* État vide */}
                {!isEdit && !invoiceId && !loadingItems && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 border-2 border-dashed rounded-xl">
                        <PackageX className="w-8 h-8 mb-2" />
                        <p className="text-sm">Sélectionnez une facture pour charger les articles retournables</p>
                    </div>
                )}

                {/* Tableau des articles */}
                {items.length > 0 && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Produit</th>
                                    <th className="px-4 py-3 text-center w-32">Qté max</th>
                                    <th className="px-4 py-3 text-center w-32">Qté à retourner</th>
                                    <th className="px-4 py-3 text-right w-32">Prix unit.</th>
                                    <th className="px-4 py-3 text-right w-32">Sous-total</th>
                                    <th className="px-4 py-3 w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, idx) => {
                                    const overLimit = item.quantity > item.available_quantity;
                                    return (
                                        <tr
                                            key={item.product_id}
                                            className={overLimit || errors[`item_${idx}`] ? "bg-red-50" : "hover:bg-slate-50"}
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {item.product_name}
                                                {errors[`item_${idx}`] && (
                                                    <p className="text-xs text-red-500 mt-0.5">
                                                        {errors[`item_${idx}`]}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-center font-mono">
                                                {loadingItems ? (
                                                    <Loader2 className="w-3 h-3 animate-spin mx-auto text-slate-400" />
                                                ) : (
                                                    <span className={item.available_quantity === 0 ? "text-red-500 font-semibold" : "text-slate-500"}>
                                                        {item.available_quantity}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={item.available_quantity}
                                                    value={item.quantity}
                                                    disabled={loadingItems}
                                                    onChange={(e) => updateQty(item.product_id, Number(e.target.value))}
                                                    className={`w-20 mx-auto text-center ${overLimit ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                                                />
                                            </td>

                                            <td className="px-4 py-3 text-right font-mono text-slate-600">
                                                {fmtMAD(Number(item.unit_price))}
                                            </td>

                                            <td className="px-4 py-3 text-right font-semibold font-mono">
                                                {fmtMAD(item.unit_price * item.quantity)}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(item.product_id)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="flex justify-end border-t bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-6">
                                <span className="text-sm font-medium text-slate-600">Total remboursé</span>
                                <span className="text-lg font-bold text-red-600 font-mono">
                                    {fmtMAD(total)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}
            </div>

            {/* ── Notes ──────────────────────────────────────────────── */}
            <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Notes (optionnel)
                </Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Motif du retour, état des articles…"
                    rows={3}
                    className="border-slate-200 rounded-xl resize-none"
                />
            </div>

            {/* ── Actions ────────────────────────────────────────────── */}
            <div className="flex justify-end gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => router.visit("/sales_returns")}
                >
                    Annuler
                </Button>
                <Button type="submit" disabled={processing || loadingItems} className="rounded-xl px-6">
                    {(processing || loadingItems) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {isEdit ? "Mettre à jour" : "Créer le retour"}
                </Button>
            </div>
        </form>
    );
}
