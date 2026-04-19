"use client"

import { useMemo } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Save, AlertTriangle, ShoppingCart } from "lucide-react"

/* ================= TYPES ================= */

export interface Client {
    id: number
    nom: string
}

export interface Product {
    id: number
    nom: string
    sale_price: number
    stock_quantity: number
}

export interface InvoiceItem {
    product_id: number | null
    quantity: number
    unit_price: number
}

export interface InvoiceFormValues {
    client_id: number | null | undefined
    client_name?: string
    client_phone?: string
    invoice_date: string
    notes?: string
    items: InvoiceItem[]
}

interface Props {
    clients: Client[]
    products: Product[]
    defaultValues: InvoiceFormValues
    onSubmit: (data: InvoiceFormValues) => void
    processing?: boolean
}

const fmtMAD = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD'

/* ================= COMPONENT ================= */

export default function InvoiceForm({
    clients,
    products,
    defaultValues,
    onSubmit,
    processing = false,
}: Props) {
    const { control, register, handleSubmit, watch, setValue, formState: { errors } } =
        useForm<InvoiceFormValues>({ defaultValues })

    const { fields, append, remove } = useFieldArray({ control, name: "items" })

    const items       = watch("items") || []
    const invoiceDate = watch("invoice_date")
    const clientId    = watch("client_id")

    const isNewClient = clientId === null || clientId === undefined

    const subtotal = useMemo(
        () => items.reduce((sum, item) =>
            sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(items)]
    )

    /* ── helpers ── */
    const getProduct = (id: number | null) =>
        products.find((p) => p.id === Number(id)) ?? null

    const getStock = (productId: number | null) =>
        getProduct(productId)?.stock_quantity ?? 0

    const isOverStock = (item: InvoiceItem) =>
        item.product_id !== null &&
        Number(item.quantity) > getStock(item.product_id)

    const anyOverStock = items.some(isOverStock)

    /* IDs already selected in other rows — used to disable options */
    const selectedProductIds = useMemo(
        () => items.map(i => i.product_id).filter(Boolean) as number[],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(items)]
    )

    /* ── client change ── */
    const handleClientChange = (value: string) => {
        if (value === "new") {
            setValue("client_id", null)
            setValue("client_name", "")
            setValue("client_phone", "")
        } else {
            setValue("client_id", Number(value))
            setValue("client_name", "")
            setValue("client_phone", "")
        }
    }

    /* ── product change — merge if duplicate ── */
    const handleProductChange = (index: number, productId: string) => {
        const product = products.find((p) => p.id === Number(productId))
        if (!product) return

        // Check if this product is already in another row
        const existingIndex = items.findIndex(
            (item, i) => i !== index && Number(item.product_id) === product.id
        )

        if (existingIndex !== -1) {
            // Merge: add current qty into the existing row, remove this row
            const currentQty  = Number(items[index]?.quantity) || 1
            const existingQty = Number(items[existingIndex]?.quantity) || 0
            const stock       = product.stock_quantity
            const merged      = Math.min(existingQty + currentQty, stock > 0 ? stock : 999999)
            setValue(`items.${existingIndex}.quantity`, merged)
            remove(index)
        } else {
            setValue(`items.${index}.product_id`, product.id)
            setValue(`items.${index}.unit_price`, product.sale_price)
            setValue(`items.${index}.quantity`, 1)
        }
    }

    /* ── qty change with stock clamp ── */
    const handleQtyChange = (index: number, raw: string) => {
        const productId = items[index]?.product_id
        const stock     = getStock(productId)
        const qty       = Math.max(1, Math.min(Number(raw) || 1, stock > 0 ? stock : 999999))
        setValue(`items.${index}.quantity`, qty)
    }

    /* All products already used? disable Add button */
    const allProductsUsed = products.length > 0 && selectedProductIds.length >= products.length

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full">

            {/* ── Client + Date ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Client */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Client <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={isNewClient ? "new" : clientId?.toString()}
                        onValueChange={handleClientChange}
                    >
                        <SelectTrigger className="h-10 border border-slate-200 rounded-xl">
                            <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent>
                            {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                    {client.nom}
                                </SelectItem>
                            ))}
                            <SelectItem value="new">
                                <span className="flex items-center gap-2">
                                    <Plus className="w-3 h-3" /> Nouveau client
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {isNewClient && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <Input
                                placeholder="Nom du client *"
                                {...register("client_name", { required: isNewClient })}
                                className="h-10 border border-slate-200 rounded-xl"
                            />
                            <Input
                                placeholder="Téléphone"
                                {...register("client_phone")}
                                className="h-10 border border-slate-200 rounded-xl"
                            />
                        </div>
                    )}
                </div>

                {/* Invoice date */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Date de facture <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        type="date"
                        value={invoiceDate || ""}
                        onChange={(e) => setValue("invoice_date", e.target.value)}
                        className="bg-slate-50 border-slate-200 rounded-xl"
                    />
                </div>
            </div>

            {/* ── Items ─────────────────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                        Lignes de facture
                    </h3>
                    <Button
                        type="button"
                        size="sm"
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                        disabled={allProductsUsed}
                        onClick={() => append({ product_id: null, quantity: 1, unit_price: 0 })}
                        title={allProductsUsed ? 'Tous les produits ont été ajoutés' : undefined}
                    >
                        <Plus className="w-3 h-3 mr-1" /> Ajouter une ligne
                    </Button>
                </div>

                {anyOverStock && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Certains articles dépassent le stock disponible. Les quantités ont été ajustées automatiquement.
                    </div>
                )}

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Produit</th>
                                <th className="px-4 py-3 w-28 text-center">Stock</th>
                                <th className="px-4 py-3 w-28 text-center">Qté</th>
                                <th className="px-4 py-3 w-32 text-right">Prix unit.</th>
                                <th className="px-4 py-3 w-32 text-right">Total</th>
                                <th className="px-4 py-3 w-10" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fields.map((field, index) => {
                                const productId  = items[index]?.product_id
                                const product    = getProduct(productId ?? null)
                                const stock      = product?.stock_quantity ?? 0
                                const overStock  = isOverStock(items[index])
                                const noStock    = product !== null && stock === 0

                                return (
                                    <tr
                                        key={field.id}
                                        className={overStock || noStock ? "bg-red-50" : "hover:bg-slate-50"}
                                    >
                                        {/* Product */}
                                        <td className="px-4 py-2">
                                            <Select
                                                value={items[index]?.product_id?.toString() ?? ""}
                                                onValueChange={(v) => handleProductChange(index, v)}
                                            >
                                                <SelectTrigger className="h-9 border border-slate-200 rounded-lg">
                                                    <SelectValue placeholder="Sélectionner" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map((p) => {
                                                        const alreadyUsed = selectedProductIds.includes(p.id) &&
                                                            Number(items[index]?.product_id) !== p.id
                                                        return (
                                                            <SelectItem
                                                                key={p.id}
                                                                value={p.id.toString()}
                                                                disabled={alreadyUsed}
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    {p.nom}
                                                                    <span className={`text-xs font-mono ${
                                                                        p.stock_quantity === 0
                                                                            ? "text-red-500"
                                                                            : p.stock_quantity <= 10
                                                                            ? "text-amber-500"
                                                                            : "text-slate-400"
                                                                    }`}>
                                                                        ({p.stock_quantity} en stock)
                                                                    </span>
                                                                </span>
                                                            </SelectItem>
                                                        )
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            {noStock && (
                                                <p className="text-xs text-red-500 mt-1">Rupture de stock</p>
                                            )}
                                        </td>

                                        {/* Stock badge */}
                                        <td className="px-4 py-2 text-center">
                                            {product ? (
                                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold font-mono ${
                                                    stock === 0
                                                        ? "bg-red-100 text-red-600"
                                                        : stock <= 10
                                                        ? "bg-amber-100 text-amber-600"
                                                        : "bg-green-100 text-green-600"
                                                }`}>
                                                    {stock}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>

                                        {/* Qty */}
                                        <td className="px-4 py-2 text-center">
                                            <Input
                                                type="number"
                                                min={1}
                                                max={stock > 0 ? stock : undefined}
                                                value={items[index]?.quantity ?? 1}
                                                disabled={!product || stock === 0}
                                                onChange={(e) => handleQtyChange(index, e.target.value)}
                                                className={`h-9 w-20 mx-auto text-center border border-slate-200 rounded-lg ${
                                                    overStock ? "border-red-400" : ""
                                                }`}
                                            />
                                        </td>

                                        {/* Unit price */}
                                        <td className="px-4 py-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                className="h-9 w-28 ml-auto text-right border border-slate-200 rounded-lg"
                                                {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                                            />
                                        </td>

                                        {/* Line total */}
                                        <td className="px-4 py-2 text-right font-semibold text-slate-900 font-mono text-xs">
                                            {fmtMAD((items[index]?.quantity || 0) * (items[index]?.unit_price || 0))}
                                        </td>

                                        {/* Delete */}
                                        <td className="px-4 py-2 text-right">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}

                            {fields.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                                        <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">Aucun article. Cliquez sur « Ajouter une ligne » pour commencer.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── Notes ─────────────────────────────────────────────── */}
            <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Notes (optionnel)
                </Label>
                <Textarea
                    {...register("notes")}
                    placeholder="Notes additionnelles, conditions, instructions…"
                    rows={3}
                    className="border-slate-200 rounded-xl resize-none"
                />
            </div>

            {/* ── Summary ───────────────────────────────────────────── */}
            <div className="w-full md:w-80 ml-auto bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Sous-total</span>
                    <span className="font-mono">{fmtMAD(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Taxe</span>
                    <span className="font-mono">0,00 MAD</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-lg">
                    <span>Total</span>
                    <span className="font-mono">{fmtMAD(subtotal)}</span>
                </div>
            </div>

            {/* ── Submit ────────────────────────────────────────────── */}
            <div className="flex justify-end">
                <Button type="submit" disabled={processing || anyOverStock} className="rounded-xl px-6">
                    <Save className="w-4 h-4 mr-2" />
                    {processing ? 'Enregistrement…' : 'Enregistrer la facture'}
                </Button>
            </div>
        </form>
    )
}
