import { useState, useEffect, ReactNode } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    Plus, Search, ShoppingCart, TrendingDown, AlertCircle, CheckCircle2,
    ChevronLeft, ChevronRight, Eye, Edit2, Trash2,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';

interface PurchaseInvoice {
    uuid:             string;
    code:             string;
    invoice_date:     string;
    total_amount:     number;
    paid_amount:      number;
    remaining_amount: number;
    status:           'paid' | 'partial' | 'unpaid';
    supplier:         { uuid: string; nom: string };
}
interface PaginatedData {
    data: PurchaseInvoice[];
    total: ReactNode;
    current_page: number;
    last_page: number;
}
interface Props {
    purchaseInvoices: PaginatedData;
    filters: { search: string; status: string; per_page: string };
}

function statusBadge(s: string) {
    if (s === 'paid')    return { cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500',  label: 'Payée'    };
    if (s === 'partial') return { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500',  label: 'Partielle' };
    return                      { cls: 'bg-red-50   text-red-700   border-red-200',   dot: 'bg-red-500',    label: 'Impayée'  };
}

function fmt(n: number) { return Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }); }

const breadcrumbs: BreadcrumbItem[] = [{ title: "Factures d'achat", href: '/purchase_invoices' }];

export default function Index() {
    const { purchaseInvoices, filters } = usePage().props as unknown as Props;

    const [search,  setSearch]  = useState(filters.search  || '');
    const [status,  setStatus]  = useState(filters.status  || 'all');
    const [perPage, setPerPage] = useState(filters.per_page ?? '10');
    const [processing, setProcessing] = useState(false);

    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/purchase_invoices', {
                search, status: status === 'all' ? undefined : status, per_page: perPage,
            }, { preserveState: true, preserveScroll: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search, status, perPage]);

    const handleDelete = (uuid: string, code: string) => {
        confirm({
            title: 'Supprimer cette facture ?',
            description: `La facture « ${code} » sera définitivement supprimée. Cette action est irréversible.`,
            onConfirm: () => {
                setProcessing(true);
                router.delete(`/purchase_invoices/${uuid}`, {
                    onSuccess: () => toast.success("Facture supprimée."),
                    onFinish:  () => { setProcessing(false); closeConfirm(); },
                });
            },
        });
    };

    const total      = purchaseInvoices.data.reduce((s, i) => s + Number(i.total_amount), 0);
    const paid       = purchaseInvoices.data.reduce((s, i) => s + Number(i.paid_amount), 0);
    const balance    = purchaseInvoices.data.reduce((s, i) => s + Number(i.remaining_amount), 0);
    const unpaidCount = purchaseInvoices.data.filter(i => i.status !== 'paid').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Factures d'achat" />

            <ConfirmDialog
                open={confirmState.open}
                onOpenChange={closeConfirm}
                title={confirmState.title}
                description={confirmState.description}
                onConfirm={confirmState.onConfirm}
                loading={processing}
            />

            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Factures d'achat</h1>
                        <p className="text-sm text-slate-400">Suivez les factures fournisseurs entrantes</p>
                    </div>
                    <Button className="rounded-xl" onClick={() => router.visit('/purchase_invoices/create')}>
                        <Plus className="mr-2 h-4 w-4" /> Nouvelle facture
                    </Button>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total (page)',  value: `${fmt(total)} MAD`,   icon: ShoppingCart,  bg: 'bg-violet-50', ic: 'text-violet-500' },
                        { label: 'Payé',          value: `${fmt(paid)} MAD`,    icon: CheckCircle2,  bg: 'bg-green-50',  ic: 'text-green-500'  },
                        { label: 'En attente',    value: `${fmt(balance)} MAD`, icon: TrendingDown,  bg: 'bg-red-50',    ic: 'text-red-500'    },
                        { label: 'Non soldées',   value: `${unpaidCount} fact.`, icon: AlertCircle,  bg: 'bg-amber-50',  ic: 'text-amber-500'  },
                    ].map((c) => (
                        <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{c.label}</p>
                                <div className={`rounded-lg ${c.bg} p-1.5`}><c.icon className={`h-3.5 w-3.5 ${c.ic}`} /></div>
                            </div>
                            <p className="text-lg font-black text-slate-900">{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* TABLE CARD */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Rechercher fournisseur ou code…" className="pl-9 rounded-xl h-9"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="rounded-xl h-9 w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="paid">Payée</SelectItem>
                                <SelectItem value="partial">Partielle</SelectItem>
                                <SelectItem value="unpaid">Impayée</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead>Code</TableHead>
                                    <TableHead>Fournisseur</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Payé</TableHead>
                                    <TableHead className="text-right">Solde</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="w-28 text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseInvoices.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-16 text-center text-slate-400">
                                            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                            Aucune facture trouvée
                                        </TableCell>
                                    </TableRow>
                                ) : purchaseInvoices.data.map((inv) => {
                                    const si = statusBadge(inv.status);
                                    return (
                                        <TableRow key={inv.uuid} className="cursor-pointer hover:bg-slate-50"
                                            onClick={() => router.visit(`/purchase_invoices/${inv.uuid}`)}>
                                            <TableCell className="font-mono font-semibold text-slate-700 text-sm">{inv.code}</TableCell>
                                            <TableCell className="font-medium text-slate-800">{inv.supplier?.nom}</TableCell>
                                            <TableCell className="text-slate-500 text-sm">{inv.invoice_date}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{fmt(inv.total_amount)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-green-600">{fmt(inv.paid_amount)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-amber-600">{fmt(inv.remaining_amount)}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${si.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${si.dot}`} />{si.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                                                        onClick={() => router.visit(`/purchase_invoices/${inv.uuid}`)}>
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                                                        onClick={() => router.visit(`/purchase_invoices/${inv.uuid}/edit`)}>
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-red-500 hover:bg-red-50"
                                                        onClick={() => handleDelete(inv.uuid, inv.code)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-xs text-slate-400">{purchaseInvoices.total} factures au total</p>
                        <div className="flex items-center gap-3">
                            <Select value={perPage} onValueChange={setPerPage}>
                                <SelectTrigger className="h-7 w-16 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['5','10','25','50'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <span className="text-xs text-slate-400">Page {purchaseInvoices.current_page} / {purchaseInvoices.last_page}</span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={purchaseInvoices.current_page === 1}
                                    onClick={() => router.get('/purchase_invoices', { ...filters, page: purchaseInvoices.current_page - 1 }, { preserveState: true })}>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={purchaseInvoices.current_page === purchaseInvoices.last_page}
                                    onClick={() => router.get('/purchase_invoices', { ...filters, page: purchaseInvoices.current_page + 1 }, { preserveState: true })}>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
