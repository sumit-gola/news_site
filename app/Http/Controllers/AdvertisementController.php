<?php

namespace App\Http\Controllers;

use App\Models\Advertisement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdvertisementController extends Controller
{
    /**
     * Fetch active ads for a given placement and device.
     *
     * GET /api/advertisements?placement=header&device=desktop
     */
    public function fetch(Request $request): JsonResponse
    {
        $request->validate([
            'placement' => ['required', Rule::in(['header', 'sidebar', 'inline', 'footer', 'popup'])],
            'device'    => ['required', Rule::in(['desktop', 'tablet', 'mobile'])],
        ]);

        $ads = Advertisement::active()
            ->forPlacement($request->placement)
            ->forDevice($request->device)
            ->orderByDesc('priority')
            ->get([
                'id', 'title', 'description', 'media_url', 'media_type',
                'redirect_url', 'placement_type', 'device_target',
                'is_dismissible', 'priority',
            ])
            ->map(fn ($ad) => array_merge($ad->toArray(), [
                'media_full_url' => $ad->media_full_url,
            ]));

        return response()->json(['data' => $ads]);
    }

    /**
     * Track an ad impression.
     *
     * POST /api/advertisements/{ad}/impression
     */
    public function trackImpression(Advertisement $advertisement): JsonResponse
    {
        $advertisement->incrementImpressions();

        return response()->json(['ok' => true]);
    }

    /**
     * Track an ad click.
     *
     * POST /api/advertisements/{ad}/click
     */
    public function trackClick(Advertisement $advertisement): JsonResponse
    {
        $advertisement->incrementClicks();

        return response()->json(['ok' => true]);
    }
}
