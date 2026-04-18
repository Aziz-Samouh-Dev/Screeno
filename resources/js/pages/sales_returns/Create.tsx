// resources/js/Pages/sales_returns/Create.tsx
"use client";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";
import SalesReturnForm from "@/components/SalesReturns/sales-return-form";
import { useState } from "react";

interface Props {
    invoices: any[];
    selectedInvoice?: any;
    returnableItems?: any[];
}

export default function Create({ invoices, selectedInvoice, returnableItems = [] }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Sales Returns", href: "/sales_returns" },
        { title: "Create", href: "/sales_returns/create" },
    ];
    const [processing, setProcessing] = useState(false);

    const defaultValues = {
        sales_invoice_id: selectedInvoice?.uuid ?? null,
        return_date: new Date().toISOString().slice(0, 10),
        items: returnableItems.map((item: any) => ({
            ...item,
            quantity: 1,
        })),
        notes: "",
    };

    const handleSubmit = (data: any) => {
    router.post("/sales_returns", data, {
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });
};

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Sales Return" />
            <div className="p-4">
                <div className="border rounded-xl overflow-hidden">
                    <div className="px-8 py-6 border-b bg-slate-50">
                        <h2 className="text-xl font-bold">Create Sales Return</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Return products to stock and credit the client
                        </p>
                    </div>
                    <div className="px-8 py-6">
                        <SalesReturnForm
                            invoices={invoices}
                            defaultValues={defaultValues}
                            onSubmit={handleSubmit}
                            isEdit={false}
                            processing={processing}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
