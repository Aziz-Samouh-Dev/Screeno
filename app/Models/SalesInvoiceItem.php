<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesInvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_invoice_id',
        'product_id',
        'product_name',
        'unit_price',
        'quantity',
        'total_price',
    ];

    public function invoice()
    {
        return $this->belongsTo(SalesInvoice::class, 'sales_invoice_id');
    }

    public function product()
    {
        return $this->belongsTo(Produit::class);
    }

    public function salesReturnItems()
    {
        return $this->hasMany(SalesReturnItem::class, 'product_id')
                    ->whereHas('salesReturn', function ($query) {
                        $query->where('sales_invoice_id', $this->sales_invoice_id);
                    });
    }

    protected static function booted()
    {
        static::saving(function ($item) {
            $item->total_price = $item->unit_price * $item->quantity;
        });
    }
}
