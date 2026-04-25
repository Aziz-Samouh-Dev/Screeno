import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import InvoiceForm, { type InvoiceFormValues, type Supplier, type Product } from '@/components/PurchaseInvoices/invoice-form';

interface PurchaseInvoice {
    id:           number;
    uuid:         string;
    code:         string;
    supplier_id:  number;
    invoice_date: string;
    notes?:       string;
    items: {
        id:           number;
        product_id:   number;
        product_name: string;
        quantity:     number;
        unit_price:   number;
    }[];
}

interface Props { invoice: PurchaseInvoice; suppliers: Supplier[]; products: Product[] }

export default function Edit({ invoice, suppliers, products }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Factures d'achat", href: '/purchase_invoices' },
        { title: invoice.code,        href: `/purchase_invoices/${invoice.uuid}` },
        { title: 'Modifier',           href: `/purchase_invoices/${invoice.uuid}/edit` },
    ];

    const defaultValues: InvoiceFormValues = {
        supplier_id:  invoice.supplier_id,
        invoice_date: invoice.invoice_date,
        notes:        invoice.notes,
        items: invoice.items.map(i => ({
            product_id:   i.product_id,
            product_name: i.product_name,
            quantity:     i.quantity,
            unit_price:   i.unit_price,
            sale_price:   0,
            is_new:       false,
        })),
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit — ${invoice.code}`} />

            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl"
                            onClick={() => router.visit(`/purchase_invoices/${invoice.uuid}`)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Modifier la facture</h1>
                            <p className="text-sm text-slate-400 font-mono">{invoice.code}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl"
                        onClick={() => router.visit(`/purchase_invoices/${invoice.uuid}`)}>
                        <Eye className="mr-2 h-4 w-4" /> Voir
                    </Button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-8 py-6">
                        <InvoiceForm
                            suppliers={suppliers}
                            products={products}
                            defaultValues={defaultValues}
                            onSubmit={(data) => {
                                router.post(`/purchase_invoices/${invoice.uuid}`, {
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
