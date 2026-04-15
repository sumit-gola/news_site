<?php

namespace App\Http\Controllers;

use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EditorImageController extends Controller
{
    /**
     * Handle CKEditor SimpleUploadAdapter image upload.
     * Expects a multipart POST with an "upload" file field.
     * Returns { url } on success or { error: { message } } on failure.
     */
    public function upload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'upload' => ['required', 'file', 'image', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp,svg'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $msg = (string) (collect($e->errors())->flatten()->first() ?? 'Upload failed.');
            return response()->json(['error' => ['message' => $msg]], 422);
        }

        $file     = $request->file('upload');
        $ext      = strtolower($file->getClientOriginalExtension());
        $filename = Str::uuid() . '.' . $ext;
        $baseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

        $path = $file->storeAs('media/images', $filename, 'public');

        [$width, $height] = [null, null];
        $absPath = storage_path('app/public/' . $path);
        $dims    = @getimagesize($absPath);
        if ($dims) {
            $width  = $dims[0];
            $height = $dims[1];
        }

        Media::create([
            'user_id'   => Auth::id(),
            'file_name' => $baseName . '.' . $ext,
            'file_path' => $path,
            'file_type' => 'image',
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'width'     => $width,
            'height'    => $height,
        ]);

        return response()->json([
            'url' => asset('storage/' . $path),
        ]);
    }
}
