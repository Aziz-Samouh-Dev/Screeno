import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit2, Trash2, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
    name: string; address?: string; city?: string; country?: string;
    phone?: string; email?: string; tax_id?: string; ice?: string;
}

interface SalesReturn {
    uuid:         string;
    return_date:  string;
    total_amount: string | number;
    notes?:       string;
    client:       { uuid: string; nom: string };
    invoice:      { uuid: string; code: string };
    items:        { id: number; product_name: string; quantity: number; unit_price: string | number; total_price: string | number }[];
}

interface Props { return: SalesReturn }

function fmt(n: string | number) { return Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }); }

export default function Show({ return: ret }: Props) {
    const { company } = usePage().props as { company: Company };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Retours de vente', href: '/sales_returns' },
        { title: ret.uuid.slice(0, 8) + '…', href: `/sales_returns/${ret.uuid}` },
    ];

    const handleDelete = () => {
        if (!confirm('Supprimer ce retour ?')) return;
        router.delete(`/sales_returns/${ret.uuid}`, {
            onSuccess: () => toast.success('Return deleted.'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Return ${ret.uuid.slice(0, 8)}`} />

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 10mm 12mm; }
                    body * { visibility: hidden !important; }
                    #sr-print, #sr-print * { visibility: visible !important; }
                    #sr-print { position: fixed; inset: 0; background: white; padding: 0; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>

            <div className="flex flex-col gap-6 p-6">

                {/* ACTIONS */}
                <div className="print:hidden flex items-center justify-between gap-4">
                    <Button variant="ghost" size="sm" className="rounded-xl"
                        onClick={() => router.visit('/sales_returns')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retours de vente
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" /> Imprimer
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl"
                            onClick={() => router.visit(`/sales_returns/${ret.uuid}/edit`)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Modifier
                        </Button>
                        <Button variant="destructive" size="sm" className="rounded-xl" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* PRINT TEMPLATE */}
                <div id="sr-print" className="hidden print:block bg-white">
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-start border-b-2 border-rose-600 pb-6">
                            <div>
                                <h1 className="text-4xl font-black tracking-tight text-slate-900">RETOUR DE VENTE</h1>
                                <p className="font-mono text-slate-500 mt-1">#{ret.uuid}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 uppercase tracking-wide">Date du retour</p>
                                <p className="font-semibold text-slate-800">{ret.return_date}</p>
                                <p className="text-xs text-slate-400 mt-1">Facture : {ret.invoice.code}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Client</p>
                                <p className="font-black text-slate-900">{ret.client.nom}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Société</p>
                                <p className="font-black text-slate-900">{company?.name || 'My Company'}</p>
                                {company?.address && <p className="text-sm text-slate-500">{company.address}</p>}
                                {(company?.city || company?.country) && <p className="text-sm text-slate-500">{[company.city, company.country].filter(Boolean).join(', ')}</p>}
                                {company?.tax_id && <p className="text-sm text-slate-500">IF: {company.tax_id}</p>}
                            </div>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-y border-slate-200 text-xs uppercase tracking-widest text-slate-400">
                                    <th className="py-2 text-left">Produit</th>
                                    <th className="py-2 text-center">Qté</th>
                                    <th className="py-2 text-right">Prix unitaire</th>
                                    <th className="py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ret.items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="py-2 font-medium">{item.product_name}</td>
                                        <td className="py-2 text-center">{item.quantity}</td>
                                        <td className="py-2 text-right font-mono">{fmt(item.unit_price)} MAD</td>
                                        <td className="py-2 text-right font-mono font-semibold">{fmt(item.total_price)} MAD</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex justify-end">
                            <div className="w-64 border-t border-slate-200 pt-3">
                                <div className="flex justify-between font-bold text-base text-rose-600">
                                    <span>Total retour</span>
                                    <span className="font-mono">{fmt(ret.total_amount)} MAD</span>
                                </div>
                            </div>
                        </div>
                        {ret.notes && (
                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Notes</p>
                                <p className="text-sm text-slate-500">{ret.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SCREEN VIEW */}
                <div className="print:hidden rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">

                    <div className="flex flex-col md:flex-row items-start justify-between gap-6 p-8 border-b border-slate-100">
                        <div className="space-y-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 text-xl font-black text-white">
                                {ret.client.nom.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900">Retour de vente</h1>
                                <p className="font-mono text-xs text-slate-400 mt-0.5">#{ret.uuid}</p>
                            </div>
                        </div>
                        <div className="text-right space-y-1.5">
                            <p className="text-sm text-slate-500">{ret.return_date}</p>
                            <button className="text-sm font-semibold text-blue-600 hover:underline"
                                onClick={() => router.visit(`/sales_invoices/${ret.invoice.uuid}`)}>
                                Facture : {ret.invoice.code}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 px-8 py-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Client</p>
                            <p className="font-bold text-slate-900 text-lg">{ret.client.nom}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Notre société</p>
                            <p className="font-bold text-slate-900 text-lg">{company?.name || 'My Company'}</p>
                            {company?.address && <p className="text-sm text-slate-500">{company.address}</p>}
                            {company?.tax_id  && <p className="text-sm text-slate-500">IF: {company.tax_id}</p>}
                        </div>
                    </div>

                    <div className="px-8 py-6">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-widest text-slate-400">
                                    <th className="pb-3">Produit</th>
                                    <th className="pb-3 text-center">Qté</th>
                                    <th className="pb-3 text-right">Prix unitaire</th>
                                    <th className="pb-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {ret.items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="py-4 font-semibold text-slate-900">{item.product_name}</td>
                                        <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                                        <td className="py-4 text-right font-mono text-slate-600">{fmt(item.unit_price)} MAD</td>
                                        <td className="py-4 text-right font-mono font-bold text-rose-600">{fmt(item.total_price)} MAD</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between bg-rose-600 px-8 py-6 text-white">
                        <div>
                            <p className="text-xs text-rose-200 uppercase tracking-wide">Montant total du retour</p>
                            <p className="text-2xl font-black mt-1">{fmt(ret.total_amount)} MAD</p>
                        </div>
                    </div>

                    {ret.notes && (
                        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Notes</p>
                            <p className="text-sm text-slate-600">{ret.notes}</p>
                        </div>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
