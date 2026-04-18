"use client"

import { Head, router } from "@inertiajs/react"
import type { BreadcrumbItem } from "@/types"
import InvoiceForm, { InvoiceFormValues, Client, Product } from "@/components/SalesInvoices/invoice-form"
import AppLayout from "@/layouts/app-layout"

interface SalesInvoice {
    id: number
    uuid: string
    code: string
    client_id: number
    invoice_date: string
    notes?: string
    items: {
        id: number
        product_id: number
        quantity: number
        unit_price: number
    }[]
}

interface Props {
    invoice: SalesInvoice
    clients: Client[]
    products: Product[]
}

export default function Edit({ invoice, clients, products }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Sales Invoices", href: "/sales_invoices" },
        { title: invoice.code, href: `/sales_invoices/${invoice.uuid}/edit` },
    ]

    const defaultValues: InvoiceFormValues = {
        client_id:    invoice.client_id,
        invoice_date: invoice.invoice_date,
        notes:        invoice.notes ?? "",      // ← was missing
        items: invoice.items.map((item) => ({
            product_id: item.product_id,
            quantity:   item.quantity,
            unit_price: item.unit_price,
        })),
    }

    const handleSubmit = (data: InvoiceFormValues) => {
        router.put(`/sales_invoices/${invoice.uuid}`, data as any)
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={invoice.code} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative overflow-hidden rounded-xl border">
                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Edit Sales Invoice</h2>
                            <p className="text-slate-500 text-xs mt-1">Update the details of this sales invoice.</p>
                        </div>
                    </div>
                    <div className="px-8 py-6">
                        <InvoiceForm
                            clients={clients}
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
