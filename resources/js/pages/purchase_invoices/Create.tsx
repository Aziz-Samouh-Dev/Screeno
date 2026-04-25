import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import InvoiceForm, { type InvoiceFormValues, type Supplier, type Product } from '@/components/PurchaseInvoices/invoice-form';

interface Props { suppliers: Supplier[]; products: Product[] }

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Factures d'achat", href: '/purchase_invoices' },
    { title: 'Nouvelle facture', href: '/purchase_invoices/create' },
];

export default function Create({ suppliers, products }: Props) {
    const defaultValues: InvoiceFormValues = {
        supplier_id:  suppliers[0]?.id ?? undefined,
        invoice_date: new Date().toISOString().slice(0, 10),
        items:        [],
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvelle facture d'achat" />

            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl"
                        onClick={() => router.visit('/purchase_invoices')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Nouvelle facture d'achat</h1>
                        <p className="text-sm text-slate-400">Enregistrer un achat auprès de votre fournisseur</p>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-8 py-6">
                        <InvoiceForm
                            suppliers={suppliers}
                            products={products}
                            defaultValues={defaultValues}
                            onSubmit={(data) => router.post('/purchase_invoices', data as any)}
                        />
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
