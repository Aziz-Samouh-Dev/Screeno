"use client";
import { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    MoreHorizontalIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    PackageX,
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sales Returns', href: '/sales_returns' },
];

interface SalesReturn {
    uuid: string;
    return_date: string;
    total_amount: number;
    client: { uuid: string; nom: string };
    invoice: { uuid: string; code: string };
}

interface PaginatedData {
    data: SalesReturn[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

interface Props {
    returns: PaginatedData;
    filters: {
        search: string;
        per_page: string;
    };
}

export default function Index() {
    const { returns, filters } = usePage().props as unknown as Props;

    const [search, setSearch] = useState(filters.search || '');
    const [perPage, setPerPage] = useState<string>(filters.per_page ?? '10');
    const [selected, setSelected] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get('/sales_returns', { search, per_page: perPage }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);
        return () => clearTimeout(timeout);
    }, [search, perPage]);

    const handleDelete = (uuid: string) => {
        if (confirm('Are you sure you want to delete this return?')) {
            router.delete(`/sales_returns/${uuid}`);
        }
    };

    const toggleSelect = (uuid: string) => {
        setSelected(prev =>
            prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
        );
    };

    const allSelected =
        returns.data.length > 0 && selected.length === returns.data.length;

    const selectAll = () => {
        setSelected(allSelected ? [] : returns.data.map(r => r.uuid));
    };

    const handleBulkDelete = () => {
        if (selected.length === 0 || !confirm(`Delete ${selected.length} selected returns?`)) return;
        setProcessing(true);
        router.post('/sales_returns/bulk-delete', { uuids: selected }, {
            onFinish: () => {
                setProcessing(false);
                setSelected([]);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Returns" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Page header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Sales Returns</h2>
                        <p className="text-sm text-slate-500">Manage client product returns</p>
                    </div>
                    <Link href="/sales_returns/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" /> Add Return
                        </Button>
                    </Link>
                </div>

                <div className="border rounded-xl p-6 space-y-4 bg-white">
                    {/* Toolbar */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-52">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by client, invoice or return ID…"
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {selected.length > 0 && (
                            <Button
                                variant="destructive"
                                onClick={handleBulkDelete}
                                disabled={processing}
                            >
                                Delete ({selected.length})
                            </Button>
                        )}
                    </div>

                    {/* Table */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={selectAll}
                                    />
                                </TableHead>
                                <TableHead>Return ID</TableHead>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-center w-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {returns.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="py-16 text-center text-slate-400"
                                    >
                                        <PackageX className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                        No returns found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                returns.data.map((ret) => (
                                    <TableRow
                                        key={ret.uuid}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => router.visit(`/sales_returns/${ret.uuid}`)}
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selected.includes(ret.uuid)}
                                                onCheckedChange={() => toggleSelect(ret.uuid)}
                                            />
                                        </TableCell>

                                        <TableCell className="font-mono text-sm text-slate-500">
                                            {ret.uuid.slice(0, 8)}…
                                        </TableCell>

                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="link"
                                                className="p-0 h-auto font-medium text-blue-600"
                                                onClick={() =>
                                                    router.visit(`/sales_invoices/${ret.invoice.uuid}`)
                                                }
                                            >
                                                {ret.invoice.code}
                                            </Button>
                                        </TableCell>

                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="link"
                                                className="p-0 h-auto font-medium"
                                                onClick={() =>
                                                    router.visit(`/clients/${ret.client.uuid}`)
                                                }
                                            >
                                                {ret.client.nom}
                                            </Button>
                                        </TableCell>

                                        <TableCell className="text-slate-600">
                                            {ret.return_date}
                                        </TableCell>

                                        <TableCell className="text-right font-semibold text-red-600 font-mono">
                                            ${Number(ret.total_amount).toFixed(2)}
                                        </TableCell>

                                        <TableCell
                                            className="text-center"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontalIcon className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            router.visit(`/sales_returns/${ret.uuid}`)
                                                        }
                                                    >
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            router.visit(`/sales_returns/${ret.uuid}/edit`)
                                                        }
                                                    >
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => handleDelete(ret.uuid)}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination footer */}
                    <div className="flex flex-wrap justify-between items-center gap-4 border-t pt-4">
                        <p className="text-sm text-slate-500">
                            {selected.length > 0
                                ? `${selected.length} of ${returns.total} selected`
                                : `${returns.total} total returns`}
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>Rows per page</span>
                                <Select value={perPage} onValueChange={setPerPage}>
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['5', '10', '25', '50'].map((v) => (
                                            <SelectItem key={v} value={v}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <span className="text-sm text-slate-500">
                                Page {returns.current_page} of {returns.last_page}
                            </span>

                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={returns.current_page === 1}
                                    onClick={() =>
                                        router.get(
                                            '/sales_returns',
                                            { page: returns.current_page - 1, per_page: perPage, search },
                                            { preserveState: true }
                                        )
                                    }
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={returns.current_page === returns.last_page}
                                    onClick={() =>
                                        router.get(
                                            '/sales_returns',
                                            { page: returns.current_page + 1, per_page: perPage, search },
                                            { preserveState: true }
                                        )
                                    }
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
