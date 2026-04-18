"use client"

import { Head, router } from '@inertiajs/react';
import InvoiceForm, {
    InvoiceFormValues,
    Supplier,
    Product,
} from "@/components/PurchaseInvoices/invoice-form"
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';


interface Props {
    suppliers: Supplier[]
    products: Product[]
}

export default function Create({ suppliers, products }: Props) {

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Purchase Invoices', href: '/purchase_invoices' },
        { title: "Create", href: '/purchase_invoices/create' },
    ];

    const defaultValues: InvoiceFormValues = {
        supplier_id: suppliers[0]?.id ?? undefined,
        invoice_date: new Date().toISOString().slice(0, 10),
        items: [],
    }

    const handleSubmit = (data: InvoiceFormValues) => {
        router.post("/purchase_invoices", data as any)
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Purchase Invoice" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative overflow-hidden rounded-xl border">
                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Create Purchase Invoice</h2>
                            <p className="text-slate-500 text-xs mt-1">Record a new purchase from your supplier.</p>
                        </div>

                    </div>

                    <div className='px-8 py-6'>

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
