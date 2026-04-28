<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdSchedule extends Model
{
    protected $fillable = [
        'advertisement_id',
        'days_of_week',
        'time_from',
        'time_to',
        'timezone',
    ];

    protected $casts = [
        'days_of_week' => 'array',
    ];

    public function advertisement(): BelongsTo
    {
        return $this->belongsTo(Advertisement::class);
    }

    /**
     * Check whether this schedule allows serving at the given moment.
     */
    public function isActiveAt(Carbon $moment): bool
    {
        $local = $moment->copy()->setTimezone($this->timezone ?? 'UTC');

        // Day-of-week check (0 = Sunday … 6 = Saturday)
        if (!empty($this->days_of_week) && !in_array($local->dayOfWeek, $this->days_of_week)) {
            return false;
        }

        // Time-window check
        if ($this->time_from && $this->time_to) {
            $currentTime = $local->format('H:i:s');
            if ($currentTime < $this->time_from || $currentTime > $this->time_to) {
                return false;
            }
        }

        return true;
    }
}
