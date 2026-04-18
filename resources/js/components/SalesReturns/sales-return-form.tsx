"use client";
import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2, Loader2, PackageX, AlertCircle } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Invoice {
    id: number;
    uuid: string;
    code: string;
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
    available_quantity: number; // real ceiling from server
    quantity: number;
}

interface DefaultValues {
    sales_invoice_id: string | null;
    return_date: string;
    return_uuid?: string; // edit mode — passed as ?exclude= to server
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

    /* ----------------------------------------------------------------
     * EDIT MODE — fetch real available quantities on mount.
     *
     * The key insight:
     *   Invoice: HP Laptop qty=20, PRO 12 qty=10
     *   This return: HP=20, PRO=5
     *   Other returns: none
     *
     *   WITHOUT ?exclude: server sees (HP=20 returned) → available=0  ✗
     *   WITH    ?exclude: server ignores this return   → available=20 ✓
     *
     * Server result = invoice_qty − other_returns_qty  (this return excluded)
     * This is the TRUE max the user should not exceed.
     * We use it DIRECTLY — no addition on the frontend.
     * ---------------------------------------------------------------- */
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

                // Index by product_id for O(1) lookup
                const serverMap: Record<number, ReturnableItem> = {};
                serverItems.forEach((s) => { serverMap[s.product_id] = s; });

                // Build full list for the "add product" dropdown.
                // Products already in this return but absent from serverItems
                // means available=0 after other returns — keep current qty as floor.
                const allReturnable: ReturnableItem[] = [
                    ...serverItems,
                    ...defaultValues.items
                        .filter((i) => !serverMap[i.product_id])
                        .map((i) => ({
                            product_id: i.product_id,
                            product_name: i.product_name,
                            unit_price: i.unit_price,
                            available_quantity: i.quantity, // safe floor
                        })),
                ];

                setReturnableItems(allReturnable);

                // Patch items: replace placeholder available_quantity with real server value
                setItems((prev) =>
                    prev.map((item) => ({
                        ...item,
                        available_quantity: serverMap[item.product_id]
                            ? serverMap[item.product_id].available_quantity
                            : item.quantity, // fallback: at least their saved qty
                    }))
                );
            } catch {
                // Network error — cap at saved qty (conservative but safe)
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

    /* ----------------------------------------------------------------
     * CREATE MODE — load returnable items when invoice is selected
     * ---------------------------------------------------------------- */
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
                setInvoiceError("All items from this invoice have already been returned.");
            }
            setReturnableItems(data);
        } catch {
            setInvoiceError("Could not load invoice items. Please try again.");
        } finally {
            setLoadingItems(false);
        }
    };

    /* ----------------------------------------------------------------
     * Add product to the return list
     * ---------------------------------------------------------------- */
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

    /* ----------------------------------------------------------------
     * Update qty — clamped hard to [1, available_quantity]
     * The HTML max attribute is advisory; this clamp is the real guard.
     * ---------------------------------------------------------------- */
    const updateQty = (productId: number, raw: number) => {
        setItems((prev) =>
            prev.map((i) => {
                if (i.product_id !== productId) return i;
                return {
                    ...i,
                    quantity: Math.min(Math.max(1, raw), i.available_quantity),
                };
            })
        );
    };

    const removeItem = (productId: number) =>
        setItems((prev) => prev.filter((i) => i.product_id !== productId));

    const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

    // Products not yet added to the return (for the dropdown)
    const availableToAdd = returnableItems.filter(
        (r) => !items.some((i) => i.product_id === r.product_id)
    );

    /* ----------------------------------------------------------------
     * Submit
     * ---------------------------------------------------------------- */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!invoiceId)    errs.invoice     = "Please select an invoice.";
        if (!returnDate)   errs.return_date = "Return date is required.";
        if (!items.length) errs.items       = "Add at least one item to return.";
        items.forEach((item, idx) => {
            if (item.quantity > item.available_quantity) {
                errs[`item_${idx}`] =
                    `"${item.product_name}" exceeds max returnable qty (${item.available_quantity}).`;
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

    /* ----------------------------------------------------------------
     * Render
     * ---------------------------------------------------------------- */
    return (
        <form onSubmit={handleSubmit} className="space-y-8">

            {/* ── Invoice & Date ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="invoice">
                        Invoice <span className="text-red-500">*</span>
                    </Label>
                    {isEdit ? (
                        <div className="flex h-10 w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                            {invoices.find((inv) => inv.uuid === invoiceId)?.code ?? invoiceId}
                        </div>
                    ) : (
                        <Select value={invoiceId} onValueChange={handleInvoiceChange}>
                            <SelectTrigger id="invoice" className={errors.invoice ? "border-red-400" : ""}>
                                <SelectValue placeholder="Select invoice…" />
                            </SelectTrigger>
                            <SelectContent>
                                {invoices.map((inv) => (
                                    <SelectItem key={inv.uuid} value={inv.uuid}>
                                        {inv.code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {errors.invoice && <p className="text-xs text-red-500">{errors.invoice}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="return_date">
                        Return Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="return_date"
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className={errors.return_date ? "border-red-400" : ""}
                    />
                    {errors.return_date && <p className="text-xs text-red-500">{errors.return_date}</p>}
                </div>
            </div>

            {/* ── Items Section ───────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between min-h-9">
                    <Label className="text-base font-semibold">Items to Return</Label>

                    {availableToAdd.length > 0 && (
                        <Select onValueChange={(v) => addItem(Number(v))}>
                            <SelectTrigger className="w-56">
                                <SelectValue placeholder="+ Add product" />
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

                {/* Loading spinner */}
                {loadingItems && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isEdit ? "Loading available quantities…" : "Loading invoice items…"}
                    </div>
                )}

                {/* Error banner (create mode) */}
                {invoiceError && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {invoiceError}
                    </div>
                )}

                {/* Empty state (create mode, no invoice yet) */}
                {!isEdit && !invoiceId && !loadingItems && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 border-2 border-dashed rounded-xl">
                        <PackageX className="w-8 h-8 mb-2" />
                        <p className="text-sm">Select an invoice to load returnable items</p>
                    </div>
                )}

                {/* Items table */}
                {items.length > 0 && (
                    <div className="border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Product</th>
                                    <th className="px-4 py-3 text-center">Max Returnable</th>
                                    <th className="px-4 py-3 text-center">Qty to Return</th>
                                    <th className="px-4 py-3 text-right">Unit Price</th>
                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                    <th className="px-4 py-3 w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, idx) => {
                                    const overLimit = item.quantity > item.available_quantity;
                                    return (
                                        <tr
                                            key={item.product_id}
                                            className={overLimit || errors[`item_${idx}`] ? "bg-red-50" : ""}
                                        >
                                            {/* Product name */}
                                            <td className="px-4 py-3 font-medium">
                                                {item.product_name}
                                                {errors[`item_${idx}`] && (
                                                    <p className="text-xs text-red-500 mt-0.5">
                                                        {errors[`item_${idx}`]}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Max returnable — real server value */}
                                            <td className="px-4 py-3 text-center font-mono">
                                                {loadingItems ? (
                                                    <Loader2 className="w-3 h-3 animate-spin mx-auto text-slate-400" />
                                                ) : (
                                                    <span className={
                                                        item.available_quantity === 0
                                                            ? "text-red-500 font-semibold"
                                                            : "text-slate-500"
                                                    }>
                                                        {item.available_quantity}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Qty input — hard clamped to max */}
                                            <td className="px-4 py-3 text-center">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={item.available_quantity}
                                                    value={item.quantity}
                                                    disabled={loadingItems}
                                                    onChange={(e) =>
                                                        updateQty(item.product_id, Number(e.target.value))
                                                    }
                                                    className={`w-20 mx-auto text-center ${
                                                        overLimit
                                                            ? "border-red-400 focus-visible:ring-red-400"
                                                            : ""
                                                    }`}
                                                />
                                            </td>

                                            <td className="px-4 py-3 text-right font-mono text-slate-600">
                                                ${Number(item.unit_price).toFixed(2)}
                                            </td>

                                            <td className="px-4 py-3 text-right font-semibold font-mono">
                                                ${(item.unit_price * item.quantity).toFixed(2)}
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

                        {/* Total footer */}
                        <div className="flex justify-end border-t bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-6">
                                <span className="text-sm font-medium text-slate-600">Total Return</span>
                                <span className="text-lg font-bold text-red-600 font-mono">
                                    ${total.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}
            </div>

            {/* ── Notes ──────────────────────────────────────────────── */}
            <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reason for return, condition of items, etc."
                    rows={3}
                />
            </div>

            {/* ── Actions ────────────────────────────────────────────── */}
            <div className="flex justify-end gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.visit("/sales_returns")}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={processing || loadingItems}>
                    {(processing || loadingItems) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {isEdit ? "Update Return" : "Create Return"}
                </Button>
            </div>
        </form>
    );
}
