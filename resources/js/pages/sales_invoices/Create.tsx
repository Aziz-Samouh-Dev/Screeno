import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import InvoiceForm, { type InvoiceFormValues, type Client, type Product } from '@/components/SalesInvoices/invoice-form';

interface Props { clients: Client[]; products: Product[] }

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Factures de vente', href: '/sales_invoices' },
    { title: 'Nouvelle facture', href: '/sales_invoices/create' },
];

export default function Create({ clients, products }: Props) {
    const defaultValues: InvoiceFormValues = {
        client_id:    clients[0]?.id ?? undefined,
        invoice_date: new Date().toISOString().slice(0, 10),
        items:        [],
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvelle facture de vente" />

            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl"
                        onClick={() => router.visit('/sales_invoices')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Nouvelle facture de vente</h1>
                        <p className="text-sm text-slate-400">Créer une facture pour votre client</p>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-8 py-6">
                        <InvoiceForm
                            clients={clients}
                            products={products}
                            defaultValues={defaultValues}
                            onSubmit={(data) => router.post('/sales_invoices', data as any)}
                        />
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
