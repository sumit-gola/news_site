<?php

namespace App\Repositories;

use App\Models\Advertisement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class AdvertisementRepository
{
    /**
     * Fetch ads eligible to serve: active + within datetime window + matching placement/device.
     * Schedule time-window filtering happens in AdServingService after this query.
     */
    public function activeForPlacement(string $placement, string $device): Collection
    {
        return Advertisement::with(['schedule', 'variants'])
            ->active()
            ->forPlacement($placement)
            ->forDevice($device)
            ->orderByDesc('priority')
            ->get();
    }

    /**
     * Admin list with filters and pagination.
     */
    public function paginatedForAdmin(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return Advertisement::withTrashed()
            ->with('creator:id,name')
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->when($filters['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($filters['ad_type'] ?? null, fn ($q, $t) => $q->where('ad_type', $t))
            ->when($filters['placement'] ?? null, fn ($q, $p) => $q->where('placement_type', $p))
            ->when($filters['device'] ?? null, fn ($q, $d) => $q->where('device_target', $d))
            ->when($filters['trashed'] ?? null, fn ($q) => $q->whereNotNull('deleted_at'))
            ->when(!($filters['trashed'] ?? null), fn ($q) => $q->whereNull('deleted_at'))
            ->orderByDesc('priority')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Quick count snapshot for stats bar.
     */
    public function statsSnapshot(): array
    {
        return [
            'total'    => Advertisement::count(),
            'active'   => Advertisement::where('status', 'active')->count(),
            'draft'    => Advertisement::where('status', 'draft')->count(),
            'inactive' => Advertisement::where('status', 'inactive')->count(),
            'trashed'  => Advertisement::onlyTrashed()->count(),
        ];
    }

    public function findWithRelations(int $id): ?Advertisement
    {
        return Advertisement::with(['variants', 'schedule'])->find($id);
    }

    public function findTrashed(int $id): ?Advertisement
    {
        return Advertisement::withTrashed()->findOrFail($id);
    }
}
