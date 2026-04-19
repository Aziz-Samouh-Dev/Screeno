<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyProfile extends Model
{
    protected $fillable = [
        'name', 'address', 'city', 'country',
        'phone', 'email', 'tax_id', 'ice', 'notes',
    ];
}
