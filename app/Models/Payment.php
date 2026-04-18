<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'purchase_invoice_id',
        'sales_invoice_id',
        'payment_method_id',
        'amount',
        'payment_date',
        'reference',
        'notes'
    ];
    
    protected static function booted()
    {
        static::creating(function ($payment) {
            $payment->uuid = Str::uuid();
        });

        static::created(function ($payment) {

        if ($payment->purchase_invoice_id) {
            $invoice = PurchaseInvoice::find($payment->purchase_invoice_id);
            $invoice->updateTotals();
        }

        if ($payment->sales_invoice_id) {
            $invoice = SalesInvoice::find($payment->sales_invoice_id);
            $invoice->updateTotals();
        }
    });
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function purchaseInvoice()
    {
        return $this->belongsTo(PurchaseInvoice::class);
    }

    public function salesInvoice()
    {
        return $this->belongsTo(SalesInvoice::class);
    }
}
