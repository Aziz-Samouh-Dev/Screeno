"use client"

import { Head, router } from "@inertiajs/react"
import type { BreadcrumbItem } from "@/types"

import InvoiceForm, {
    InvoiceFormValues,
    Client,
    Product,
} from "@/components/SalesInvoices/invoice-form"

import AppLayout from "@/layouts/app-layout"

interface Props {
    clients: Client[]
    products: Product[]
}

export default function Create({ clients, products }: Props) {

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Sales Invoices", href: "/sales_invoices" },
        { title: "Create", href: "/sales_invoices/create" },
    ]

    const defaultValues: InvoiceFormValues = {
        client_id: clients[0]?.id ?? undefined,
        invoice_date: new Date().toISOString().slice(0, 10),
        items: [],
    }

    const handleSubmit = (data: InvoiceFormValues) => {
        router.post("/sales_invoices", data as any)
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>

            <Head title="Create Sales Invoice" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                <div className="relative overflow-hidden rounded-xl border">

                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">

                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Create Sales Invoice
                            </h2>

                            <p className="text-slate-500 text-xs mt-1">
                                Record a new sales invoice for your client.
                            </p>
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
