<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PurchaseInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'supplier_id',
        'code',
        'invoice_date',
        'subtotal',
        'tax_amount',
        'total_amount',
        'paid_amount',
        'remaining_amount',
        'status',
        'notes',
    ];

    protected static function booted()
    {
        static::creating(function ($invoice) {
            $invoice->uuid = Str::uuid();

            // Generate FA-xxxxx code if not set
            if (! $invoice->code) {
                $prefix = 'FA';
                $number = mt_rand(10000, 99999);
                $invoice->code = $prefix.'-'.$number;

                // Ensure uniqueness
                while (self::where('code', $invoice->code)->exists()) {
                    $number = mt_rand(10000, 99999);
                    $invoice->code = $prefix.'-'.$number;
                }
            }
        });
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONS
    |--------------------------------------------------------------------------
    */
    
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseInvoiceItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /*
    |--------------------------------------------------------------------------
    | CALCULATIONS
    |--------------------------------------------------------------------------
    */

    public function updateTotals()
    {
        $tva = 0;

        $subtotal = $this->items()->sum('total_price');
        $taxAmount = $subtotal * $tva;
        $total = $subtotal + $taxAmount;

        // Always calculate paid amount from payments
        $paid = $this->payments()->sum('amount');

        $remaining = $total - $paid;

        $this->update([
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total_amount' => $total,
            'paid_amount' => $paid,
            'remaining_amount' => $remaining,
        ]);

        $this->updateStatus();
    }

    public function updateStatus()
    {
        if ($this->paid_amount == 0) {
            $this->status = 'unpaid';
        } elseif ($this->paid_amount < $this->total_amount) {
            $this->status = 'partial';
        } else {
            $this->status = 'paid';
        }
        $this->save();
    }
}
