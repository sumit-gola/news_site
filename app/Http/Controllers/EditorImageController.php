<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
        $request->validate([
            'upload' => ['required', 'file', 'image', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp,svg'],
        ]);

        $file     = $request->file('upload');
        $ext      = strtolower($file->getClientOriginalExtension());
        $filename = Str::uuid() . '.' . $ext;

        $path = $file->storeAs('editor-images', $filename, 'public');

        return response()->json([
            'url' => Storage::disk('public')->url($path),
        ]);
    }
}
