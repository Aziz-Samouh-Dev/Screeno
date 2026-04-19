import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import PaymentSheet from '@/components/SalesInvoices/PaymentSheet';
import { ArrowLeft, Edit2, Trash2, Printer, Calendar, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
    name: string; address?: string; city?: string; country?: string;
    phone?: string; email?: string; tax_id?: string; ice?: string; notes?: string;
}

interface Client {
    nom: string; email?: string; telephone?: string;
    adresse?: string; ville?: string; pays?: string;
}

interface Item {
    id: number; product_name: string;
    quantity: number; unit_price: string; total_price: string;
}

interface Payment {
    uuid: string; amount: string; payment_date: string; notes?: string;
    payment_method: { name: string };
}

interface Invoice {
    uuid: string; code: string; invoice_date: string;
    status: 'paid' | 'partial' | 'unpaid';
    subtotal: string; tax_amount: string; total_amount: string;
    paid_amount: string; remaining_amount: string; notes?: string;
    client: Client; items: Item[]; payments: Payment[];
}

interface Props { invoice: Invoice; paymentMethods: { uuid: string; name: string }[] }

function statusInfo(s: string) {
    if (s === 'paid')    return { cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500',  label: 'Payée'    };
    if (s === 'partial') return { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500',  label: 'Partielle' };
    return                      { cls: 'bg-red-50   text-red-700   border-red-200',   dot: 'bg-red-500',    label: 'Impayée'  };
}

function fmt(n: string | number) { return Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }); }

export default function Show({ invoice, paymentMethods }: Props) {
    const { company } = usePage().props as { company: Company };
    const si = statusInfo(invoice.status);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Factures de vente', href: '/sales_invoices' },
        { title: invoice.code,        href: `/sales_invoices/${invoice.uuid}` },
    ];

    const handleDelete = () => {
        if (!confirm('Supprimer cette facture ?')) return;
        router.delete(`/sales_invoices/${invoice.uuid}`, {
            onSuccess: () => toast.success('Invoice deleted.'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={invoice.code} />

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 10mm 12mm; }
                    body * { visibility: hidden !important; }
                    #si-print, #si-print * { visibility: visible !important; }
                    #si-print { position: fixed; inset: 0; background: white; padding: 0; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>

            <div className="flex flex-col gap-6 p-6">

                {/* HEADER ACTIONS */}
                <div className="print:hidden flex items-center justify-between gap-4">
                    <Button variant="ghost" size="sm" className="rounded-xl"
                        onClick={() => router.visit('/sales_invoices')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Factures de vente
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" /> Imprimer
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl"
                            onClick={() => router.visit(`/sales_returns/create?sales_invoice_id=${invoice.uuid}`)}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Retour
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl"
                            onClick={() => router.visit(`/sales_invoices/${invoice.uuid}/edit`)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Modifier
                        </Button>
                        <Button variant="destructive" size="sm" className="rounded-xl" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* PRINT TEMPLATE */}
                <div id="si-print" className="hidden print:block bg-white">
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                            <div>
                                <h1 className="text-4xl font-black tracking-tight text-slate-900">FACTURE DE VENTE</h1>
                                <p className="font-mono text-slate-500 mt-1">{invoice.code}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-xs text-slate-400 uppercase tracking-wide">Date</p>
                                <p className="font-semibold text-slate-800">{invoice.invoice_date}</p>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${si.cls}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${si.dot}`} />{si.label}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">De (Notre société)</p>
                                <p className="font-black text-slate-900">{company?.name || 'My Company'}</p>
                                {company?.address && <p className="text-sm text-slate-500">{company.address}</p>}
                                {(company?.city || company?.country) && <p className="text-sm text-slate-500">{[company.city, company.country].filter(Boolean).join(', ')}</p>}
                                {company?.phone  && <p className="text-sm text-slate-500">{company.phone}</p>}
                                {company?.email  && <p className="text-sm text-slate-500">{company.email}</p>}
                                {company?.tax_id && <p className="text-sm text-slate-500">IF: {company.tax_id}</p>}
                                {company?.ice    && <p className="text-sm text-slate-500">ICE: {company.ice}</p>}
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">À (Client)</p>
                                <p className="font-black text-slate-900">{invoice.client?.nom}</p>
                                {invoice.client?.adresse && <p className="text-sm text-slate-500">{invoice.client.adresse}</p>}
                                {(invoice.client?.ville || invoice.client?.pays) && (
                                    <p className="text-sm text-slate-500">{[invoice.client.ville, invoice.client.pays].filter(Boolean).join(', ')}</p>
                                )}
                                {invoice.client?.telephone && <p className="text-sm text-slate-500">{invoice.client.telephone}</p>}
                                {invoice.client?.email     && <p className="text-sm text-slate-500">{invoice.client.email}</p>}
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
                                {invoice.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-2 font-medium">{item.product_name}</td>
                                        <td className="py-2 text-center">{item.quantity}</td>
                                        <td className="py-2 text-right font-mono">{fmt(item.unit_price)} MAD</td>
                                        <td className="py-2 text-right font-mono font-semibold">{fmt(item.total_price)} MAD</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex justify-end">
                            <div className="w-64 space-y-1.5 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Sous-total</span><span className="font-mono">{fmt(invoice.subtotal)} MAD</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">TVA</span><span className="font-mono">{fmt(invoice.tax_amount)} MAD</span></div>
                                <div className="flex justify-between font-bold border-t border-slate-200 pt-1.5 text-base">
                                    <span>Total</span><span className="font-mono">{fmt(invoice.total_amount)} MAD</span>
                                </div>
                                {invoice.status !== 'paid' && (
                                    <div className="flex justify-between text-amber-600">
                                        <span>Restant</span><span className="font-mono">{fmt(invoice.remaining_amount)} MAD</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {(invoice.notes || company?.notes) && (
                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Notes</p>
                                <p className="text-sm text-slate-500">{invoice.notes || company?.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SCREEN VIEW */}
                <div className="print:hidden rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">

                    <div className="flex flex-col md:flex-row items-start justify-between gap-6 p-8 border-b border-slate-100">
                        <div className="space-y-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white">
                                {invoice.client?.nom?.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900">Facture de vente</h1>
                                <p className="font-mono text-sm text-slate-400 mt-0.5">{invoice.code}</p>
                            </div>
                        </div>
                        <div className="text-right space-y-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${si.cls}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${si.dot}`} />{si.label}
                            </span>
                            <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
                                <Calendar className="h-4 w-4" />{invoice.invoice_date}
                            </div>
                            {invoice.status !== 'paid' && (
                                <p className="text-sm font-semibold text-amber-600">
                                    Solde : {fmt(invoice.remaining_amount)} MAD
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 px-8 py-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Client</p>
                            <p className="font-bold text-slate-900 text-lg">{invoice.client?.nom}</p>
                            <p className="text-sm text-slate-500 leading-relaxed mt-1">
                                {invoice.client?.adresse && <span className="block">{invoice.client.adresse}</span>}
                                {(invoice.client?.ville || invoice.client?.pays) && (
                                    <span className="block">{[invoice.client.ville, invoice.client.pays].filter(Boolean).join(', ')}</span>
                                )}
                                {invoice.client?.telephone && <span className="block">{invoice.client.telephone}</span>}
                                {invoice.client?.email     && <span className="block">{invoice.client.email}</span>}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Notre société</p>
                            <p className="font-bold text-slate-900 text-lg">{company?.name || 'My Company'}</p>
                            <p className="text-sm text-slate-500 leading-relaxed mt-1">
                                {company?.address && <span className="block">{company.address}</span>}
                                {(company?.city || company?.country) && <span className="block">{[company.city, company.country].filter(Boolean).join(', ')}</span>}
                                {company?.phone  && <span className="block">{company.phone}</span>}
                                {company?.tax_id && <span className="block">IF: {company.tax_id}</span>}
                            </p>
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
                                {invoice.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-4 font-semibold text-slate-900">{item.product_name}</td>
                                        <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                                        <td className="py-4 text-right font-mono text-slate-600">{fmt(item.unit_price)} MAD</td>
                                        <td className="py-4 text-right font-mono font-bold text-slate-900">{fmt(item.total_price)} MAD</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900 px-8 py-6 text-white">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide">Total TTC</p>
                            <p className="text-2xl font-black mt-1">{fmt(invoice.total_amount)} MAD</p>
                        </div>
                        <div>
                            {invoice.status === 'paid' ? (
                                <div className="flex items-center gap-2 font-bold text-green-400">
                                    <CheckCircle2 className="h-5 w-5" /> Entièrement payée
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 font-bold text-amber-400">
                                    <AlertCircle className="h-5 w-5" />
                                    Solde : {fmt(invoice.remaining_amount)} MAD
                                </div>
                            )}
                        </div>
                    </div>

                    {invoice.notes && (
                        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Notes</p>
                            <p className="text-sm text-slate-600">{invoice.notes}</p>
                        </div>
                    )}
                </div>

                {/* PAYMENTS */}
                <div className="print:hidden">
                    <PaymentSheet
                        invoiceUuid={invoice.uuid}
                        remainingAmount={Number(invoice.remaining_amount)}
                        paymentMethods={paymentMethods}
                        payments={invoice.payments}
                        isPaid={invoice.status === 'paid'}
                    />
                </div>

            </div>
        </AppLayout>
    );
}
