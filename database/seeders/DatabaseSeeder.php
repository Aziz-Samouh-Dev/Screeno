<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Client;
use App\Models\Supplier;
use App\Models\Produit;
use App\Models\PaymentMethod;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // =========================
        // 1️⃣ Create Admin User
        // =========================
        User::create([
            'name' => 'Amin',
            'email' => 'amin@screenino.com',
            'password' => Hash::make('Amin@1234'),
        ]);

        // =========================
        // 2️⃣ Create 10 Produits
        // =========================
        $produits = [
            ['nom' => 'HP Pavilion Laptop', 'sku' => 'HP-LAP-001', 'purchase_price' => 500, 'sale_price' => 650, 'stock_quantity' => 15],
            ['nom' => 'Dell Inspiron Laptop', 'sku' => 'DEL-LAP-002', 'purchase_price' => 600, 'sale_price' => 750, 'stock_quantity' => 10],
        ];

        foreach ($produits as $produit) {
            Produit::create([
                'uuid' => Str::uuid(),
                'nom' => $produit['nom'],
                'sku' => $produit['sku'],
                'image' => null,
                'description' => 'High quality electronic product.',
                'purchase_price' => $produit['purchase_price'],
                'sale_price' => $produit['sale_price'],
                'stock_quantity' => $produit['stock_quantity'],
            ]);
        }

        // =========================
        // 3️⃣ Create 10 Clients
        // =========================
        $clients = [
            ['nom' => 'Ahmed Benali', 'email' => 'ahmed@gmail.com'],
            ['nom' => 'Sara Mohamed', 'email' => 'sara@gmail.com'],
        ];

        foreach ($clients as $client) {
            Client::create([
                'nom' => $client['nom'],
                'email' => $client['email'],
                'telephone' => '0600000000',
                'adresse' => '123 Main Street',
                'ville' => 'Casablanca',
                'notes' => 'Client fidèle',
                'status' => 'active',
            ]);
        }

        // =========================
        // 3️⃣ Create 10 Suppliers
        // =========================
        $suppliers = [
            ['nom' => 'Ahmed Benali', 'email' => 'ahmed@gmail.com'],
            ['nom' => 'Sara Mohamed', 'email' => 'sara@gmail.com'],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create([
                'nom' => $supplier['nom'],
                'email' => $supplier['email'],
                'telephone' => '0600000000',
                'adresse' => '123 Main Street',
                'ville' => 'Casablanca',
                'notes' => 'Fournisseur fiable',
                'status' => 'active',
            ]);
        }

        $methods = [
            ['name' => 'Cash', 'code' => 'CASH', 'description' => 'Cash payment', 'is_active' => true],
            ['name' => 'Credit Card', 'code' => 'CARD', 'description' => 'Visa, Mastercard, etc.', 'is_active' => true],
            ['name' => 'Cheque', 'code' => 'CHEQUE', 'description' => 'Cheque payment', 'is_active' => true],
            ['name' => 'Bank Transfer', 'code' => 'BANK', 'description' => 'Wire transfer', 'is_active' => true],
        ];

        foreach ($methods as $method) {
            PaymentMethod::firstOrCreate(['code' => $method['code']], $method);
        }


    }
}
