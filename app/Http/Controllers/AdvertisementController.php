<?php

namespace App\Http\Controllers;

use App\Models\Advertisement;
use App\Services\AdServingService;
use App\Services\AdTrackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdvertisementController extends Controller
{
    public function __construct(
        private readonly AdServingService  $serving,
        private readonly AdTrackingService $tracking,
    ) {}

    /**
     * Fetch active ads for a given placement and device.
     *
     * GET /api/ads?placement=header&device=desktop&page_url=...
     */
    public function fetch(Request $request): JsonResponse
    {
        $request->validate([
            'placement' => ['required', Rule::in(['header', 'sidebar', 'inline', 'footer', 'popup'])],
            'device'    => ['required', Rule::in(['desktop', 'tablet', 'mobile'])],
        ]);

        $ads = $this->serving->serve($request->placement, $request->device);

        return response()->json(['data' => $ads]);
    }

    /**
     * Track an impression.
     *
     * POST /api/ads/impression
     * Body: { ad_id: int, variant_label?: string, page_url?: string }
     */
    public function impression(Request $request): JsonResponse
    {
        $request->validate([
            'ad_id'         => ['required', 'integer', 'exists:advertisements,id'],
            'variant_label' => ['nullable', 'string', 'in:A,B'],
            'page_url'      => ['nullable', 'string', 'max:2048'],
        ]);

        $ad = Advertisement::findOrFail($request->ad_id);
        $this->tracking->recordImpression($ad, $request, $request->variant_label);

        return response()->json(['ok' => true]);
    }

    /**
     * Track a click.
     *
     * POST /api/ads/click
     * Body: { ad_id: int, variant_label?: string, page_url?: string }
     */
    public function click(Request $request): JsonResponse
    {
        $request->validate([
            'ad_id'         => ['required', 'integer', 'exists:advertisements,id'],
            'variant_label' => ['nullable', 'string', 'in:A,B'],
            'page_url'      => ['nullable', 'string', 'max:2048'],
        ]);

        $ad = Advertisement::findOrFail($request->ad_id);
        $this->tracking->recordClick($ad, $request, $request->variant_label);

        return response()->json(['ok' => true]);
    }
}
