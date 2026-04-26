"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Save, AlertTriangle, ShoppingCart, ChevronDown, Search } from "lucide-react"

/* ================= TYPES ================= */

export interface Client {
    id: number
    nom: string
    email?: string
    telephone?: string
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
    /** product_id → original qty already sold in the invoice being edited */
    reservedQty?: Record<number, number>
}

const fmtMAD = (n: number) =>
    Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD'

/* ================= CLIENT COMBOBOX ================= */

function EntityCombobox({
    items, value, onChange, placeholder, onCreateNew, createLabel,
}: {
    items: Client[]
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
                setOpen(false); setSearch('')
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
            <button type="button" onClick={() => setOpen(!open)}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:border-slate-300 transition-colors">
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
                    ) : <span className="text-slate-400">{placeholder}</span>}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
                            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length > 0 ? filtered.map(item => (
                            <button key={item.id} type="button"
                                className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 flex flex-col gap-0.5 transition-colors ${value === item.id ? 'bg-blue-50' : ''}`}
                                onClick={() => { onChange(item.id); setOpen(false); setSearch('') }}>
                                <span className="font-semibold text-slate-900 text-sm">{item.nom}</span>
                                <div className="flex gap-3">
                                    {item.telephone && <span className="text-xs text-slate-400">{item.telephone}</span>}
                                    {item.email && <span className="text-xs text-slate-400">{item.email}</span>}
                                </div>
                            </button>
                        )) : <p className="px-3 py-4 text-sm text-center text-slate-400">Aucun résultat</p>}
                    </div>
                    {onCreateNew && (
                        <div className="border-t border-slate-100 p-2">
                            <button type="button" onClick={() => { onCreateNew(); setOpen(false); setSearch('') }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Plus className="h-4 w-4" />{createLabel || 'Nouveau'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ================= PRODUCT COMBOBOX ================= */

function ProductCombobox({
    products, value, onChange, disabledIds, reservedQty = {},
}: {
    products: Product[]
    value: number | null | undefined
    onChange: (id: number) => void
    disabledIds: number[]
    reservedQty?: Record<number, number>
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
    const triggerRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handle = (e: MouseEvent) => {
            if (
                !triggerRef.current?.contains(e.target as Node) &&
                !dropdownRef.current?.contains(e.target as Node)
            ) { setOpen(false); setSearch('') }
        }
        const onScroll = () => { setOpen(false); setSearch('') }
        document.addEventListener('mousedown', handle)
        window.addEventListener('scroll', onScroll, true)
        return () => {
            document.removeEventListener('mousedown', handle)
            window.removeEventListener('scroll', onScroll, true)
        }
    }, [open])

    const openDropdown = () => {
        if (triggerRef.current) {
            const r = triggerRef.current.getBoundingClientRect()
            setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 260) })
        }
        setOpen(v => !v)
    }

    const filtered = products.filter(p =>
        p.nom.toLowerCase().includes(search.toLowerCase())
    )
    const selected = products.find(p => p.id === value)

    return (
        <div className="relative">
            <button ref={triggerRef} type="button" onClick={openDropdown}
                className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm hover:border-slate-300 transition-colors">
                <span className={selected ? "font-medium text-slate-900 truncate" : "text-slate-400"}>
                    {selected ? selected.nom : "Sélectionner un produit…"}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
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
                            const avail = p.stock_quantity + (reservedQty[p.id] ?? 0)
                            const alreadyUsed = disabledIds.includes(p.id) && value !== p.id
                            const noStock = avail <= 0
                            const isDisabled = alreadyUsed || noStock
                            return (
                                <button key={p.id} type="button" disabled={isDisabled}
                                    onClick={() => { if (!isDisabled) { onChange(p.id); setOpen(false); setSearch('') } }}
                                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                                        value === p.id ? 'bg-blue-50' :
                                        isDisabled ? 'opacity-40 cursor-not-allowed' :
                                        'hover:bg-slate-50'
                                    }`}>
                                    <span className="font-medium text-slate-900 text-sm truncate">{p.nom}</span>
                                    <span className={`text-xs font-mono shrink-0 ${
                                        avail <= 0 ? 'text-red-500' : avail <= 10 ? 'text-amber-500' : 'text-slate-400'
                                    }`}>
                                        {avail <= 0 ? 'rupture' : `${avail} dispo.`}
                                    </span>
                                </button>
                            )
                        }) : <p className="px-3 py-4 text-sm text-center text-slate-400">Aucun produit trouvé</p>}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ================= COMPONENT ================= */

export default function InvoiceForm({
    clients, products, defaultValues, onSubmit, processing = false, reservedQty = {},
}: Props) {
    const { control, register, handleSubmit, watch, setValue } =
        useForm<InvoiceFormValues>({ defaultValues })

    const { fields, append, remove } = useFieldArray({ control, name: "items" })

    const items       = watch("items") || []
    const invoiceDate = watch("invoice_date")
    const clientId    = watch("client_id")
    const isNewClient = clientId === null || clientId === undefined

    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(items)]
    )

    const getProduct = (id: number | null) => products.find(p => p.id === Number(id)) ?? null

    const getAvailableStock = (productId: number | null): number => {
        if (!productId) return 0
        const product = getProduct(productId)
        if (!product) return 0
        return product.stock_quantity + (reservedQty[productId] ?? 0)
    }

    const isOverStock = (item: InvoiceItem): boolean =>
        item.product_id !== null && Number(item.quantity) > getAvailableStock(item.product_id)

    const anyOverStock = items.some(isOverStock)

    const selectedProductIds = useMemo(
        () => items.map(i => i.product_id).filter(Boolean) as number[],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(items)]
    )

    const handleProductChange = (index: number, productId: number) => {
        const product = products.find(p => p.id === productId)
        if (!product) return

        const available = getAvailableStock(product.id)
        const existingIndex = items.findIndex((item, i) => i !== index && Number(item.product_id) === product.id)

        if (existingIndex !== -1) {
            const merged = (Number(items[existingIndex]?.quantity) || 0) + (Number(items[index]?.quantity) || 1)
            setValue(`items.${existingIndex}.quantity`, Math.min(merged, available || merged))
            remove(index)
        } else {
            setValue(`items.${index}.product_id`, product.id)
            setValue(`items.${index}.unit_price`, product.sale_price)
            setValue(`items.${index}.quantity`, 1)
        }
    }

    const allProductsUsed = products.length > 0 && selectedProductIds.length >= products.length

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full">

            {/* ── Client + Date ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Client <span className="text-red-500">*</span>
                    </Label>
                    <EntityCombobox items={clients} value={isNewClient ? undefined : clientId}
                        onChange={(id) => { setValue("client_id", id); setValue("client_name", ""); setValue("client_phone", "") }}
                        placeholder="Sélectionner un client"
                        onCreateNew={() => { setValue("client_id", null); setValue("client_name", ""); setValue("client_phone", "") }}
                        createLabel="Nouveau client" />
                    {isNewClient && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <Input placeholder="Nom du client *" {...register("client_name", { required: isNewClient })}
                                className="h-10 border border-slate-200 rounded-xl" />
                            <Input placeholder="Téléphone" {...register("client_phone")}
                                className="h-10 border border-slate-200 rounded-xl" />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Date de facture <span className="text-red-500">*</span>
                    </Label>
                    <Input type="date" value={invoiceDate || ""}
                        onChange={(e) => setValue("invoice_date", e.target.value)}
                        className="bg-slate-50 border-slate-200 rounded-xl" />
                </div>
            </div>

            {/* ── Lignes de facture ──────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Lignes de facture</h3>
                    <Button type="button" size="sm" className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                        disabled={allProductsUsed}
                        onClick={() => append({ product_id: null, quantity: 1, unit_price: 0 })}
                        title={allProductsUsed ? 'Tous les produits ont été ajoutés' : undefined}>
                        <Plus className="w-3 h-3 mr-1" /> Ajouter une ligne
                    </Button>
                </div>

                {anyOverStock && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Certaines quantités dépassent le stock disponible. Corrigez-les avant d'enregistrer.</span>
                    </div>
                )}

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Produit</th>
                                <th className="px-4 py-3 w-28 text-center">Stock dispo.</th>
                                <th className="px-4 py-3 w-28 text-center">Qté</th>
                                <th className="px-4 py-3 w-32 text-right">Prix unit.</th>
                                <th className="px-4 py-3 w-32 text-right">Total</th>
                                <th className="px-4 py-3 w-10" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fields.map((field, index) => {
                                const productId = items[index]?.product_id
                                const product   = getProduct(productId ?? null)
                                const available = getAvailableStock(productId ?? null)
                                const over      = isOverStock(items[index])

                                return (
                                    <tr key={field.id} className={over ? "bg-red-50" : "hover:bg-slate-50"}>

                                        {/* Produit */}
                                        <td className="px-4 py-2">
                                            <ProductCombobox
                                                products={products}
                                                value={productId}
                                                onChange={(id) => handleProductChange(index, id)}
                                                disabledIds={selectedProductIds}
                                                reservedQty={reservedQty}
                                            />
                                        </td>

                                        {/* Stock dispo. */}
                                        <td className="px-4 py-2 text-center">
                                            {product ? (
                                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold font-mono ${
                                                    available <= 0  ? "bg-red-100 text-red-600"
                                                    : available <= 10 ? "bg-amber-100 text-amber-600"
                                                    : "bg-green-100 text-green-600"
                                                }`}>{available}</span>
                                            ) : <span className="text-slate-300">—</span>}
                                        </td>

                                        {/* Qté */}
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Input type="number" min={1}
                                                    max={available > 0 ? available : undefined}
                                                    value={Number(items[index]?.quantity) || ''}
                                                    disabled={!product || available <= 0}
                                                    onChange={(e) => {
                                                        const v = parseInt(e.target.value, 10)
                                                        setValue(`items.${index}.quantity`, isNaN(v) ? 1 : Math.max(1, v))
                                                    }}
                                                    className={`h-9 w-20 mx-auto text-center border rounded-lg ${
                                                        over ? "border-red-400 bg-red-50" : "border-slate-200"
                                                    }`} />
                                                {over && (
                                                    <span className="text-xs text-red-600 font-medium">max {available}</span>
                                                )}
                                                {product && available <= 0 && (
                                                    <span className="text-xs text-red-600 font-medium">Rupture</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Prix unit. */}
                                        <td className="px-4 py-2">
                                            <Input type="number" step="0.01" min={0}
                                                className="h-9 w-28 ml-auto text-right border border-slate-200 rounded-lg"
                                                {...register(`items.${index}.unit_price`, { valueAsNumber: true })} />
                                        </td>

                                        {/* Total */}
                                        <td className="px-4 py-2 text-right font-semibold text-slate-900 font-mono text-xs">
                                            {fmtMAD((items[index]?.quantity || 0) * (items[index]?.unit_price || 0))}
                                        </td>

                                        {/* Supprimer */}
                                        <td className="px-4 py-2 text-right">
                                            <Button type="button" variant="ghost" size="icon"
                                                onClick={() => remove(index)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50">
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
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes (optionnel)</Label>
                <Textarea {...register("notes")} placeholder="Notes additionnelles, conditions, instructions…"
                    rows={3} className="border-slate-200 rounded-xl resize-none" />
            </div>

            {/* ── Récapitulatif ─────────────────────────────────────── */}
            <div className="w-full md:w-80 ml-auto bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Sous-total</span><span className="font-mono">{fmtMAD(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Taxe</span><span className="font-mono">0,00 MAD</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-lg">
                    <span>Total</span><span className="font-mono">{fmtMAD(subtotal)}</span>
                </div>
            </div>

            {/* ── Enregistrer ───────────────────────────────────────── */}
            <div className="flex justify-end">
                <Button type="submit" disabled={processing || anyOverStock} className="rounded-xl px-6"
                    title={anyOverStock ? "Corrigez les quantités avant d'enregistrer" : undefined}>
                    <Save className="w-4 h-4 mr-2" />
                    {processing ? 'Enregistrement…' : 'Enregistrer la facture'}
                </Button>
            </div>
        </form>
    )
}
