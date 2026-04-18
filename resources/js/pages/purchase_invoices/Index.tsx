import { useState, useEffect, ReactNode } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import {
    MoreHorizontalIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    Filter,
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
    { title: 'Purchase Invoices', href: '/purchase_invoices' },
];

interface Supplier {
    uuid: string;
    nom: string;
}

interface InvoiceItem {
    id: number;
    product_name: string;
    quantity: number;
    total_price: number;
}

interface PurchaseInvoice {
    code: string;
    uuid: string;
    supplier: Supplier;
    invoice_date: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: 'unpaid' | 'partial' | 'paid';
    items?: InvoiceItem[];

}

interface PaginatedData {
    total: ReactNode;
    data: PurchaseInvoice[];
    current_page: number;
    last_page: number;
}

interface Props {
    purchaseInvoices: PaginatedData;
    filters: {
        search: string;
        status: string;
        per_page: string;
    };
}

export default function Index() {
    const { purchaseInvoices, filters } = usePage().props as unknown as Props;

    console.log(purchaseInvoices)

    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [perPage, setPerPage] = useState<string>(filters?.per_page ?? '5');
    const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

    /* ================= SORT ================= */
    const [sort, setSort] = useState('');

    const handleSort = (field: string) => {
        let direction = sort === `${field}_asc` ? 'desc' : 'asc';
        const newSort = `${field}_${direction}`;
        setSort(newSort);

        router.get('/purchase_invoices', {
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
            router.get('/purchase_invoices', {
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
            router.delete(`/purchase_invoices/${uuid}`, {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            });
        }
    };

    const toggleSelect = (uuid: string) => {
        setSelectedInvoices(prev =>
            prev.includes(uuid)
                ? prev.filter(id => id !== uuid)
                : [...prev, uuid]
        );
    };

    const selectAll = () => {
        if (selectedInvoices.length === purchaseInvoices.data.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(purchaseInvoices.data.map(c => c.uuid));
        }
    };

    const handleBulkDelete = () => {
        if (selectedInvoices.length === 0) return;

        if (confirm(`Delete ${selectedInvoices.length} invoices?`)) {
            setProcessing(true);

            router.post('/purchase_invoices/bulk-delete', {
                uuids: selectedInvoices
            }, {
                onFinish: () => {
                    setProcessing(false);
                    setSelectedInvoices([]);
                }
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-700';
            case 'partial':
                return 'bg-yellow-100 text-yellow-700';
            case 'unpaid':
                return 'bg-red-100 text-red-700';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Invoices" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {/* HEADER */}
                <div className="flex flex-row justify-between items-start sm:items-center gap-4 py-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Purchase Invoices</h2>
                        <p className="text-sm">Manage your purchase invoices</p>
                    </div>

                    <Link href="/purchase_invoices/create">
                        <Button><Plus /> Add Invoice</Button>
                    </Link>
                </div>

                {/* FILTER BAR */}
                <div className="relative grid gap-5 overflow-hidden rounded-xl md:min-h-min space-y-4 border p-6">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        {/* SEARCH */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Search by supplier or UUID..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">

                            {/* BULK DELETE */}
                            {selectedInvoices.length > 0 && (
                                <Button
                                    variant="destructive"
                                    onClick={handleBulkDelete}
                                    disabled={processing}
                                >
                                    Delete {selectedInvoices.length}
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
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                </SelectContent>
                            </Select>

                        </div>
                    </div>

                    {/* TABLE VIEW */}
                    <div className="relative overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <Checkbox
                                            checked={selectedInvoices.length === purchaseInvoices.data.length && purchaseInvoices.data.length > 0}
                                            onCheckedChange={selectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Paid Amount</TableHead>
                                    <TableHead>Balance</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {purchaseInvoices.data.map(invoice => (
                                    <TableRow key={invoice.uuid}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedInvoices.includes(invoice.uuid)}
                                                onCheckedChange={() => toggleSelect(invoice.uuid)}
                                            />
                                        </TableCell>
                                        {/* Invoice code clickable */}
                                        <TableCell>
                                            <Button
                                                variant="link"
                                                className="p-0 h-auto"
                                                onClick={() => router.visit(`/purchase_invoices/${invoice.uuid}`)}
                                            >
                                                {invoice.code}
                                            </Button>
                                        </TableCell>

                                        {/* Supplier name clickable */}
                                        <TableCell>
                                            <Button
                                                variant="link"
                                                className="p-0 h-auto"
                                                onClick={() => router.visit(`/suppliers/${invoice.supplier.uuid}`)}
                                            >
                                                {invoice.supplier.nom}
                                            </Button>
                                        </TableCell>

                                        <TableCell>{invoice.invoice_date}</TableCell>
                                        <TableCell>{invoice.total_amount}</TableCell>
                                        <TableCell>{invoice.paid_amount}</TableCell>
                                        <TableCell>{invoice.remaining_amount}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(invoice.status)}`}>
                                                {invoice.status}
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
                                                    <DropdownMenuItem onClick={() => router.visit(`/purchase_invoices/${invoice.uuid}`)}>View</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.visit(`/purchase_invoices/${invoice.uuid}/edit`)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem variant="destructive" onClick={() => handleDelete(invoice.uuid)}>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* PAGINATION */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t">
                            <div className="text-sm">{selectedInvoices.length} of {purchaseInvoices.total} selected</div>

                            <div className="flex items-center gap-4">
                                <Select
                                    value={perPage}
                                    onValueChange={(value) => {
                                        setPerPage(value)
                                        router.get('/purchase_invoices', { ...filters, per_page: value, page: 1 }, { preserveState: true, preserveScroll: true, replace: true });
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

                                <div className="text-sm">Page {purchaseInvoices.current_page} of {purchaseInvoices.last_page}</div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={purchaseInvoices.current_page === 1}
                                        onClick={() => router.get('/purchase_invoices', { ...filters, page: purchaseInvoices.current_page - 1 }, { preserveState: true })}
                                    >
                                        <ChevronLeft />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={purchaseInvoices.current_page === purchaseInvoices.last_page}
                                        onClick={() => router.get('/purchase_invoices', { ...filters, page: purchaseInvoices.current_page + 1 }, { preserveState: true })}
                                    >
                                        <ChevronRight />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
