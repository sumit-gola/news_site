<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdPerformance;
use App\Models\Advertisement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdSlotController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'position' => ['required', 'in:header,sidebar,inline,footer,popup'],
            'page' => ['required', 'in:home,article,category,search'],
            'category' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $categoryId = $request->integer('category_id');

        $ads = Advertisement::query()
            ->active()
            ->where('position', $request->string('position'))
            ->where(function ($query) use ($request): void {
                $query->whereNull('pages')
                    ->orWhereJsonContains('pages', $request->string('page')->toString());
            })
            ->when($categoryId, function ($query) use ($categoryId): void {
                $query->where(function ($q) use ($categoryId): void {
                    $q->whereNull('category_ids')
                        ->orWhereJsonContains('category_ids', $categoryId);
                });
            })
            ->orderByDesc('priority')
            ->limit($request->integer('limit', 5))
            ->get([
                'id',
                'title',
                'ad_type',
                'image_path',
                'html_code',
                'script_code',
                'target_url',
                'open_in_new_tab',
                'width',
                'height',
                'position',
            ]);

        return response()->json([
            'data' => $ads,
        ]);
    }

    public function trackImpression(Advertisement $advertisement): JsonResponse
    {
        $advertisement->increment('total_impressions');

        $row = AdPerformance::firstOrCreate([
            'advertisement_id' => $advertisement->id,
            'date' => now()->toDateString(),
        ]);

        $row->increment('impressions');
        $this->updateCtr($row);

        return response()->json(['ok' => true]);
    }

    public function trackClick(Advertisement $advertisement): JsonResponse
    {
        $advertisement->increment('total_clicks');

        $row = AdPerformance::firstOrCreate([
            'advertisement_id' => $advertisement->id,
            'date' => now()->toDateString(),
        ]);

        $row->increment('clicks');
        $this->updateCtr($row);

        return response()->json(['ok' => true]);
    }

    private function updateCtr(AdPerformance $row): void
    {
        $row->refresh();

        $ctr = $row->impressions > 0
            ? round(($row->clicks / $row->impressions) * 100, 4)
            : 0;

        $row->update(['ctr' => $ctr]);
    }
}
