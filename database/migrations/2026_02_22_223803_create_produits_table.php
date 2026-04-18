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
        Schema::create('produits', function (Blueprint $table) {
            $table->id();

            // Unique identifier (safe for public use)
            $table->uuid('uuid')->unique();

            // Product info
            $table->string('nom');
            $table->string('sku')->unique();
            $table->string('image')->nullable();
            $table->text('description')->nullable();

            // Pricing
            $table->decimal('purchase_price', 15, 2);
            $table->decimal('sale_price', 15, 2);

            // Stock
            $table->integer('stock_quantity')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('produits');
    }
};
