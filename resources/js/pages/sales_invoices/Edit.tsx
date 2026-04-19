import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import InvoiceForm, { type InvoiceFormValues, type Client, type Product } from '@/components/SalesInvoices/invoice-form';

interface SalesInvoice {
    id:           number;
    uuid:         string;
    code:         string;
    client_id:    number;
    invoice_date: string;
    notes?:       string;
    items: { id: number; product_id: number; quantity: number; unit_price: number }[];
}

interface Props { invoice: SalesInvoice; clients: Client[]; products: Product[] }

export default function Edit({ invoice, clients, products }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Factures de vente', href: '/sales_invoices' },
        { title: invoice.code,     href: `/sales_invoices/${invoice.uuid}` },
        { title: 'Modifier', href: `/sales_invoices/${invoice.uuid}/edit` },
    ];

    const defaultValues: InvoiceFormValues = {
        client_id:    invoice.client_id,
        invoice_date: invoice.invoice_date,
        notes:        invoice.notes ?? '',
        items: invoice.items.map(i => ({
            product_id: i.product_id,
            quantity:   i.quantity,
            unit_price: i.unit_price,
        })),
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit — ${invoice.code}`} />

            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl"
                            onClick={() => router.visit(`/sales_invoices/${invoice.uuid}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Modifier la facture</h1>
                            <p className="text-sm text-slate-400 font-mono">{invoice.code}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl"
                        onClick={() => router.visit(`/sales_invoices/${invoice.uuid}`)}>
                        <Eye className="mr-2 h-4 w-4" /> Voir
                    </Button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-8 py-6">
                        <InvoiceForm
                            clients={clients}
                            products={products}
                            defaultValues={defaultValues}
                            onSubmit={(data) => {
                                router.post(`/sales_invoices/${invoice.uuid}`, {
                                    ...data, _method: 'put',
                                } as any);
                            }}
                        />
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
