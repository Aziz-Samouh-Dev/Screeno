import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import SalesReturnForm from '@/components/SalesReturns/sales-return-form';
import { useState } from 'react';

interface Props { returnData: any; invoices: any[] }

export default function Edit({ returnData, invoices }: Props) {
    const [processing, setProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Retours de vente', href: '/sales_returns' },
        { title: returnData.uuid.slice(0, 8) + '…', href: `/sales_returns/${returnData.uuid}` },
        { title: 'Modifier', href: `/sales_returns/${returnData.uuid}/edit` },
    ];

    const defaultValues = {
        sales_invoice_id: returnData.invoice.uuid,
        return_date:      returnData.return_date,
        return_uuid:      returnData.uuid,
        items: returnData.items.map((item: any) => ({
            product_id:         item.product_id,
            product_name:       item.product_name,
            unit_price:         Number(item.unit_price),
            available_quantity: 0,
            quantity:           item.quantity,
        })),
        notes: returnData.notes || '',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Return #${returnData.uuid.slice(0, 8)}`} />

            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl"
                            onClick={() => router.visit(`/sales_returns/${returnData.uuid}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Modifier le retour</h1>
                            <p className="text-sm text-slate-400">Invoice: {returnData.invoice.code}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl"
                        onClick={() => router.visit(`/sales_returns/${returnData.uuid}`)}>
                        <Eye className="mr-2 h-4 w-4" /> Voir
                    </Button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-8 py-6">
                        <SalesReturnForm
                            invoices={invoices}
                            defaultValues={defaultValues}
                            isEdit={true}
                            processing={processing}
                            onSubmit={(data: any) => router.put(`/sales_returns/${returnData.uuid}`, data, {
                                onStart:  () => setProcessing(true),
                                onFinish: () => setProcessing(false),
                            })}
                        />
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
