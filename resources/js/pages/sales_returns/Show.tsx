"use client"
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    Edit2, 
    Trash2, 
    Printer, 
    ArrowLeft,
    Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Client {
    uuid: string;
    nom: string;
}

interface SalesInvoice {
    uuid: string;
    code: string;
}

interface ReturnItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string | number;
    total_price: string | number;
}

interface SalesReturn {
    uuid: string;
    return_date: string;
    total_amount: string | number;
    notes?: string;
    client: Client;
    invoice: SalesInvoice;
    items: ReturnItem[];
}

interface Props {
    return: SalesReturn;   // Changed to match controller's 'return' key
}

export default function Show({ return: salesReturn }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Sales Returns', href: '/sales_returns' },
        { title: salesReturn.uuid.slice(0, 8) + '...', href: `/sales_returns/${salesReturn.uuid}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Return #${salesReturn.uuid.slice(0, 8)}`} />

            {/* Print styles */}
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body * { visibility: hidden; }
                    #printable-return, #printable-return * { visibility: visible; }
                    #printable-return { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header Actions */}
                <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Button
                        variant="link"
                        onClick={() => router.visit('/sales_returns')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Returns
                    </Button>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.visit(`/sales_returns/${salesReturn.uuid}/edit`)}
                        >
                            <Edit2 className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this return?')) {
                                    router.delete(`/sales_returns/${salesReturn.uuid}`);
                                }
                            }}
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                    </div>
                </div>

                {/* Printable Return */}
                <div 
                    id="printable-return" 
                    className="bg-white w-full border rounded-2xl shadow-xl p-8 mx-auto print:shadow-none print:max-w-none"
                >
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-3">
                            <Package className="h-10 w-10 text-red-600" />
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter text-slate-900">SALES RETURN</h1>
                                <p className="text-sm text-slate-500 font-mono">#{salesReturn.uuid}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Return Date</p>
                            <p className="font-semibold text-lg">{salesReturn.return_date}</p>
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                        <div>
                            <p className="uppercase text-xs tracking-widest text-slate-400 mb-2">Client</p>
                            <p className="font-bold text-xl">{salesReturn.client.nom}</p>
                        </div>
                        <div>
                            <p className="uppercase text-xs tracking-widest text-slate-400 mb-2">Original Invoice</p>
                            <Button 
                                variant="link" 
                                className="p-0 h-auto font-semibold text-blue-600"
                                onClick={() => router.visit(`/sales_invoices/${salesReturn.invoice.uuid}`)}
                            >
                                {salesReturn.invoice.code}
                            </Button>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-10">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 text-xs uppercase tracking-widest text-slate-400">
                                    <th className="py-4 text-left">Product</th>
                                    <th className="py-4 text-center">Qty</th>
                                    <th className="py-4 text-right">Unit Price</th>
                                    <th className="py-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {salesReturn.items.map((item, idx) => (
                                    <tr key={idx} className="text-sm">
                                        <td className="py-5 font-medium">{item.product_name}</td>
                                        <td className="py-5 text-center font-mono">{item.quantity}</td>
                                        <td className="py-5 text-right">
                                            ${Number(item.unit_price).toFixed(2)}
                                        </td>
                                        <td className="py-5 text-right font-semibold">
                                            ${Number(item.total_price).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-72 space-y-3">
                            <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-4">
                                <span>Total Return</span>
                                <span className="text-red-600">
                                    ${Number(salesReturn.total_amount).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {salesReturn.notes && (
                        <div className="mt-12 pt-8 border-t">
                            <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Notes</p>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {salesReturn.notes}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}