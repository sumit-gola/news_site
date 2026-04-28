<?php

namespace App\Services;

use App\Models\Advertisement;
use App\Models\AdVariant;
use App\Repositories\AdvertisementRepository;
use Illuminate\Support\Facades\Cache;

class AdServingService
{
    public function __construct(
        private readonly AdvertisementRepository $repository,
    ) {}

    /**
     * Return serializable ad DTOs ready for the API response.
     * Results are cached per placement+device for 60 seconds.
     */
    public function serve(string $placement, string $device): array
    {
        $cacheKey = "ads:{$placement}:{$device}";

        $ads = Cache::tags(['ads'])->remember($cacheKey, 60, function () use ($placement, $device) {
            return $this->repository->activeForPlacement($placement, $device);
        });

        $now = now();

        return $ads
            ->filter(fn (Advertisement $ad) => $this->passesSchedule($ad, $now))
            ->map(fn (Advertisement $ad) => $this->toDto($ad))
            ->values()
            ->all();
    }

    /**
     * Flush all cached ad responses — called on any ad mutation.
     */
    public function flushCache(): void
    {
        Cache::tags(['ads'])->flush();
    }

    // ─── Private ─────────────────────────────────────────────────────────────

    private function passesSchedule(Advertisement $ad, \Carbon\Carbon $now): bool
    {
        $schedule = $ad->schedule;
        if (!$schedule) return true;
        return $schedule->isActiveAt($now);
    }

    private function toDto(Advertisement $ad): array
    {
        $variant = $ad->selectVariant();

        return [
            'id'                      => $ad->id,
            'title'                   => $ad->title,
            'description'             => $ad->description,
            'ad_type'                 => $ad->ad_type,
            'media_type'              => $ad->media_type,
            'media_full_url'          => $variant?->media_full_url ?? $ad->media_full_url,
            'embed_code'              => $variant?->embed_code ?? $ad->embed_code,
            'redirect_url'            => $ad->redirect_url,
            'cta_label'               => $variant?->cta_label ?? $ad->cta_label,
            'bg_color'                => $ad->bg_color,
            'placement_type'          => $ad->placement_type,
            'device_target'           => $ad->device_target,
            'is_dismissible'          => $ad->is_dismissible,
            'float_position'          => $ad->float_position,
            'float_animation'         => $ad->float_animation,
            'popup_delay_seconds'     => $ad->popup_delay_seconds,
            'popup_frequency_minutes' => $ad->popup_frequency_minutes,
            'sticky_offset_px'        => $ad->sticky_offset_px,
            'priority'                => $ad->priority,
            'variant_label'           => $variant?->label,
        ];
    }
}
