<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\PurchaseInvoice;
use App\Models\SalesInvoice;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function store(Request $request, $invoiceUuid)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method_uuid' => 'required|exists:payment_methods,uuid',
            'notes' => 'nullable|string|max:255',
        ]);

        $purchaseInvoice = PurchaseInvoice::where('uuid', $invoiceUuid)->firstOrFail();

        // 🚨 BLOCK if already paid
        if ($purchaseInvoice->status === 'paid') {
            return redirect()
                ->route('purchase_invoices.show', $purchaseInvoice->uuid)
                ->with('error', 'Invoice is already fully paid.');
        }

        $paymentMethod = PaymentMethod::where('uuid', $request->payment_method_uuid)->firstOrFail();

        $paid = $purchaseInvoice->payments()->sum('amount');
        $remaining = $purchaseInvoice->total_amount - $paid;

        if ($request->amount > $remaining) {
            return redirect()
                ->route('purchase_invoices.show', $purchaseInvoice->uuid)
                ->with('error', 'Payment exceeds remaining amount.');
        }

        Payment::create([
            'purchase_invoice_id' => $purchaseInvoice->id,
            'payment_method_id' => $paymentMethod->id,
            'amount' => $request->amount,
            'notes' => $request->notes,
            'payment_date' => now(),
        ]);

        // update totals + status
        $purchaseInvoice->updateTotals();

        return redirect()
            ->route('purchase_invoices.show', $purchaseInvoice->uuid)
            ->with('success', 'Payment recorded successfully.');
    }

    public function storeSalesPayment(Request $request, $invoiceUuid)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method_uuid' => 'required|exists:payment_methods,uuid',
            'notes' => 'nullable|string|max:255',
        ]);

        $salesInvoice = SalesInvoice::where('uuid', $invoiceUuid)->firstOrFail();

        // 🚨 Block if already fully paid
        if ($salesInvoice->status === 'paid') {
            return redirect()
                ->route('sales_invoices.show', $salesInvoice->uuid)
                ->with('error', 'Invoice is already fully paid.');
        }

        $paymentMethod = PaymentMethod::where('uuid', $request->payment_method_uuid)->firstOrFail();

        $paid = $salesInvoice->payments()->sum('amount');
        $remaining = $salesInvoice->total_amount - $paid;

        // 🚨 Prevent overpayment
        if ($request->amount > $remaining) {
            return redirect()
                ->route('sales_invoices.show', $salesInvoice->uuid)
                ->with('error', 'Payment exceeds remaining amount.');
        }

        Payment::create([
            'sales_invoice_id' => $salesInvoice->id,
            'payment_method_id' => $paymentMethod->id,
            'amount' => $request->amount,
            'notes' => $request->notes,
            'payment_date' => now(),
        ]);

        // update totals and invoice status
        $salesInvoice->updateTotals();

        return redirect()
            ->route('sales_invoices.show', $salesInvoice->uuid)
            ->with('success', 'Payment recorded successfully.');
    }
}
