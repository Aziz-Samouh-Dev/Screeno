import { useState, useEffect, ReactNode } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft,
    Plus, Package, AlertCircle, XCircle, Layers, Search, Filter,
    ArrowUpDown, LayoutGrid, Trash2, Eye, Pencil, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Produits', href: '/produits' }];

interface Produit {
    uuid: string;
    nom: string;
    sku: string;
    image: string | null;
    purchase_price: string;
    sale_price: string;
    stock_quantity: number;
}
interface PaginatedData {
    total: ReactNode;
    data: Produit[];
    current_page: number;
    last_page: number;
}
interface Props {
    produits: PaginatedData;
    globalStats: { totalProduits: number; totalStock: number; lowStock: number; outOfStock: number };
    filters: { search?: string; stock?: string; sort?: string; per_page?: string };
}

function stockInfo(qty: number) {
    if (qty > 10) return { label: 'En stock',      cls: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-500'  };
    if (qty > 0)  return { label: 'Stock faible',  cls: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-500'  };
    return            { label: 'Rupture',        cls: 'bg-red-50   text-red-700   border-red-200',    dot: 'bg-red-500'    };
}

export default function Index() {
    const { produits, filters, globalStats } = usePage().props as unknown as Props;

    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [processing, setProcessing] = useState(false);
    const [search, setSearch]   = useState(filters.search || '');
    const [stock, setStock]     = useState(filters.stock  || 'all');
    const [sort, setSort]       = useState(filters.sort   || '');
    const [perPage, setPerPage] = useState(filters.per_page || '10');

    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    const go = (extra: object = {}) =>
        router.get('/produits', { search, stock: stock === 'all' ? undefined : stock, sort, per_page: perPage, ...extra },
            { preserveState: true, preserveScroll: true, replace: true });

    const handleSort = (field: string) => {
        const dir = sort === `${field}_asc` ? 'desc' : 'asc';
        const s = `${field}_${dir}`;
        setSort(s);
        go({ sort: s });
    };

    useEffect(() => {
        const t = setTimeout(() => go(), 350);
        return () => clearTimeout(t);
    }, [search, stock, perPage]);

    const handleDelete = (uuid: string, nom: string) => {
        confirm({
            title: 'Supprimer ce produit ?',
            description: `« ${nom} » sera définitivement supprimé. Cette action est irréversible.`,
            onConfirm: () => {
                setProcessing(true);
                router.delete(`/produits/${uuid}`, {
                    onSuccess: () => toast.success('Produit supprimé.'),
                    onFinish:  () => { setProcessing(false); closeConfirm(); },
                });
            },
        });
    };

    const SortBtn = ({ field }: { field: string }) => (
        <ArrowUpDown className={`ml-1 h-3 w-3 inline opacity-${sort.startsWith(field) ? '100' : '40'}`} />
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produits" />

            <ConfirmDialog
                open={confirmState.open}
                onOpenChange={closeConfirm}
                title={confirmState.title}
                description={confirmState.description}
                onConfirm={confirmState.onConfirm}
                loading={processing}
            />

            <div className="flex flex-col gap-6 p-6">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Produits</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Gérez votre catalogue d'inventaire</p>
                    </div>
                    <Link href="/produits/create">
                        <Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Nouveau produit</Button>
                    </Link>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
                        <div className="rounded-xl bg-slate-100 p-3"><TrendingUp className="h-5 w-5 text-slate-600" /></div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total</p>
                            <p className="text-2xl font-bold text-slate-900">{globalStats.totalProduits}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm flex items-center gap-4">
                        <div className="rounded-xl bg-white p-3"><Package className="h-5 w-5 text-blue-600" /></div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-500">Stock total</p>
                            <p className="text-2xl font-bold text-blue-800">{globalStats.totalStock}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm flex items-center gap-4">
                        <div className="rounded-xl bg-white p-3"><AlertCircle className="h-5 w-5 text-amber-500" /></div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-amber-500">Stock faible</p>
                            <p className="text-2xl font-bold text-amber-800">{globalStats.lowStock}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm flex items-center gap-4">
                        <div className="rounded-xl bg-white p-3"><XCircle className="h-5 w-5 text-red-500" /></div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-red-400">Rupture</p>
                            <p className="text-2xl font-bold text-red-700">{globalStats.outOfStock}</p>
                        </div>
                    </div>
                </div>

                {/* MAIN CARD */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">

                    {/* TOOLBAR */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-slate-100">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Rechercher par nom, SKU…"
                                className="pl-9 rounded-xl border-slate-200"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Select value={stock} onValueChange={setStock}>
                                <SelectTrigger className="w-44 rounded-xl border-slate-200">
                                    <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les stocks</SelectItem>
                                    <SelectItem value="in_stock">En stock</SelectItem>
                                    <SelectItem value="low_stock">Stock faible</SelectItem>
                                    <SelectItem value="out_of_stock">Rupture</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                                <button onClick={() => setViewMode('table')}
                                    className={`px-2.5 py-1.5 ${viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                                    <Layers className="h-4 w-4" />
                                </button>
                                <button onClick={() => setViewMode('card')}
                                    className={`px-2.5 py-1.5 ${viewMode === 'card' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                                    <LayoutGrid className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TABLE VIEW */}
                    {viewMode === 'table' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-5 py-3 text-left">Produit</th>
                                        <th className="px-5 py-3 text-right cursor-pointer" onClick={() => handleSort('purchase')}>
                                            Achat <SortBtn field="purchase" />
                                        </th>
                                        <th className="px-5 py-3 text-right cursor-pointer" onClick={() => handleSort('sale')}>
                                            Vente <SortBtn field="sale" />
                                        </th>
                                        <th className="px-5 py-3 text-right cursor-pointer" onClick={() => handleSort('stock')}>
                                            Stock <SortBtn field="stock" />
                                        </th>
                                        <th className="px-5 py-3 text-left">Statut</th>
                                        <th className="px-5 py-3 text-center w-28">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {produits.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-16 text-center">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <Package className="h-10 w-10 opacity-20" />
                                                    <p className="font-medium">Aucun produit trouvé</p>
                                                    <Link href="/produits/create">
                                                        <span className="text-xs text-blue-500 hover:underline">Ajouter votre premier produit →</span>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : produits.data.map(p => {
                                        const si = stockInfo(p.stock_quantity);
                                        const margin = Number(p.sale_price) - Number(p.purchase_price);
                                        return (
                                            <tr key={p.uuid} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer"
                                                onClick={() => router.visit(`/produits/${p.uuid}`)}>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        {p.image ? (
                                                            <img src={`/storage/${p.image}`} alt={p.nom} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                                <Package className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-slate-800">{p.nom}</p>
                                                            <p className="text-xs font-mono text-slate-400">{p.sku}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-600">
                                                    {Number(p.purchase_price).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold text-slate-800">
                                                    {Number(p.sale_price).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                                                    {margin > 0 && <div className="text-xs text-green-500 font-normal">+{margin.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</div>}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-semibold text-slate-800">{p.stock_quantity}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${si.cls}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${si.dot}`} />
                                                        {si.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                                                            onClick={() => router.visit(`/produits/${p.uuid}`)}>
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                                                            onClick={() => router.visit(`/produits/${p.uuid}/edit`)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-red-500 hover:bg-red-50"
                                                            onClick={() => handleDelete(p.uuid, p.nom)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {produits.data.length === 0 ? (
                                <div className="col-span-full py-16 text-center text-slate-400">
                                    <Package className="h-10 w-10 mx-auto opacity-20 mb-2" />
                                    <p>Aucun produit trouvé</p>
                                </div>
                            ) : produits.data.map(p => {
                                const si = stockInfo(p.stock_quantity);
                                return (
                                    <div key={p.uuid}
                                        className="rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => router.visit(`/produits/${p.uuid}`)}>
                                        <div className="aspect-video bg-slate-100 overflow-hidden">
                                            {p.image ? (
                                                <img src={`/storage/${p.image}`} alt={p.nom} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="h-10 w-10 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 truncate">{p.nom}</p>
                                                    <p className="text-xs font-mono text-slate-400">{p.sku}</p>
                                                </div>
                                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold border ${si.cls}`}>{si.label}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                                                <div><p className="text-slate-400">Achat</p><p className="font-semibold">{Number(p.purchase_price).toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</p></div>
                                                <div><p className="text-slate-400">Vente</p><p className="font-semibold text-slate-800">{Number(p.sale_price).toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</p></div>
                                                <div><p className="text-slate-400">Stock</p><p className="font-semibold">{p.stock_quantity}</p></div>
                                            </div>
                                            <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                                                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs rounded-lg"
                                                    onClick={() => router.visit(`/produits/${p.uuid}/edit`)}>Modifier</Button>
                                                <Button size="sm" variant="destructive" className="h-7 w-7 p-0 rounded-lg"
                                                    onClick={() => handleDelete(p.uuid, p.nom)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* PAGINATION */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-xs text-slate-500">{produits.total} produits au total</p>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-400">Lignes</span>
                                <Select value={perPage} onValueChange={v => { setPerPage(v); go({ per_page: v, page: 1 }); }}>
                                    <SelectTrigger className="h-7 w-16 text-xs rounded-lg border-slate-200"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['5','10','25','50'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <span className="text-xs text-slate-500">Page {produits.current_page} / {produits.last_page}</span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" disabled={produits.current_page === 1}
                                    onClick={() => go({ page: 1 })}><ChevronsLeft className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" disabled={produits.current_page === 1}
                                    onClick={() => go({ page: produits.current_page - 1 })}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" disabled={produits.current_page === produits.last_page}
                                    onClick={() => go({ page: produits.current_page + 1 })}><ChevronRight className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" disabled={produits.current_page === produits.last_page}
                                    onClick={() => go({ page: produits.last_page })}><ChevronsRight className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
