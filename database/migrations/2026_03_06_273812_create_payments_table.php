<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            // relation to invoice
            $table->foreignId('purchase_invoice_id')
                ->nullable()
                ->constrained('purchase_invoices')
                ->cascadeOnDelete();

            $table->foreignId('sales_invoice_id')
                ->nullable()
                ->constrained('sales_invoices')
                ->cascadeOnDelete();

            // payment method
            $table->foreignId('payment_method_id')
                ->nullable()
                ->constrained('payment_methods')
                ->nullOnDelete();

            $table->decimal('amount', 15, 2);

            $table->date('payment_date');

            $table->string('reference')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
