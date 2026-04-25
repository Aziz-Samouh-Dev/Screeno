import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SalesReturnForm from '@/components/SalesReturns/sales-return-form';
import { useState } from 'react';

interface Props {
    invoices:        any[];
    selectedInvoice?: any;
    returnableItems?: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Retours de vente', href: '/sales_returns' },
    { title: 'Nouveau retour', href: '/sales_returns/create' },
];

export default function Create({ invoices, selectedInvoice, returnableItems = [] }: Props) {
    const [processing, setProcessing] = useState(false);

    const defaultValues = {
        sales_invoice_id: selectedInvoice?.uuid ?? null,
        return_date:      new Date().toISOString().slice(0, 10),
        items:            returnableItems.map((item: any) => ({ ...item, quantity: 1 })),
        notes:            '',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau retour de vente" />

            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl"
                        onClick={() => router.visit('/sales_returns')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Nouveau retour de vente</h1>
                        <p className="text-sm text-slate-400">Retourner des produits et restaurer le stock</p>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-8 py-6">
                        <SalesReturnForm
                            invoices={invoices}
                            defaultValues={defaultValues}
                            isEdit={false}
                            processing={processing}
                            onSubmit={(data: any) => router.post('/sales_returns', data, {
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
