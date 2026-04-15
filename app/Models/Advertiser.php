<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Advertiser extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'company_name',
        'description',
        'notes',
        'website',
        'logo_url',
        'status',
        'contract_start_date',
        'contract_end_date',
        'monthly_budget',
        'spent_amount',
        'contact_person',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'contract_start_date' => 'date',
        'contract_end_date' => 'date',
        'monthly_budget' => 'decimal:2',
        'spent_amount' => 'decimal:2',
    ];

    public function advertisements(): HasMany
    {
        return $this->hasMany(Advertisement::class);
    }
}
