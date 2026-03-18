<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'description',
        'properties',
        'ip_address',
    ];

    protected $casts = [
        'properties' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log a user action.
     */
    public static function record(
        string $action,
        string $description,
        Model $subject,
        ?array $properties = null
    ): self {
        return static::create([
            'user_id'      => auth()->id(),
            'action'       => $action,
            'subject_type' => get_class($subject),
            'subject_id'   => $subject->getKey(),
            'description'  => $description,
            'properties'   => $properties,
            'ip_address'   => request()->ip(),
        ]);
    }
}
