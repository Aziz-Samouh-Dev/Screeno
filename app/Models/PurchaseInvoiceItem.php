<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseInvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_invoice_id',
        'product_id',
        'product_name',
        'unit_price',
        'quantity',
        'total_price',
    ];

    public function invoice()
    {
        return $this->belongsTo(PurchaseInvoice::class);
    }

    public function product()
    {
        return $this->belongsTo(Produit::class);
    }

    // Automatically calculate total_price on save
    protected static function booted()
    {
        static::saving(function ($item) {
            $item->total_price = $item->unit_price * $item->quantity;
        });
    }
}