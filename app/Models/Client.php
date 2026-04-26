<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
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
        static::creating(function ($client) {
            $client->uuid = \Str::uuid();
        });
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    /*
    |--------------------------------------------------------------------------
    | Sales Invoices
    |--------------------------------------------------------------------------
    */

    public function salesInvoices()
    {
        return $this->hasMany(SalesInvoice::class);
    }

    public function salesReturns()
    {
        return $this->hasMany(SalesReturn::class, 'client_id');
    }

    public function clientTransactions()
    {
        return $this->hasMany(ClientTransaction::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Payments through invoices
    |--------------------------------------------------------------------------
    */

    public function payments()
    {
        return $this->hasManyThrough(
            Payment::class,
            SalesInvoice::class,
            'client_id',         // Foreign key on sales_invoices
            'sales_invoice_id',  // Foreign key on payments
            'id',                // Local key on clients
            'id'                 // Local key on sales_invoices
        );
    }
}
