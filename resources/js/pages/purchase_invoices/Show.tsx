'use client';

import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Edit2, Trash2, Printer, Calendar, Clock,
    CheckCircle2, AlertCircle, ArrowLeft, Download, QrCode,
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import PaymentSheet from '@/components/PurchaseInvoices/PaymentSheet';
import { useState } from 'react';

interface Supplier {
    nom: string;
    email?: string;
    telephone?: string | null;
    adresse?: string;
    ville?: string;
    pays?: string;
}

interface Item {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    total_price: string;
}

interface PaymentMethod {
    uuid: string;
    name: string;
}

interface Payment {
    uuid: string;
    amount: string;
    payment_date: string;
    notes?: string;
    payment_method: { name: string };
}

interface Invoice {
    uuid: string;
    code: string;
    invoice_date: string;
    status: 'unpaid' | 'partial' | 'paid';
    subtotal: string;
    tax_amount: string;
    total_amount: string;
    remaining_amount: string;
    supplier: Supplier;
    items: Item[];
    payments: Payment[];
}

interface Props {
    invoice: Invoice;
    paymentMethods: PaymentMethod[];
}

export default function Show({ invoice, paymentMethods }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Purchase Invoices', href: '/purchase_invoices' },
        { title: invoice.code, href: `/purchase_invoices/${invoice.uuid}` },
    ];

    const statusLabel =
        invoice.status === 'paid' ? 'Paid'
            : invoice.status === 'partial' ? 'Partial'
                : 'Unpaid';


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={invoice.code} />

            {/* ── Print styles ── */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0 0;
                    }

                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    body * {
                        visibility: hidden;
                    }

                    #printable-invoice,
                    #printable-invoice * {
                        visibility: visible;
                    }

                    #printable-invoice {
                        position: relative;
                        background: white !important;
                    }

                    thead {
                        display: table-header-group;
                    }

                    tr, .grid {
                        page-break-inside: avoid;
                    }

                    .print\\:hidden {
                        display: none !important;
                    }

                }
            `}</style>

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {/* ── Header Actions (hidden on print) ── */}
                <div className="print:hidden flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <Button variant="link" onClick={() => router.visit('/purchase_invoices')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Purchase invoices
                    </Button>
                    <div className="flex items-center space-x-3">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="h-5 w-5" />
                        </Button>
                        <div className="mx-2 h-6 w-px bg-slate-200" />
                        <Button variant="ghost" onClick={() => router.visit(`/purchase_invoices/${invoice.uuid}/edit`)}>
                            <Edit2 className="h-4 w-4" /> Edit
                        </Button>
                        <Button variant="destructive" onClick={() => {
                            if (confirm('Are you sure?')) router.delete(`/purchase_invoices/${invoice.uuid}`);
                        }}>
                            <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                    </div>
                </div>

                {/* ── Printable Invoice (A4 Blue Template - SINGLE PAGE) ── */}
                <div
                    id="printable-invoice"
                    className="hidden print:flex relative bg-white mx-auto w-full max-w-[210mm] shadow-xl print:shadow-none print:max-w-none"
                >
                    {/* Top Blue Stripe */}
                    <div className="print:hidden h-10 w-full flex overflow-hidden">
                        {Array.from({ length: 120 }).map((_, i) => (
                            <div key={i} style={{ backgroundColor: '#dbeafe' }} className="w-1 h-full mr-1 shrink-0" />
                        ))}
                    </div>

                    {/* Compact spacing for single-page fit */}
                    <div className="p-6 space-y-6  print:space-y-5">

                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <h1
                                style={{
                                    color: '#3b82f6',
                                    fontWeight: 900,
                                    fontSize: '2.4rem',
                                    letterSpacing: '-1px'
                                }}
                                className="tracking-tighter"
                            >
                                INVOICE
                            </h1>
                            <div className="text-right">
                                <p style={{ color: '#9ca3af', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                    Date : {invoice.invoice_date}
                                </p>
                                <p style={{ color: '#9ca3af', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                    Invoice No : {invoice.code}
                                </p>
                                <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${invoice.status === 'paid' ? 'bg-green-50 text-green-700'
                                    : invoice.status === 'partial' ? 'bg-amber-50 text-amber-700'
                                        : 'bg-red-50 text-red-700'
                                    }`}>
                                    {invoice.status === 'paid' ? 'Paid' : invoice.status === 'partial' ? 'Partial' : 'Unpaid'}
                                </span>
                            </div>
                        </div>

                        {/* Parties - tighter gap */}
                        <div className="flex gap-6">
                            {/* From */}
                            <div className="flex-1 space-y-1">
                                <div className="border-b-2 border-blue-500 pb-1">
                                    <p className="text-sm font-medium text-blue-500">Invoice From</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-black text-slate-900 uppercase text-sm">{invoice.supplier?.nom}</p>
                                    {invoice.supplier?.adresse && (
                                        <p className="text-[11px] text-slate-500 font-bold">A : {invoice.supplier.adresse}</p>
                                    )}
                                    {invoice.supplier?.telephone && (
                                        <p className="text-[11px] text-slate-500 font-bold">P : {invoice.supplier.telephone}</p>
                                    )}
                                    {invoice.supplier?.email && (
                                        <p className="text-[11px] text-slate-500 font-bold">E : {invoice.supplier.email}</p>
                                    )}
                                    {(invoice.supplier?.ville || invoice.supplier?.pays) && (
                                        <p className="text-[11px] text-slate-500 font-bold">
                                            {[invoice.supplier.ville, invoice.supplier.pays].filter(Boolean).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* To */}
                            <div className="flex-1 space-y-1">
                                <div className="border-b-2 border-blue-500 pb-1">
                                    <p className="text-sm font-medium text-blue-500">Invoice To</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-black text-slate-900 uppercase text-sm">Screeno Inc.</p>
                                    <p className="text-[11px] text-slate-500 font-bold">Your Company Address</p>
                                    <p className="text-[11px] text-slate-500 font-bold">City, State, ZIP</p>
                                    <p className="text-[11px] text-slate-500 font-bold">Tax ID: YOUR-TAX-ID</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table - compact */}
                        <div>
                            <div className="flex border-b border-slate-200 py-2 text-sm font-medium text-slate-900">
                                <p className="w-1/2">Description</p>
                                <p className="w-1/6 text-center">Price</p>
                                <p className="w-1/6 text-center">Qty</p>
                                <p className="w-1/6 text-right">Total</p>
                            </div>
                            <div className="space-y-1 py-4">
                                {invoice.items.map((item, i) => (
                                    <div key={i} className="flex border-b border-slate-100 py-2 text-sm text-slate-600">
                                        <p className="w-1/2 truncate">{item.product_name}</p>
                                        <p className="w-1/6 text-center">
                                            ${Number(item.unit_price).toFixed(2)}
                                        </p>
                                        <p className="w-1/6 text-center">
                                            {item.quantity.toString().padStart(2, '0')}
                                        </p>
                                        <p className="w-1/6 text-right">
                                            ${Number(item.total_price).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {/* Totals - compact */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between border-b border-blue-100 pb-1">
                                        <p className="text-sm font-medium text-slate-500">Sub Total</p>
                                        <p className="text-sm font-medium text-slate-900">${Number(invoice.subtotal).toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between border-b border-blue-100 pb-1">
                                        <p className="text-sm font-medium text-slate-500">Tax</p>
                                        <p className="text-sm font-medium text-slate-900">${Number(invoice.tax_amount).toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <p className="text-base font-semibold text-slate-900">Grand Total</p>
                                        <p className="text-base font-semibold text-blue-500">${Number(invoice.total_amount).toFixed(2)}</p>
                                    </div>
                                    {invoice.status !== 'paid' && (
                                        <div className="flex justify-between pt-0.5">
                                            <p className="text-sm font-medium text-amber-600">Remaining</p>
                                            <p className="text-sm font-medium text-amber-600">
                                                ${Number(invoice.remaining_amount).toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>



                        {/* Footer Section */}
                        <div className="flex gap-8 pt-8 mt-8 border-t-2">
                            {/* Notes / Terms */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold tracking-widest text-blue-600 uppercase flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Notes & Terms
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                                    Payment is due within 30 days of invoice date. Please include invoice number <span className="font-mono font-bold text-slate-700">{invoice.code}</span> with your payment.
                                    Late payments may be subject to a 1.5% monthly finance charge.
                                </p>
                                {invoice.payments.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                            Payment History
                                        </p>
                                        <div className="space-y-1.5">
                                            {invoice.payments.map((payment) => (
                                                <div key={payment.uuid} className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 rounded">
                                                    <span className="text-slate-500">{payment.payment_date}</span>
                                                    <span className="font-bold text-slate-700">${Number(payment.amount).toFixed(2)}</span>
                                                    <span className="text-slate-400 text-[10px]">{payment.payment_method.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Thank You + QR */}
                            <div className="flex flex-col items-end justify-start space-y-4">
                                <div className="text-right space-y-1">
                                    <p className="text-lg font-black text-blue-600 italic">Thank you for your business!</p>
                                    <p className="text-xs text-slate-400">We appreciate your partnership</p>
                                </div>
                                <div className="w-24 h-24 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                                    <QrCode className="w-12 h-12 text-slate-400" />
                                </div>
                                <p className="text-[9px] text-slate-400 text-center">Scan to view invoice online</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Invoice Card ── */}
                <div
                    className="print:hidden overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-xl"
                >
                    {/* Header */}
                    <div className="flex flex-col items-start justify-between gap-8 border-b border-slate-100 p-10 md:flex-row">
                        <div className="space-y-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
                                {invoice.supplier?.nom?.slice(0, 1)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                    Purchase Invoice
                                </h1>
                                <p className="mt-1 font-mono text-sm text-slate-500">{invoice.code}</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-right">
                            <span className={`mb-4 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase ${invoice.status === 'paid' ? 'bg-green-50 text-green-700'
                                : invoice.status === 'partial' ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700'
                                }`}>
                                {statusLabel}
                            </span>
                            <div className="flex items-center justify-end text-sm text-slate-500">
                                <Calendar className="mr-2 h-4 w-4" />
                                Date: {invoice.invoice_date}
                            </div>
                            <div className="flex items-center justify-end text-sm text-slate-500">
                                <Clock className="mr-2 h-4 w-4" />
                                Remaining: ${Number(invoice.remaining_amount).toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Supplier & Bill To */}
                    <div className="grid grid-cols-1 gap-12 bg-slate-50/50 p-10 md:grid-cols-2">
                        <div className="space-y-4">
                            <p className="text-sm font-medium tracking-widest text-slate-400 uppercase">Supplier</p>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{invoice.supplier?.nom}</h3>
                                <p className="text-sm text-slate-500">
                                    {invoice.supplier?.adresse && <>{invoice.supplier.adresse}<br /></>}
                                    {(invoice.supplier?.ville || invoice.supplier?.pays) && (
                                        <>{[invoice.supplier?.ville, invoice.supplier?.pays].filter(Boolean).join(', ')}<br /></>
                                    )}
                                    {invoice.supplier?.email && <>Email: {invoice.supplier.email}<br /></>}
                                    {invoice.supplier?.telephone && <>Telephone: {invoice.supplier.telephone}</>}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm font-medium tracking-widest text-slate-400 uppercase">Bill To</p>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Screeno Inc.</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Your Company Address<br />City, State, ZIP<br />Tax ID: YOUR-TAX-ID
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="p-10">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-sm font-medium tracking-widest text-slate-400 uppercase">
                                    <th className="pb-4">Description</th>
                                    <th className="pb-4 text-center">Qty</th>
                                    <th className="pb-4 text-right">Price</th>
                                    <th className="pb-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoice.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-6 font-bold text-slate-900">{item.product_name}</td>
                                        <td className="py-6 text-center">{item.quantity}</td>
                                        <td className="py-6 text-right">${Number(item.unit_price).toFixed(2)}</td>
                                        <td className="py-6 text-right font-bold">${Number(item.total_price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex items-center justify-between bg-slate-900 p-10 text-white">
                        <div>
                            <p className="text-xs text-slate-400 uppercase">Total Amount</p>
                            <p className="text-2xl font-bold">${Number(invoice.total_amount).toFixed(2)}</p>
                        </div>
                        <div>
                            {invoice.status === 'paid' ? (
                                <div className="flex items-center font-bold text-green-400">
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Fully Paid
                                </div>
                            ) : (
                                <div className="flex items-center font-bold text-amber-400">
                                    <AlertCircle className="mr-2 h-4 w-4" /> Balance: ${Number(invoice.remaining_amount).toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Payments (hidden on print) ── */}
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
