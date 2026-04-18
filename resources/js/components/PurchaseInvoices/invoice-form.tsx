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
import { Plus, Trash2, Save, PackagePlus } from "lucide-react"

/* ================= TYPES ================= */

export interface Supplier {
    id: number
    nom: string
}

export interface Product {
    id: number
    nom: string
    purchase_price: number
    sale_price: number
}

export interface InvoiceItem {
    product_id?: number | null
    product_name?: string
    quantity: number
    unit_price: number
    sale_price?: number
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

    /* ── totals ── */
    const subtotal = useMemo(
        () => items.reduce((sum, item) =>
            sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(items)]
    )

    /* ── supplier change ── */
    const handleSupplierChange = (value: string) => {
        if (value === "new") {
            setValue("supplier_id", null)
            setValue("supplier_name", "")
            setValue("supplier_phone", "")
        } else {
            setValue("supplier_id", Number(value))
            setValue("supplier_name", "")
            setValue("supplier_phone", "")
        }
    }

    /* ── product change ── */
    const handleProductChange = (index: number, value: string) => {
        if (value === "new") {
            setValue(`items.${index}.is_new`, true)
            setValue(`items.${index}.product_id`, null)
            setValue(`items.${index}.product_name`, "")
            setValue(`items.${index}.unit_price`, 0)
            setValue(`items.${index}.sale_price`, 0)
            return
        }
        const product = products.find((p) => p.id === Number(value))
        if (!product) return
        setValue(`items.${index}.is_new`, false)
        setValue(`items.${index}.product_id`, product.id)
        setValue(`items.${index}.product_name`, product.nom)
        setValue(`items.${index}.unit_price`, product.purchase_price)
        setValue(`items.${index}.sale_price`, product.sale_price)
    }

    /* ── cancel new product → revert to selector ── */
    const cancelNewProduct = (index: number) => {
        setValue(`items.${index}.is_new`, false)
        setValue(`items.${index}.product_id`, null)
        setValue(`items.${index}.product_name`, "")
        setValue(`items.${index}.unit_price`, 0)
        setValue(`items.${index}.sale_price`, 0)
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full">

            {/* ── Supplier + Date ───────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Supplier */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Supplier <span className="text-red-500">*</span>
                    </Label>

                    <Select
                        value={isNewSupplier ? "new" : supplierId?.toString()}
                        onValueChange={handleSupplierChange}
                    >
                        <SelectTrigger className="h-10 border border-slate-200 rounded-xl">
                            <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                    {s.nom}
                                </SelectItem>
                            ))}
                            <SelectItem value="new">
                                <span className="flex items-center gap-2">
                                    <Plus className="w-3 h-3" /> New Supplier
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {isNewSupplier && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <Input
                                placeholder="Supplier name *"
                                {...register("supplier_name", { required: isNewSupplier })}
                                className="h-10 border border-slate-200 rounded-xl"
                            />
                            <Input
                                placeholder="Phone"
                                {...register("supplier_phone")}
                                className="h-10 border border-slate-200 rounded-xl"
                            />
                        </div>
                    )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Invoice Date <span className="text-red-500">*</span>
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
                        Invoice Items
                    </h3>
                    <Button
                        type="button"
                        size="sm"
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                        onClick={() => append({ quantity: 1, unit_price: 0, sale_price: 0, is_new: false })}
                    >
                        <Plus className="w-3 h-3 mr-1" /> Add Item
                    </Button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Product</th>
                                <th className="px-4 py-3 w-24 text-center">Qty</th>
                                <th className="px-4 py-3 w-32 text-right">Purchase Price</th>
                                <th className="px-4 py-3 w-32 text-right">Sale Price</th>
                                <th className="px-4 py-3 w-32 text-right">Total</th>
                                <th className="px-4 py-3 w-10" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fields.map((field, index) => {
                                const isNew = items[index]?.is_new ?? false

                                return (
                                    <tr key={field.id} className="hover:bg-slate-50">

                                        {/* Product cell */}
                                        <td className="px-4 py-2">
                                            {isNew ? (
                                                /* New product — text input + cancel */
                                                <div className="space-y-1">
                                                    <Input
                                                        placeholder="New product name *"
                                                        {...register(`items.${index}.product_name`)}
                                                        className="h-9 border border-slate-200 rounded-lg"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => cancelNewProduct(index)}
                                                        className="text-xs text-slate-400 hover:text-slate-600 underline"
                                                    >
                                                        ← Select existing product
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Existing product selector */
                                                <Select
                                                    value={items[index]?.product_id?.toString() ?? ""}
                                                    onValueChange={(v) => handleProductChange(index, v)}
                                                >
                                                    <SelectTrigger className="h-9 border border-slate-200 rounded-lg">
                                                        <SelectValue placeholder="Select product" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map((p) => (
                                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                                {p.nom}
                                                            </SelectItem>
                                                        ))}
                                                        <hr className="my-1 border-slate-100" />
                                                        <SelectItem value="new">
                                                            <span className="flex items-center gap-2 text-blue-600">
                                                                <PackagePlus className="w-3 h-3" />
                                                                Add New Product
                                                            </span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </td>

                                        {/* Qty */}
                                        <td className="px-4 py-2 text-center">
                                            <Input
                                                type="number"
                                                min={1}
                                                className="h-9 w-20 mx-auto text-center border border-slate-200 rounded-lg"
                                                {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                            />
                                        </td>

                                        {/* Purchase price */}
                                        <td className="px-4 py-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                className="h-9 w-28 ml-auto text-right border border-slate-200 rounded-lg"
                                                {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                                            />
                                        </td>

                                        {/* Sale price — always shown for pricing decisions */}
                                        <td className="px-4 py-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                className="h-9 w-28 ml-auto text-right border border-slate-200 rounded-lg"
                                                {...register(`items.${index}.sale_price`, { valueAsNumber: true })}
                                            />
                                        </td>

                                        {/* Line total */}
                                        <td className="px-4 py-2 text-right font-semibold font-mono text-slate-900">
                                            ${((items[index]?.quantity || 0) * (items[index]?.unit_price || 0)).toFixed(2)}
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
                                        <PackagePlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No items yet. Click "Add Item" to start.</p>
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
                    Notes (optional)
                </Label>
                <Textarea
                    {...register("notes")}
                    placeholder="Additional notes, payment terms, or delivery instructions…"
                    rows={3}
                    className="border-slate-200 rounded-xl resize-none"
                />
            </div>

            {/* ── Summary ───────────────────────────────────────────── */}
            <div className="w-full md:w-80 ml-auto bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Tax</span>
                    <span className="font-mono">$0.00</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-lg">
                    <span>Total</span>
                    <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
            </div>

            {/* ── Submit ────────────────────────────────────────────── */}
            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    <Save className="w-4 h-4 mr-2" />
                    {processing ? "Saving…" : "Save Invoice"}
                </Button>
            </div>
        </form>
    )
}
