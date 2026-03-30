<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'file_name', 'file_path', 'file_type',
        'mime_type', 'file_size', 'width', 'height', 'alt_text',
    ];

    protected $appends = ['url', 'human_size'];

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->file_path);
    }

    public function getHumanSizeAttribute(): string
    {
        $bytes = (int) ($this->file_size ?? 0);
        if ($bytes < 1024) return $bytes . ' B';
        if ($bytes < 1_048_576) return round($bytes / 1024, 1) . ' KB';
        return round($bytes / 1_048_576, 1) . ' MB';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
