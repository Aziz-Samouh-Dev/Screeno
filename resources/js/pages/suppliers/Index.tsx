import { useState, useEffect, ReactNode } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import {
    MoreHorizontalIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Users,
    UserCheck,
    UserX,
    Search,
    Filter,
    ArrowUpDown,
    Layers,
    User
} from "lucide-react"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Checkbox } from '@/components/ui/checkbox';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Suppliers', href: '/suppliers' },
];

interface Supplier {
    uuid: string;
    nom: string;
    email: string;
    telephone: string | null;
    ville: string | null;
    status: 'active' | 'inactive';
}

interface PaginatedData {
    total: ReactNode;
    data: Supplier[];
    current_page: number;
    last_page: number;
}

interface Props {
    suppliers: PaginatedData;

    globalStats: {
        totalSuppliers: number;
        activeSuppliers: number;
        inactiveSuppliers: number;
    };

    filters: {
        search?: string;
        status?: string;
        sort?: string;
        per_page?: string;
    };
}

export default function Index() {

    const { flash } = usePage().props as any;
    const { suppliers, filters, globalStats } = usePage().props as unknown as Props;

    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [processing, setProcessing] = useState(false);

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [sort, setSort] = useState(filters.sort || '');
    const [perPage, setPerPage] = useState(filters.per_page || '5');

    const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

    /* ================= SORT ================= */
    const handleSort = (field: string) => {
        let direction = sort === `${field}_asc` ? 'desc' : 'asc';
        const newSort = `${field}_${direction}`;
        setSort(newSort);

        router.get('/suppliers', {
            search,
            status: status === 'all' ? undefined : status,
            sort: newSort,
            per_page: perPage,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    /* ================= FILTER EFFECT ================= */
    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get('/suppliers', {
                search,
                status: status === 'all' ? undefined : status,
                sort,
                per_page: perPage,
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [search, status, sort, perPage]);

    /* ================= DELETE ================= */
    const handleDelete = (uuid: string) => {
        if (confirm('Are you sure?')) {
            router.delete(`/suppliers/${uuid}`, {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            });
        }
    };

    const toggleSelect = (uuid: string) => {
        setSelectedSuppliers(prev =>
            prev.includes(uuid)
                ? prev.filter(id => id !== uuid)
                : [...prev, uuid]
        );
    };

    const selectAll = () => {
        if (selectedSuppliers.length === suppliers.data.length) {
            setSelectedSuppliers([]);
        } else {
            setSelectedSuppliers(suppliers.data.map(c => c.uuid));
        }
    };

    const handleBulkDelete = () => {
        if (selectedSuppliers.length === 0) return;

        if (confirm(`Delete ${selectedSuppliers.length} suppliers?`)) {
            setProcessing(true);

            router.post('/suppliers/bulk-delete', {
                uuids: selectedSuppliers
            }, {
                onFinish: () => {
                    setProcessing(false);
                    setSelectedSuppliers([]);
                }
            });
        }
    };

    /* ================= UTIL ================= */
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    /* ================= STATS ================= */
    const stats = [
        { label: 'Total Suppliers', value: globalStats.totalSuppliers, icon: Users },
        { label: 'Active', value: globalStats.activeSuppliers, icon: UserCheck },
        { label: 'Inactive', value: globalStats.inactiveSuppliers, icon: UserX },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suppliers" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {/* HEADER */}
                <div className="flex flex-row justify-between items-start sm:items-center gap-4 py-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Suppliers</h2>
                        <p className="text-sm">Manage your suppliers</p>
                    </div>

                    <Link href="/suppliers/create">
                        <Button><Plus /> Add Supplier</Button>
                    </Link>
                </div>

                {/* FLASH */}
                {flash.success && (
                    <div className="bg-green-100 text-green-700 p-2 rounded">
                        {flash.success}
                    </div>
                )}

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="p-5 rounded-2xl border flex items-center space-x-4">
                            <div className="p-3 rounded-xl bg-slate-50">
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                                <h3 className="text-xl font-bold">{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FILTER BAR */}
                <div className="relative grid gap-5 overflow-hidden rounded-xl md:min-h-min space-y-4 border p-6">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        {/* SEARCH */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Search by name, email or phone..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">

                            {/* BULK DELETE */}
                            {selectedSuppliers.length > 0 && (
                                <Button
                                    variant="destructive"
                                    onClick={handleBulkDelete}
                                    disabled={processing}
                                >
                                    Delete {selectedSuppliers.length}
                                </Button>
                            )}

                            {/* STATUS FILTER */}
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="space-x-2">
                                    <Filter className="w-4 h-4" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                onClick={() => window.open('/suppliers/export/csv', '_blank')}
                            >
                                Export CSV
                            </Button>

                            {/* VIEW MODE */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={viewMode === 'table' ? 'default' : 'outline'}
                                    size="icon"
                                    onClick={() => setViewMode('table')}
                                >
                                    <Layers className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant={viewMode === 'card' ? 'default' : 'outline'}
                                    size="icon"
                                    onClick={() => setViewMode('card')}
                                >
                                    <User className="h-4 w-4" />
                                </Button>
                            </div>

                        </div>
                    </div>

                    {/* TABLE VIEW */}
                    {viewMode === 'table' ? (
                        <div className="relative overflow-x-auto">

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <Checkbox
                                                checked={selectedSuppliers.length === suppliers.data.length && suppliers.data.length > 0}
                                                onCheckedChange={selectAll}
                                            />
                                        </TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort('nom')}>
                                            Supplier <ArrowUpDown className="ml-2 h-3 w-3 inline" />
                                        </TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>City</TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                                            Status <ArrowUpDown className="ml-2 h-3 w-3 inline" />
                                        </TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {suppliers.data.map(supplier => {
                                        const badge = supplier.status === 'active'
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700";

                                        return (
                                            <TableRow key={supplier.uuid}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedSuppliers.includes(supplier.uuid)}
                                                        onCheckedChange={() => toggleSelect(supplier.uuid)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                            {getInitials(supplier.nom)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{supplier.nom}</div>
                                                            <div className="text-xs text-muted-foreground">{supplier.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{supplier.telephone || '-'}</TableCell>
                                                <TableCell>{supplier.ville || '-'}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 text-xs rounded ${badge}`}>
                                                        {supplier.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontalIcon />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>View</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => router.visit(`/suppliers/${supplier.uuid}/edit`)}>Edit</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem variant="destructive" onClick={() => handleDelete(supplier.uuid)}>Delete</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {/* PAGINATION */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t">
                                <div className="text-sm">{selectedSuppliers.length} of {suppliers.total} selected</div>

                                <div className="flex items-center gap-4">
                                    <Select
                                        value={perPage}
                                        onValueChange={(value) => {
                                            setPerPage(value)
                                            router.get('/suppliers', { ...filters, per_page: value, page: 1 }, { preserveState: true, preserveScroll: true, replace: true });
                                        }}
                                    >
                                        <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5</SelectItem>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="text-sm">Page {suppliers.current_page} of {suppliers.last_page}</div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            disabled={suppliers.current_page === 1}
                                            onClick={() => router.get('/suppliers', { ...filters, page: suppliers.current_page - 1 }, { preserveState: true })}
                                        >
                                            <ChevronLeft />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            disabled={suppliers.current_page === suppliers.last_page}
                                            onClick={() => router.get('/suppliers', { ...filters, page: suppliers.current_page + 1 }, { preserveState: true })}
                                        >
                                            <ChevronRight />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* CARD VIEW */
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {suppliers.data.map(supplier => {
                                const badge = supplier.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";

                                return (
                                    <div key={supplier.uuid} className="rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow duration-150">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                {getInitials(supplier.nom)}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{supplier.nom}</p>
                                                <p className="text-xs text-muted-foreground">{supplier.email}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 text-sm space-y-1">
                                            <p>Phone: {supplier.telephone || '-'}</p>
                                            <p>City: {supplier.ville || '-'}</p>
                                            <p>Status: <span className={`px-2 py-1 text-xs rounded ${badge}`}>{supplier.status}</span></p>
                                        </div>

                                        <div className="mt-4 flex justify-between items-center">
                                            <Button size="sm" variant="outline" onClick={() => router.visit(`/suppliers/${supplier.uuid}`)}>View</Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="ghost"><MoreHorizontalIcon className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.visit(`/suppliers/${supplier.uuid}/edit`)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem variant="destructive" onClick={() => handleDelete(supplier.uuid)}>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}