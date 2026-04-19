<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'produit_id', 'product_name', 'product_sku',
        'quantity_before', 'quantity_change', 'quantity_after',
        'movement_type', 'reason', 'reference',
        'user_id', 'user_name',
    ];

    public static function record(
        Produit $product,
        int     $quantityChange,
        string  $movementType,
        string  $reason  = '',
        string  $reference = ''
    ): void {
        $before = $product->stock_quantity;
        $after  = $before + $quantityChange;

        self::create([
            'produit_id'      => $product->id,
            'product_name'    => $product->nom,
            'product_sku'     => $product->sku,
            'quantity_before' => $before,
            'quantity_change' => $quantityChange,
            'quantity_after'  => $after,
            'movement_type'   => $movementType,
            'reason'          => $reason,
            'reference'       => $reference,
            'user_id'         => auth()->id(),
            'user_name'       => auth()->user()?->name,
        ]);
    }

    public function produit() { return $this->belongsTo(Produit::class); }
    public function user()    { return $this->belongsTo(\App\Models\User::class); }
}
