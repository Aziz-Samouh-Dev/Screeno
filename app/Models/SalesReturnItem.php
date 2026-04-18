<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_return_id',
        'product_id',
        'product_name',
        'unit_price',
        'quantity',
        'total_price',
    ];
    protected $casts = ['total_price' => 'decimal:2'];

    /*
    |------------------------------------------------------------------
    | RELATIONS
    |------------------------------------------------------------------
    */

    public function salesReturn()
    {
        return $this->belongsTo(SalesReturn::class);
    }

    public function product()
    {
        return $this->belongsTo(Produit::class);
    }

    /*
    |------------------------------------------------------------------
    | AUTO CALCULATE TOTAL
    |------------------------------------------------------------------
    */

    protected static function booted()
    {
        static::saving(function ($item) {
            $item->total_price = $item->unit_price * $item->quantity;
        });
    }
}
