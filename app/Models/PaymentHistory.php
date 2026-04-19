<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentHistory extends Model
{
    protected $fillable = [
        'payment_id', 'payment_uuid', 'action', 'amount',
        'invoice_code', 'client_name', 'payment_method',
        'reference', 'notes', 'user_id', 'user_name', 'changes',
    ];

    protected $casts = ['changes' => 'array'];

    public static function record(string $action, Payment $payment, ?array $changes = null): void
    {
        self::create([
            'payment_id'     => $payment->id,
            'payment_uuid'   => $payment->uuid,
            'action'         => $action,
            'amount'         => $payment->amount,
            'invoice_code'   => $payment->salesInvoice?->code ?? $payment->purchaseInvoice?->code,
            'client_name'    => $payment->salesInvoice?->client?->nom,
            'payment_method' => $payment->paymentMethod?->name,
            'reference'      => $payment->reference,
            'notes'          => $payment->notes,
            'user_id'        => auth()->id(),
            'user_name'      => auth()->user()?->name,
            'changes'        => $changes,
        ]);
    }

    public function payment() { return $this->belongsTo(Payment::class); }
    public function user()    { return $this->belongsTo(\App\Models\User::class); }
}
