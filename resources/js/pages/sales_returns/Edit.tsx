"use client";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";
import SalesReturnForm from "@/components/SalesReturns/sales-return-form";
import { useState } from "react";

interface Props {
    returnData: any;
    invoices: any[];
}

export default function Edit({ returnData, invoices }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Sales Returns", href: "/sales_returns" },
        { title: `Edit #${returnData.uuid.slice(0, 8)}`, href: `/sales_returns/${returnData.uuid}/edit` },
    ];

    const [processing, setProcessing] = useState(false);

    const defaultValues = {
    sales_invoice_id: returnData.invoice.uuid,
    return_date: returnData.return_date,
    return_uuid: returnData.uuid,          // ← ADD THIS
    items: returnData.items.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: Number(item.unit_price),
        available_quantity: 0,             // will be set by fetch
        quantity: item.quantity,
    })),
    notes: returnData.notes || "",
};

    const handleSubmit = (data: any) => {
        router.put(`/sales_returns/${returnData.uuid}`, data, {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Return #${returnData.uuid.slice(0, 8)}`} />
            <div className="p-4">
                <div className="border rounded-xl overflow-hidden">
                    <div className="px-8 py-6 border-b bg-slate-50">
                        <h2 className="text-xl font-bold">Edit Sales Return</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Original Invoice: {returnData.invoice.code}
                        </p>
                    </div>
                    <div className="px-8 py-6">
                        <SalesReturnForm
                            invoices={invoices}
                            defaultValues={defaultValues}
                            onSubmit={handleSubmit}
                            isEdit={true}
                            processing={processing}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
