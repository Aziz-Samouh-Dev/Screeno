<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentMethodController extends Controller
{
    /**
     * Display a listing of the payment methods
     */
    public function index(Request $request)
    {
        $methods = PaymentMethod::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        return Inertia::render('settings/payment_methods', [
            'paymentMethods' => $methods,
            'filters' => [
                'search' => $request->search ?? '',
                'per_page' => $request->per_page ?? 10,
            ],
        ]);
    }

    /**
     * Store a newly created payment method
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:payment_methods,code',
            'description' => 'nullable|string|max:500',
            'is_active' => 'required|boolean',
        ]);

        PaymentMethod::create($validated);

        return redirect()->back()->with('success', 'Méthode de paiement créée avec succès.');
    }

    /**
     * Update the specified payment method
     */
    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_active' => 'required|boolean',
            // Do not allow code to be changed on edit
        ]);

        $paymentMethod->update($validated);

        return redirect()->back()->with('success', 'Méthode de paiement mise à jour avec succès.');
    }

    /**
     * Remove the specified payment method
     */
    public function destroy(PaymentMethod $paymentMethod)
    {
        $paymentMethod->delete();

        return redirect()->back()->with('success', 'Méthode de paiement supprimée avec succès.');
    }
}