<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CompanyProfileController extends Controller
{
    public function edit()
    {
        return Inertia::render('settings/company', [
            'company' => CompanyProfile::first() ?? new CompanyProfile(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'city'    => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'phone'   => 'nullable|string|max:50',
            'email'   => 'nullable|email|max:255',
            'tax_id'  => 'nullable|string|max:50',
            'ice'     => 'nullable|string|max:50',
            'notes'   => 'nullable|string',
        ]);

        CompanyProfile::updateOrCreate(['id' => 1], $validated);

        return back()->with('success', 'Profil de l\'entreprise mis à jour avec succès.');
    }
}
