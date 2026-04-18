<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'nom',
        'email',
        'telephone',
        'adresse',
        'ville',
        'notes',
        'status',
    ];

    protected static function booted()
    {
        static::creating(function ($supplier) {
            $supplier->uuid = \Str::uuid();
        });
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    public function purchaseInvoices()
    {
        return $this->hasMany(PurchaseInvoice::class);
    }

    public function payments()
    {
        return $this->hasManyThrough(
            Payment::class,
            PurchaseInvoice::class,
            'supplier_id',          // Foreign key on purchase_invoices
            'purchase_invoice_id',  // Foreign key on payments
            'id',                   // Local key on suppliers
            'id'                    // Local key on purchase_invoices
        );
    }
}
