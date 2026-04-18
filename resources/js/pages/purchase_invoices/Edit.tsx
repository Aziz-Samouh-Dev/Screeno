"use client"

import { Head, router } from "@inertiajs/react"
import type { BreadcrumbItem } from "@/types"
import InvoiceForm, { InvoiceFormValues, Supplier, Product } from "@/components/PurchaseInvoices/invoice-form"
import AppLayout from "@/layouts/app-layout"

interface PurchaseInvoice {
    id: number
    uuid: string
    code: string
    supplier_id: number
    invoice_date: string
    notes?: string
    items: {
        id: number
        product_id: number
        product_name: string
        quantity: number
        unit_price: number
    }[]
}

interface Props {
    invoice: PurchaseInvoice
    suppliers: Supplier[]
    products: Product[]
}

export default function Edit({ invoice, suppliers, products }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Purchase Invoices", href: "/purchase_invoices" },
        { title: invoice.code, href: `/purchase_invoices/${invoice.uuid}/edit` },
    ]

    const defaultValues: InvoiceFormValues = {
        supplier_id:  invoice.supplier_id,
        invoice_date: invoice.invoice_date,
        notes:        invoice.notes ?? "",        // ← was missing
        items: invoice.items.map((item) => {
            // Look up current sale_price from the products list
            const product = products.find((p) => p.id === item.product_id)
            return {
                product_id:   item.product_id,
                product_name: item.product_name,
                quantity:     item.quantity,
                unit_price:   item.unit_price,
                sale_price:   product?.sale_price ?? 0,  // ← restored from product
                is_new:       false,
            }
        }),
    }

    const handleSubmit = (data: InvoiceFormValues) => {
        router.put(`/purchase_invoices/${invoice.uuid}`, data as any)
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={invoice.code} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative overflow-hidden rounded-xl border">
                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Edit Purchase Invoice</h2>
                            <p className="text-slate-500 text-xs mt-1">Update the details of this purchase invoice.</p>
                        </div>
                    </div>
                    <div className="px-8 py-6">
                        <InvoiceForm
                            suppliers={suppliers}
                            products={products}
                            defaultValues={defaultValues}
                            onSubmit={handleSubmit}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
