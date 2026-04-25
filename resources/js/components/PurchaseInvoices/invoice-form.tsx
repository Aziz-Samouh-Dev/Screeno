"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save, ShoppingCart, ChevronDown, Search, PackagePlus } from "lucide-react"

/* ================= TYPES ================= */

export interface Supplier {
    id: number
    nom: string
    email?: string
    telephone?: string
}

export interface Product {
    id: number
    nom: string
    purchase_price: number
    sale_price: number
    stock_quantity: number
}

export interface InvoiceItem {
    product_id: number | null
    product_name?: string
    quantity: number
    unit_price: number
    sale_price: number
    is_new?: boolean
}

export interface InvoiceFormValues {
    supplier_id?: number | null | undefined
    supplier_name?: string
    supplier_phone?: string
    invoice_date: string
    notes?: string
    items: InvoiceItem[]
}

interface Props {
    suppliers: Supplier[]
    products: Product[]
    defaultValues: InvoiceFormValues
    onSubmit: (data: InvoiceFormValues) => void
    processing?: boolean
}

const fmtMAD = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD'

/* ================= SUPPLIER COMBOBOX ================= */

function EntityCombobox({
    items,
    value,
    onChange,
    placeholder,
    onCreateNew,
    createLabel,
}: {
    items: Supplier[]
    value: number | null | undefined
    onChange: (id: number | null) => void
    placeholder: string
    onCreateNew?: () => void
    createLabel?: string
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
                setSearch('')
            }
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    const filtered = items.filter(item =>
        item.nom.toLowerCase().includes(search.toLowerCase()) ||
        item.email?.toLowerCase().includes(search.toLowerCase()) ||
        item.telephone?.includes(search)
    )

    const selected = items.find(i => i.id === value)

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
                            <span className="font-semibold text-slate-900 truncate leading-tight">{selected.nom}</span>
                            {(selected.telephone || selected.email) && (
                                <span className="text-xs text-slate-400 truncate leading-tight">
                                    {selected.telephone || selected.email}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-slate-400">{placeholder}</span>
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
                                placeholder="Rechercher..."
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length > 0 ? filtered.map(item => (
                            <button
                                key={item.id}
                                type="button"
                                className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 flex flex-col gap-0.5 transition-colors ${value === item.id ? 'bg-violet-50' : ''}`}
                                onClick={() => { onChange(item.id); setOpen(false); setSearch('') }}
                            >
                                <span className="font-semibold text-slate-900 text-sm">{item.nom}</span>
                                <div className="flex gap-3">
                                    {item.telephone && <span className="text-xs text-slate-400">{item.telephone}</span>}
                                    {item.email && <span className="text-xs text-slate-400">{item.email}</span>}
                                </div>
                            </button>
                        )) : (
                            <p className="px-3 py-4 text-sm text-center text-slate-400">Aucun résultat</p>
                        )}
                    </div>
                    {onCreateNew && (
                        <div className="border-t border-slate-100 p-2">
                            <button
                                type="button"
                                onClick={() => { onCreateNew(); setOpen(false); setSearch('') }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                {createLabel || 'Nouveau'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ================= COMPONENT ================= */

export default function InvoiceForm({
    suppliers,
    products,
    defaultValues,
    onSubmit,
    processing = false,
}: Props) {
    const { control, register, handleSubmit, watch, setValue } =
        useForm<InvoiceFormValues>({ defaultValues })

    const { fields, append, remove } = useFieldArray({ control, name: "items" })

    const items       = watch("items") || []
    const invoiceDate = watch("invoice_date")
    const supplierId  = watch("supplier_id")

    const isNewSupplier = supplierId === null || supplierId === undefined

    const subtotal = useMemo(
        () => items.reduce((sum, item) =>
            sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(items)]
    )

    const getProduct = (id: number | null) =>
        products.find((p) => p.id === Number(id)) ?? null

    // Only count existing (non-new) items for duplicate prevention
    const selectedProductIds = useMemo(
        () => items
            .filter(i => !i.is_new)
            .map(i => i.product_id)
            .filter(Boolean) as number[],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(items)]
    )

    const handleProductChange = (index: number, productId: string) => {
        const product = products.find((p) => p.id === Number(productId))
        if (!product) return

        const existingIndex = items.findIndex(
            (item, i) => i !== index && !item.is_new && Number(item.product_id) === product.id
        )

        if (existingIndex !== -1) {
            const currentQty  = Number(items[index]?.quantity) || 1
            const existingQty = Number(items[existingIndex]?.quantity) || 0
            setValue(`items.${existingIndex}.quantity`, existingQty + currentQty)
            remove(index)
        } else {
            setValue(`items.${index}.product_id`, product.id)
            setValue(`items.${index}.unit_price`, product.purchase_price)
            setValue(`items.${index}.sale_price`, product.sale_price)
            setValue(`items.${index}.quantity`, 1)
        }
    }

    const allExistingProductsUsed =
        products.length > 0 && selectedProductIds.length >= products.length

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full">

            {/* ── Fournisseur + Date ────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Fournisseur */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Fournisseur <span className="text-red-500">*</span>
                    </Label>
                    <EntityCombobox
                        items={suppliers}
                        value={isNewSupplier ? undefined : supplierId}
                        onChange={(id) => {
                            setValue("supplier_id", id)
                            setValue("supplier_name", "")
                            setValue("supplier_phone", "")
                        }}
                        placeholder="Sélectionner un fournisseur"
                        onCreateNew={() => {
                            setValue("supplier_id", null)
                            setValue("supplier_name", "")
                            setValue("supplier_phone", "")
                        }}
                        createLabel="Nouveau fournisseur"
                    />

                    {isNewSupplier && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <Input
                                placeholder="Nom du fournisseur *"
                                {...register("supplier_name", { required: isNewSupplier })}
                                className="h-10 border border-slate-200 rounded-xl"
                            />
                            <Input
                                placeholder="Téléphone"
                                {...register("supplier_phone")}
                                className="h-10 border border-slate-200 rounded-xl"
                            />
                        </div>
                    )}
                </div>

                {/* Date de facture */}
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

            {/* ── Lignes de facture ──────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                        Lignes de facture
                    </h3>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg"
                            disabled={allExistingProductsUsed}
                            onClick={() => append({ product_id: null, quantity: 1, unit_price: 0, sale_price: 0, is_new: false })}
                            title={allExistingProductsUsed ? 'Tous les produits existants ont été ajoutés' : undefined}
                        >
                            <Plus className="w-3 h-3 mr-1" /> Produit existant
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
                            onClick={() => append({ product_id: null, product_name: '', quantity: 1, unit_price: 0, sale_price: 0, is_new: true })}
                        >
                            <PackagePlus className="w-3 h-3 mr-1" /> Nouveau produit
                        </Button>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Produit</th>
                                <th className="px-4 py-3 w-24 text-center">Stock</th>
                                <th className="px-4 py-3 w-24 text-center">Qté</th>
                                <th className="px-4 py-3 w-32 text-right">Prix d'achat</th>
                                <th className="px-4 py-3 w-32 text-right">Prix de vente</th>
                                <th className="px-4 py-3 w-32 text-right">Total</th>
                                <th className="px-4 py-3 w-10" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fields.map((field, index) => {
                                const isNew     = items[index]?.is_new
                                const productId = items[index]?.product_id
                                const product   = getProduct(productId ?? null)
                                const stock     = product?.stock_quantity ?? 0

                                return (
                                    <tr key={field.id} className={`hover:bg-slate-50 ${isNew ? 'bg-violet-50/30' : ''}`}>

                                        {/* Produit */}
                                        <td className="px-4 py-2">
                                            {isNew ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-block shrink-0 rounded-full bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5">
                                                        Nouveau
                                                    </span>
                                                    <Input
                                                        placeholder="Nom du produit *"
                                                        className="h-9 border border-violet-200 rounded-lg"
                                                        {...register(`items.${index}.product_name`, { required: !!isNew })}
                                                    />
                                                </div>
                                            ) : (
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
                                                                            p.stock_quantity === 0 ? "text-red-500"
                                                                            : p.stock_quantity <= 10 ? "text-amber-500"
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
                                            )}
                                        </td>

                                        {/* Stock actuel */}
                                        <td className="px-4 py-2 text-center">
                                            {!isNew && product ? (
                                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold font-mono ${
                                                    stock === 0 ? "bg-red-100 text-red-600"
                                                    : stock <= 10 ? "bg-amber-100 text-amber-600"
                                                    : "bg-green-100 text-green-600"
                                                }`}>
                                                    {stock}
                                                </span>
                                            ) : <span className="text-slate-300">—</span>}
                                        </td>

                                        {/* Qté */}
                                        <td className="px-4 py-2 text-center">
                                            <Input
                                                type="number"
                                                min={1}
                                                className="h-9 w-20 mx-auto text-center border border-slate-200 rounded-lg"
                                                {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                            />
                                        </td>

                                        {/* Prix d'achat */}
                                        <td className="px-4 py-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                className="h-9 w-28 ml-auto text-right border border-slate-200 rounded-lg"
                                                {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                                            />
                                        </td>

                                        {/* Prix de vente */}
                                        <td className="px-4 py-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                className="h-9 w-28 ml-auto text-right border border-slate-200 rounded-lg"
                                                {...register(`items.${index}.sale_price`, { valueAsNumber: true })}
                                            />
                                        </td>

                                        {/* Total */}
                                        <td className="px-4 py-2 text-right font-semibold text-slate-900 font-mono text-xs">
                                            {fmtMAD((items[index]?.quantity || 0) * (items[index]?.unit_price || 0))}
                                        </td>

                                        {/* Supprimer */}
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
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                        <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">Aucun article. Cliquez sur « Produit existant » ou « Nouveau produit » pour commencer.</p>
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
                    placeholder="Notes additionnelles, conditions de paiement, instructions de livraison…"
                    rows={3}
                    className="border-slate-200 rounded-xl resize-none"
                />
            </div>

            {/* ── Récapitulatif ─────────────────────────────────────── */}
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

            {/* ── Enregistrer ───────────────────────────────────────── */}
            <div className="flex justify-end">
                <Button type="submit" disabled={processing} className="rounded-xl px-6">
                    <Save className="w-4 h-4 mr-2" />
                    {processing ? 'Enregistrement…' : 'Enregistrer la facture'}
                </Button>
            </div>
        </form>
    )
}
