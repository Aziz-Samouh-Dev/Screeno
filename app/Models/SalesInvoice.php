<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SalesInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'client_id',
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

            // Generate FV-xxxxx code if not set
            if (! $invoice->code) {

                $prefix = 'FV';
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

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(SalesInvoiceItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function returns()
    {
        return $this->hasMany(SalesReturn::class);
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

        // 🔥 NEW: subtract returns
        $returnsTotal = $this->returns()->sum('total_amount');

        $subtotalAfterReturn = $subtotal - $returnsTotal;

        $taxAmount = $subtotalAfterReturn * $tva;
        $total = $subtotalAfterReturn + $taxAmount;

        $paid = $this->payments()->sum('amount');

        $remaining = $total - $paid;

        $this->update([
            'subtotal' => $subtotalAfterReturn,
            'tax_amount' => $taxAmount,
            'total_amount' => $total,
            'paid_amount' => $paid,
            'remaining_amount' => $remaining,
        ]);

        $this->updateStatus();
    }

    public function getReturnableItems(?int $excludeReturnId = null): array
{
    return $this->items->map(function ($item) use ($excludeReturnId) {

        $query = SalesReturnItem::where('product_id', $item->product_id)
            ->whereHas('salesReturn', fn($q) =>
                $q->where('sales_invoice_id', $this->id)
            );

        // Exclude the current return being edited
        if ($excludeReturnId) {
            $query->where('sales_return_id', '!=', $excludeReturnId);
        }

        $alreadyReturned = $query->sum('quantity');
        $available = $item->quantity - $alreadyReturned;

        if ($available <= 0) return null;

        return [
            'product_id'         => $item->product_id,
            'product_name'       => $item->product_name,
            'unit_price'         => (float) $item->unit_price,
            'available_quantity' => $available,
        ];
    })->filter()->values()->toArray();
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
