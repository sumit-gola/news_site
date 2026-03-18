<?php

namespace App\Http\Controllers;

use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    /**
     * Display media library with pagination and filters.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Media::class);

        $user = auth()->user();
        $query = Media::with('uploadedBy');

        // Reporters see only their own uploads
        if ($user->isReporter()) {
            $query->where('user_id', $user->id);
        }
        // Managers and admins see all

        $media = $query
            ->when($request->type, fn ($q) => $q->where('file_type', $request->type))
            ->when($request->search, fn ($q) => $q->where('file_name', 'like', "%{$request->search}%")
                ->orWhere('alt_text', 'like', "%{$request->search}%"))
            ->latest('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('media/Index', [
            'media'    => $media,
            'filters'  => $request->only(['type', 'search']),
            'types'    => ['image', 'video', 'document', 'audio'],
        ]);
    }

    /**
     * Upload a new media file.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Media::class);

        $validated = $request->validate([
            'file'     => ['required', 'file', 'max:51200'], // 50MB max
            'alt_text' => ['nullable', 'string', 'max:255'],
            'title'    => ['nullable', 'string', 'max:255'],
        ]);

        $file = $validated['file'];
        $mimeType = $file->getMimeType();
        $fileType = $this->determineFileType($mimeType);
        $fileName = $file->getClientOriginalName();

        // Store the file
        $filePath = $file->storeAs(
            'media/' . $fileType,
            date('Y/m/d') . '/' . uniqid() . '_' . $fileName,
            'public'
        );

        // Get image dimensions if applicable
        $width = null;
        $height = null;
        if ($fileType === 'image') {
            [$width, $height] = getimagesize(Storage::disk('public')->path($filePath));
        }

        // Create media record
        $media = Media::create([
            'user_id'    => auth()->id(),
            'file_name'  => $fileName,
            'file_path'  => $filePath,
            'file_type'  => $fileType,
            'mime_type'  => $mimeType,
            'file_size'  => $file->getSize(),
            'width'      => $width,
            'height'     => $height,
            'alt_text'   => $validated['alt_text'] ?? '',
        ]);

        activity()
            ->performedOn($media)
            ->causedBy(auth()->user())
            ->log('uploaded');

        return response()->json([
            'message' => 'File uploaded successfully.',
            'media'   => $media,
            'url'     => $media->url,
        ], 201);
    }

    /**
     * Display a single media resource.
     */
    public function show(Media $media): JsonResponse
    {
        $this->authorize('view', $media);

        return response()->json([
            'media'   => $media->load('uploadedBy', 'articles'),
            'articles'=> $media->articles->pluck('id', 'title'),
        ]);
    }

    /**
     * Update media metadata (alt_text, title, etc.).
     */
    public function update(Request $request, Media $media): JsonResponse
    {
        $this->authorize('update', $media);

        $validated = $request->validate([
            'alt_text' => ['nullable', 'string', 'max:255'],
        ]);

        $media->update($validated);

        activity()
            ->performedOn($media)
            ->causedBy(auth()->user())
            ->log('updated metadata');

        return response()->json([
            'message' => 'Media updated successfully.',
            'media'   => $media,
        ]);
    }

    /**
     * Delete a media file (soft delete).
     */
    public function destroy(Media $media): JsonResponse
    {
        $this->authorize('delete', $media);

        // Check if media is still attached to published articles
        $publishedArticles = $media->articles()
            ->where('status', 'published')
            ->count();

        if ($publishedArticles > 0) {
            return response()->json([
                'error' => 'Cannot delete media attached to published articles.',
            ], 422);
        }

        activity()
            ->performedOn($media)
            ->causedBy(auth()->user())
            ->log('deleted');

        $media->delete();

        return response()->json(['message' => 'Media deleted successfully.']);
    }

    /**
     * Bulk delete media files.
     */
    public function destroyMultiple(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:media,id'],
        ]);

        foreach ($validated['ids'] as $id) {
            $media = Media::find($id);
            if ($media) {
                $this->authorize('delete', $media);
                $media->delete();
            }
        }

        return response()->json(['message' => 'Selected media deleted successfully.']);
    }

    /**
     * Determine file type based on MIME type.
     */
    private function determineFileType(string $mimeType): string
    {
        return match (true) {
            str_starts_with($mimeType, 'image/') => 'image',
            str_starts_with($mimeType, 'video/') => 'video',
            str_starts_with($mimeType, 'audio/') => 'audio',
            in_array($mimeType, [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain',
            ]) => 'document',
            default => 'document',
        };
    }
}
