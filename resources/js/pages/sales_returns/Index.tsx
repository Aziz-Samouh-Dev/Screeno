import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus, Search, PackageX, ChevronLeft, ChevronRight,
    Eye, Edit2, Trash2, RotateCcw,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';

interface SalesReturn {
    uuid:         string;
    return_date:  string;
    total_amount: number;
    client:       { uuid: string; nom: string };
    invoice:      { uuid: string; code: string };
}
interface PaginatedData {
    data:         SalesReturn[];
    total:        number;
    current_page: number;
    last_page:    number;
    per_page:     number;
}
interface Props {
    returns: PaginatedData;
    filters: { search: string; per_page: string };
}

function fmt(n: number) { return Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2 }); }

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Retours de vente', href: '/sales_returns' }];

export default function Index() {
    const { returns, filters } = usePage().props as unknown as Props;

    const [search,     setSearch]     = useState(filters.search   || '');
    const [perPage,    setPerPage]    = useState(filters.per_page ?? '10');
    const [processing, setProcessing] = useState(false);

    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/sales_returns', { search, per_page: perPage }, {
                preserveState: true, preserveScroll: true, replace: true,
            });
        }, 350);
        return () => clearTimeout(t);
    }, [search, perPage]);

    const handleDelete = (uuid: string) => {
        confirm({
            title: 'Supprimer ce retour ?',
            description: 'Ce retour et ses lignes seront définitivement supprimés. Cette action est irréversible.',
            onConfirm: () => {
                setProcessing(true);
                router.delete(`/sales_returns/${uuid}`, {
                    onFinish: () => { setProcessing(false); closeConfirm(); },
                });
            },
        });
    };

    const total = returns.data.reduce((s, r) => s + Number(r.total_amount), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Retours de vente" />

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
                        <h1 className="text-xl font-bold text-slate-900">Retours de vente</h1>
                        <p className="text-sm text-slate-400">Traitez les retours clients et restockez l'inventaire</p>
                    </div>
                    <Button className="rounded-xl" onClick={() => router.visit('/sales_returns/create')}>
                        <Plus className="mr-2 h-4 w-4" /> Nouveau retour
                    </Button>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { label: 'Total retours',    value: `${returns.total}`,            icon: RotateCcw,  bg: 'bg-rose-50',   ic: 'text-rose-500'   },
                        { label: 'Valeur (page)',     value: `${fmt(total)} MAD`,            icon: PackageX,   bg: 'bg-amber-50',  ic: 'text-amber-500'  },
                        { label: 'Cette page',        value: `${returns.data.length} retours`, icon: PackageX, bg: 'bg-slate-100', ic: 'text-slate-500'  },
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
                    <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Rechercher client, facture ou ID…" className="pl-9 rounded-xl h-9"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead>ID Retour</TableHead>
                                    <TableHead>Facture</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-28 text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {returns.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-16 text-center text-slate-400">
                                            <PackageX className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                            Aucun retour trouvé
                                        </TableCell>
                                    </TableRow>
                                ) : returns.data.map((ret) => (
                                    <TableRow key={ret.uuid} className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => router.visit(`/sales_returns/${ret.uuid}`)}>
                                        <TableCell className="font-mono text-xs text-slate-500">{ret.uuid.slice(0, 8)}…</TableCell>
                                        <TableCell className="font-semibold text-blue-600 text-sm" onClick={e => e.stopPropagation()}>
                                            <button className="hover:underline"
                                                onClick={() => router.visit(`/sales_invoices/${ret.invoice.uuid}`)}>
                                                {ret.invoice.code}
                                            </button>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-800">{ret.client.nom}</TableCell>
                                        <TableCell className="text-slate-500 text-sm">{ret.return_date}</TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-rose-600">{fmt(ret.total_amount)} MAD</TableCell>
                                        <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                                                    onClick={() => router.visit(`/sales_returns/${ret.uuid}`)}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                                                    onClick={() => router.visit(`/sales_returns/${ret.uuid}/edit`)}>
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-red-500 hover:bg-red-50"
                                                    onClick={() => handleDelete(ret.uuid)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-xs text-slate-400">{returns.total} retours au total</p>
                        <div className="flex items-center gap-3">
                            <Select value={perPage} onValueChange={setPerPage}>
                                <SelectTrigger className="h-7 w-16 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['5','10','25','50'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <span className="text-xs text-slate-400">Page {returns.current_page} / {returns.last_page}</span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={returns.current_page === 1}
                                    onClick={() => router.get('/sales_returns', { ...filters, page: returns.current_page - 1 }, { preserveState: true })}>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={returns.current_page === returns.last_page}
                                    onClick={() => router.get('/sales_returns', { ...filters, page: returns.current_page + 1 }, { preserveState: true })}>
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
