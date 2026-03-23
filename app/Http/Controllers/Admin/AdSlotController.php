<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdSlot;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdSlotController extends Controller
{
    public function index(): Response
    {
        $slots = AdSlot::query()
            ->withCount([
                'advertisements as active_ads_count' => fn ($q) => $q->where('status', 'active'),
            ])
            ->orderBy('position')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/ad-slots/Index', [
            'slots' => $slots,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/ad-slots/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:140'],
            'slug' => ['nullable', 'string', 'max:140', 'unique:ad_slots,slug'],
            'page' => ['nullable', 'string', 'max:60'],
            'position' => ['required', 'in:header,sidebar,inline,footer,popup'],
            'allowed_sizes' => ['nullable', 'array'],
            'allowed_sizes.*' => ['string', 'max:30'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        AdSlot::create([
            ...$validated,
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'location' => $validated['position'],
            'device_type' => 'all',
            'size' => !empty($validated['allowed_sizes']) ? implode(', ', $validated['allowed_sizes']) : 'flexible',
            'max_ads' => 1,
            'status' => $request->boolean('is_active', true) ? 'active' : 'inactive',
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('admin.ad-slots.index')->with('success', 'Ad slot created successfully.');
    }

    public function edit(AdSlot $adSlot): Response
    {
        return Inertia::render('admin/ad-slots/edit', [
            'slot' => $adSlot,
        ]);
    }

    public function update(Request $request, AdSlot $adSlot): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:140'],
            'slug' => ['nullable', 'string', 'max:140', 'unique:ad_slots,slug,' . $adSlot->id],
            'page' => ['nullable', 'string', 'max:60'],
            'position' => ['required', 'in:header,sidebar,inline,footer,popup'],
            'allowed_sizes' => ['nullable', 'array'],
            'allowed_sizes.*' => ['string', 'max:30'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $adSlot->update([
            ...$validated,
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'location' => $validated['position'],
            'device_type' => 'all',
            'size' => !empty($validated['allowed_sizes']) ? implode(', ', $validated['allowed_sizes']) : 'flexible',
            'max_ads' => 1,
            'status' => $request->boolean('is_active', false) ? 'active' : 'inactive',
            'is_active' => $request->boolean('is_active', false),
        ]);

        return redirect()->route('admin.ad-slots.index')->with('success', 'Ad slot updated successfully.');
    }

    public function destroy(AdSlot $adSlot): RedirectResponse
    {
        $adSlot->delete();

        return back()->with('success', 'Ad slot deleted successfully.');
    }
}
