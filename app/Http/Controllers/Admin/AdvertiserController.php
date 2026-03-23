<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Advertiser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdvertiserController extends Controller
{
    public function index(Request $request): Response
    {
        $advertisers = Advertiser::query()
            ->withCount('advertisements')
            ->withCount([
                'advertisements as active_ads_count' => fn ($q) => $q->where('status', 'active'),
            ])
            ->when($request->search, fn ($q) => $q->where('name', 'like', '%' . trim((string) $request->search) . '%'))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/advertisers/Index', [
            'advertisers' => $advertisers,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/advertisers/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company_name' => ['nullable', 'string', 'max:140'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        Advertiser::create($validated + [
            'slug' => Str::slug($validated['name']),
            'description' => $validated['notes'] ?? null,
            'status' => $request->boolean('is_active', true) ? 'active' : 'inactive',
            'contact_person' => $validated['name'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('admin.advertisers.index')->with('success', 'Client created successfully.');
    }

    public function edit(Advertiser $advertiser): Response
    {
        return Inertia::render('admin/advertisers/Edit', [
            'advertiser' => $advertiser,
        ]);
    }

    public function update(Request $request, Advertiser $advertiser): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company_name' => ['nullable', 'string', 'max:140'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $advertiser->update($validated + [
            'slug' => Str::slug($validated['name']),
            'description' => $validated['notes'] ?? null,
            'status' => $request->boolean('is_active', false) ? 'active' : 'inactive',
            'contact_person' => $validated['name'],
            'is_active' => $request->boolean('is_active', false),
        ]);

        return redirect()->route('admin.advertisers.index')->with('success', 'Client updated successfully.');
    }

    public function destroy(Advertiser $advertiser): RedirectResponse
    {
        $advertiser->delete();

        return back()->with('success', 'Client deleted successfully.');
    }
}
