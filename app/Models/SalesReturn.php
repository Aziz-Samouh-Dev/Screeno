<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SalesReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'sales_invoice_id',
        'client_id',
        'return_date',
        'total_amount',
        'notes',
    ];

    protected static function booted()
    {
        static::creating(function ($return) {
            if (!$return->uuid) {
                $return->uuid = Str::uuid();
            }
        });
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    public function invoice()
    {
        return $this->belongsTo(SalesInvoice::class, 'sales_invoice_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(SalesReturnItem::class);
    }

    public function calculateTotal()
    {
        $total = $this->items()->sum('total_price');
        $this->update(['total_amount' => $total]);
        return $total;
    }
}
