import { useState, useEffect, ReactNode } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    ChevronRight, ChevronLeft,
    Plus, Users, UserCheck, UserX, Search, Filter,
    ArrowUpDown, Layers, LayoutGrid, Trash2, Download, Eye, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Clients', href: '/clients' }];

interface Client {
    uuid: string;
    nom: string;
    email?: string | null;
    telephone: string;
    ville?: string | null;
    status: 'active' | 'inactive';
}
interface PaginatedData {
    total: ReactNode;
    data: Client[];
    current_page: number;
    last_page: number;
}
interface Props {
    clients: PaginatedData;
    globalStats: { totalClients: number; activeClients: number; inactiveClients: number };
    filters: { search?: string; status?: string; sort?: string; per_page?: string };
}

const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const avatarColors = [
    'bg-violet-100 text-violet-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
];
const getColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];

export default function Index() {
    const { clients, filters, globalStats } = usePage().props as unknown as Props;

    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [processing, setProcessing] = useState(false);
    const [search, setSearch]   = useState(filters.search || '');
    const [status, setStatus]   = useState(filters.status || 'all');
    const [sort, setSort]       = useState(filters.sort || '');
    const [perPage, setPerPage] = useState(filters.per_page || '10');

    const { confirmState, confirm, closeConfirm } = useConfirmDialog();

    const go = (extra: object = {}) =>
        router.get('/clients', { search, status: status === 'all' ? undefined : status, sort, per_page: perPage, ...extra },
            { preserveState: true, preserveScroll: true, replace: true });

    const handleSort = (field: string) => {
        const dir = sort === `${field}_asc` ? 'desc' : 'asc';
        const newSort = `${field}_${dir}`;
        setSort(newSort);
        go({ sort: newSort });
    };

    useEffect(() => {
        const t = setTimeout(() => go(), 350);
        return () => clearTimeout(t);
    }, [search, status, perPage]);

    const handleDelete = (uuid: string, nom: string) => {
        confirm({
            title: 'Supprimer ce client ?',
            description: `« ${nom} » et toutes ses données associées seront supprimés définitivement.`,
            onConfirm: () => {
                setProcessing(true);
                router.delete(`/clients/${uuid}`, {
                    onFinish: () => { setProcessing(false); closeConfirm(); },
                });
            },
        });
    };

    const SortIcon = ({ field }: { field: string }) => (
        <ArrowUpDown className={`ml-1 h-3 w-3 inline opacity-${sort.startsWith(field) ? '100' : '40'}`} />
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />

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
                        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Gérez votre portefeuille clients</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={() => window.open('/clients/export/csv', '_blank')}>
                            <Download className="mr-2 h-4 w-4" /> Exporter
                        </Button>
                        <Link href="/clients/create">
                            <Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Nouveau client</Button>
                        </Link>
                    </div>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
                        <div className="rounded-xl bg-slate-100 p-3"><Users className="h-5 w-5 text-slate-600" /></div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total</p>
                            <p className="text-2xl font-bold text-slate-900">{globalStats.totalClients}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm flex items-center gap-4">
                        <div className="rounded-xl bg-white p-3"><UserCheck className="h-5 w-5 text-green-600" /></div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-green-500">Actifs</p>
                            <p className="text-2xl font-bold text-green-800">{globalStats.activeClients}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm flex items-center gap-4">
                        <div className="rounded-xl bg-white p-3"><UserX className="h-5 w-5 text-red-500" /></div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-red-400">Inactifs</p>
                            <p className="text-2xl font-bold text-red-700">{globalStats.inactiveClients}</p>
                        </div>
                    </div>
                </div>

                {/* MAIN CARD */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">

                    {/* TOOLBAR */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-slate-100">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Rechercher nom, email ou téléphone…"
                                className="pl-9 rounded-xl border-slate-200"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-40 rounded-xl border-slate-200">
                                    <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="active">Actif</SelectItem>
                                    <SelectItem value="inactive">Inactif</SelectItem>
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
                                        <th className="px-5 py-3 text-left cursor-pointer" onClick={() => handleSort('name')}>
                                            Client <SortIcon field="name" />
                                        </th>
                                        <th className="px-5 py-3 text-left">Téléphone</th>
                                        <th className="px-5 py-3 text-left cursor-pointer" onClick={() => handleSort('city')}>
                                            Ville <SortIcon field="city" />
                                        </th>
                                        <th className="px-5 py-3 text-left cursor-pointer" onClick={() => handleSort('status')}>
                                            Statut <SortIcon field="status" />
                                        </th>
                                        <th className="px-5 py-3 text-center w-28">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-16 text-center">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <Users className="h-10 w-10 opacity-20" />
                                                    <p className="font-medium">Aucun client trouvé</p>
                                                    <Link href="/clients/create">
                                                        <span className="text-xs text-blue-500 hover:underline">Ajouter votre premier client →</span>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : clients.data.map(client => (
                                        <tr key={client.uuid} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer"
                                            onClick={() => router.visit(`/clients/${client.uuid}`)}>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getColor(client.nom)}`}>
                                                        {getInitials(client.nom)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{client.nom}</p>
                                                        <p className="text-xs text-slate-400">{client.email || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600">{client.telephone || '—'}</td>
                                            <td className="px-5 py-3.5 text-slate-600">{client.ville || '—'}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                                    client.status === 'active'
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : 'bg-red-50 text-red-600 border-red-200'
                                                }`}>
                                                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${client.status === 'active' ? 'bg-green-500' : 'bg-red-400'}`} />
                                                    {client.status === 'active' ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                                                        onClick={() => router.visit(`/clients/${client.uuid}`)}>
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                                                        onClick={() => router.visit(`/clients/${client.uuid}/edit`)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-red-500 hover:bg-red-50"
                                                        onClick={() => handleDelete(client.uuid, client.nom)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {clients.data.length === 0 ? (
                                <div className="col-span-full py-16 text-center text-slate-400">
                                    <Users className="h-10 w-10 mx-auto opacity-20 mb-2" />
                                    <p>Aucun client trouvé</p>
                                </div>
                            ) : clients.data.map(client => (
                                <div key={client.uuid}
                                    className="rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => router.visit(`/clients/${client.uuid}`)}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold ${getColor(client.nom)}`}>
                                            {getInitials(client.nom)}
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                                            client.status === 'active'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-red-50 text-red-600 border-red-200'
                                        }`}>{client.status === 'active' ? 'Actif' : 'Inactif'}</span>
                                    </div>
                                    <p className="font-bold text-slate-800 truncate">{client.nom}</p>
                                    <p className="text-xs text-slate-400 truncate mt-0.5">{client.email || '—'}</p>
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <span>{client.telephone || '—'}</span>
                                        <span>{client.ville || '—'}</span>
                                    </div>
                                    <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs rounded-lg"
                                            onClick={() => router.visit(`/clients/${client.uuid}/edit`)}>Modifier</Button>
                                        <Button size="sm" variant="destructive" className="h-7 w-7 p-0 rounded-lg"
                                            onClick={() => handleDelete(client.uuid, client.nom)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* PAGINATION */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-xs text-slate-500">{clients.total} clients au total</p>
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
                            <span className="text-xs text-slate-500">Page {clients.current_page} / {clients.last_page}</span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={clients.current_page === 1}
                                    onClick={() => go({ page: clients.current_page - 1 })}>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg"
                                    disabled={clients.current_page === clients.last_page}
                                    onClick={() => go({ page: clients.current_page + 1 })}>
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
