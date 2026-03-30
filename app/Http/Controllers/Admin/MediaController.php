<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Media::with('user:id,name')
            ->when($request->search, fn ($q) => $q->where('file_name', 'like', '%' . $request->search . '%'))
            ->when($request->type, fn ($q) => $q->where('file_type', $request->type))
            ->latest();

        return Inertia::render('admin/media/Index', [
            'media'   => $query->paginate(30)->withQueryString(),
            'filters' => $request->only(['search', 'type']),
            'stats'   => [
                'total'     => Media::count(),
                'images'    => Media::where('file_type', 'image')->count(),
                'videos'    => Media::where('file_type', 'video')->count(),
                'documents' => Media::where('file_type', 'document')->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:20480',
                'mimes:jpg,jpeg,png,gif,webp,svg,mp4,mov,avi,mp3,wav,pdf,doc,docx'],
        ]);

        $file = $request->file('file');
        $mime = (string) ($file->getMimeType() ?? 'application/octet-stream');

        $type = match (true) {
            str_starts_with($mime, 'image/') => 'image',
            str_starts_with($mime, 'video/') => 'video',
            str_starts_with($mime, 'audio/') => 'audio',
            default                           => 'document',
        };

        $ext      = strtolower($file->getClientOriginalExtension());
        $baseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $filename = Str::uuid() . '.' . $ext;

        $folder = match ($type) {
            'image'  => 'media/images',
            'video'  => 'media/videos',
            'audio'  => 'media/audio',
            default  => 'media/documents',
        };

        $path = $file->storeAs($folder, $filename, 'public');

        [$width, $height] = [null, null];
        if ($type === 'image') {
            $dims = @getimagesize(storage_path('app/public/' . $path));
            if ($dims) {
                $width  = $dims[0];
                $height = $dims[1];
            }
        }

        $media = Media::create([
            'user_id'   => Auth::id(),
            'file_name' => $baseName . '.' . $ext,
            'file_path' => $path,
            'file_type' => $type,
            'mime_type' => $mime,
            'file_size' => $file->getSize(),
            'width'     => $width,
            'height'    => $height,
        ]);

        return response()->json($media->append(['url', 'human_size']));
    }

    public function update(Request $request, Media $media): JsonResponse
    {
        $data = $request->validate([
            'file_name' => ['nullable', 'string', 'max:255'],
            'alt_text'  => ['nullable', 'string', 'max:500'],
        ]);

        $media->update(array_filter($data, fn ($v) => $v !== null));

        return response()->json($media->fresh()->append(['url', 'human_size']));
    }

    public function destroy(Media $media): JsonResponse
    {
        Storage::disk('public')->delete($media->file_path);
        $media->forceDelete();

        return response()->json(['deleted' => true]);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $items = Media::whereIn('id', $validated['ids'])->get();

        foreach ($items as $m) {
            Storage::disk('public')->delete($m->file_path);
            $m->forceDelete();
        }

        return response()->json(['deleted' => $items->count()]);
    }
}
