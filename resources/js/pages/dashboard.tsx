import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    TrendingUp, TrendingDown, ShoppingCart, FileText,
    PackageX, AlertTriangle, ArrowRight, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardStats {
    sales_revenue:        number;
    sales_outstanding:    number;
    purchase_expenses:    number;
    purchase_outstanding: number;
    sales_count:          number;
    purchase_count:       number;
    returns_count:        number;
    low_stock_count:      number;
}

interface RecentInvoice {
    uuid:             string;
    code:             string;
    invoice_date:     string;
    total_amount:     number;
    paid_amount:      number;
    remaining_amount: number;
    status:           'paid' | 'partial' | 'unpaid';
    client?:          { nom: string };
    supplier?:        { nom: string };
}

interface LowStockProduct {
    uuid:           string;
    nom:            string;
    sku:            string;
    stock_quantity: number;
}

interface Props {
    stats:                  DashboardStats;
    recentSalesInvoices:    RecentInvoice[];
    recentPurchaseInvoices: RecentInvoice[];
    lowStockProducts:       LowStockProduct[];
}

function statusInfo(s: string) {
    if (s === 'paid')    return { cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500',  label: 'Payée'    };
    if (s === 'partial') return { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500',  label: 'Partielle' };
    return                      { cls: 'bg-red-50   text-red-700   border-red-200',   dot: 'bg-red-500',    label: 'Impayée'  };
}

function fmt(n: number) { return Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tableau de bord', href: '/dashboard' }];

export default function Dashboard() {
    const { stats, recentSalesInvoices, recentPurchaseInvoices, lowStockProducts } = usePage().props as unknown as Props;

    const statCards = [
        {
            label: 'Chiffre d\'affaires',
            value: `${fmt(stats.sales_revenue)} MAD`,
            sub:   `${fmt(stats.sales_outstanding)} MAD en attente`,
            icon:  TrendingUp,
            bg:    'bg-green-50', iconColor: 'text-green-500', accent: 'text-green-700',
        },
        {
            label: 'Dépenses d\'achat',
            value: `${fmt(stats.purchase_expenses)} MAD`,
            sub:   `${fmt(stats.purchase_outstanding)} MAD à payer`,
            icon:  TrendingDown,
            bg:    'bg-red-50', iconColor: 'text-red-500', accent: 'text-red-700',
        },
        {
            label: 'Factures de vente',
            value: stats.sales_count,
            sub:   'Factures créées',
            icon:  FileText,
            bg:    'bg-blue-50', iconColor: 'text-blue-500', accent: 'text-blue-700',
        },
        {
            label: 'Factures d\'achat',
            value: stats.purchase_count,
            sub:   'Commandes fournisseurs',
            icon:  ShoppingCart,
            bg:    'bg-violet-50', iconColor: 'text-violet-500', accent: 'text-violet-700',
        },
        {
            label: 'Retours de vente',
            value: stats.returns_count,
            sub:   'Retours traités',
            icon:  PackageX,
            bg:    'bg-rose-50', iconColor: 'text-rose-500', accent: 'text-rose-700',
        },
        {
            label: 'Stock faible',
            value: stats.low_stock_count,
            sub:   'Produits à réapprovisionner',
            icon:  AlertTriangle,
            bg:    stats.low_stock_count > 0 ? 'bg-amber-50' : 'bg-slate-50',
            iconColor: stats.low_stock_count > 0 ? 'text-amber-500' : 'text-slate-400',
            accent: stats.low_stock_count > 0 ? 'text-amber-700' : 'text-slate-500',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tableau de bord" />

            <div className="flex flex-col gap-6 p-6">

                {/* STAT CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {statCards.map((card) => (
                        <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{card.label}</p>
                                <div className={`rounded-lg ${card.bg} p-2`}>
                                    <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-slate-900">{card.value}</p>
                            <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                        </div>
                    ))}
                </div>

                {/* NET MARGIN BANNER */}
                {(() => {
                    const net = stats.sales_revenue - stats.purchase_expenses;
                    const isPos = net >= 0;
                    return (
                        <div className={`rounded-2xl border p-5 shadow-sm ${isPos ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Marge nette (CA − Dépenses)</p>
                                    <p className={`text-3xl font-black mt-1 ${isPos ? 'text-green-700' : 'text-red-700'}`}>
                                        {isPos ? '+' : ''}{fmt(net)} MAD
                                    </p>
                                </div>
                                <TrendingUp className={`h-10 w-10 opacity-20 ${isPos ? 'text-green-500' : 'text-red-500'}`} />
                            </div>
                        </div>
                    );
                })()}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* RECENT SALES INVOICES */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h2 className="font-bold text-slate-900">Factures de vente récentes</h2>
                            <Button variant="ghost" size="sm" className="text-xs text-slate-400 rounded-xl"
                                onClick={() => router.visit('/sales_invoices')}>
                                Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentSalesInvoices.length === 0 ? (
                                <p className="p-5 text-sm text-slate-400 text-center">Aucune facture de vente.</p>
                            ) : recentSalesInvoices.map((inv) => {
                                const si = statusInfo(inv.status);
                                return (
                                    <div key={inv.uuid}
                                        className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => router.visit(`/sales_invoices/${inv.uuid}`)}>
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{inv.code}</p>
                                            <p className="text-xs text-slate-400">{inv.client?.nom} · {inv.invoice_date}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm font-semibold text-slate-700">{fmt(inv.total_amount)}</span>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${si.cls}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${si.dot}`} />
                                                {si.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RECENT PURCHASE INVOICES */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h2 className="font-bold text-slate-900">Factures d'achat récentes</h2>
                            <Button variant="ghost" size="sm" className="text-xs text-slate-400 rounded-xl"
                                onClick={() => router.visit('/purchase_invoices')}>
                                Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentPurchaseInvoices.length === 0 ? (
                                <p className="p-5 text-sm text-slate-400 text-center">Aucune facture d'achat.</p>
                            ) : recentPurchaseInvoices.map((inv) => {
                                const si = statusInfo(inv.status);
                                return (
                                    <div key={inv.uuid}
                                        className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => router.visit(`/purchase_invoices/${inv.uuid}`)}>
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{inv.code}</p>
                                            <p className="text-xs text-slate-400">{inv.supplier?.nom} · {inv.invoice_date}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm font-semibold text-slate-700">{fmt(inv.total_amount)}</span>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${si.cls}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${si.dot}`} />
                                                {si.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* LOW STOCK */}
                {lowStockProducts.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-amber-100">
                            <h2 className="font-bold text-amber-900 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" /> Alerte stock faible
                            </h2>
                            <Button variant="ghost" size="sm" className="text-xs text-amber-600 rounded-xl"
                                onClick={() => router.visit('/produits')}>
                                Voir les produits <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                        <div className="divide-y divide-amber-100">
                            {lowStockProducts.map((p) => (
                                <div key={p.uuid}
                                    className="flex items-center justify-between px-5 py-3 hover:bg-amber-100/50 cursor-pointer"
                                    onClick={() => router.visit(`/produits/${p.uuid}`)}>
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-amber-100 p-2">
                                            <Package className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{p.nom}</p>
                                            <p className="text-xs text-slate-500 font-mono">{p.sku}</p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-lg ${p.stock_quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                        {p.stock_quantity}
                                        <span className="text-xs font-normal ml-1">unités</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
