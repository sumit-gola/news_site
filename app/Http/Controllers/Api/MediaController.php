<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    /**
     * Return paginated image list for the in-editor media picker.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Media::where('file_type', 'image')
            ->when($request->search, fn ($q) => $q->where('file_name', 'like', '%' . $request->search . '%'))
            ->latest();

        return response()->json(
            $query->paginate(30)->through(fn ($m) => [
                'id'         => $m->id,
                'url'        => $m->url,
                'file_name'  => $m->file_name,
                'alt_text'   => $m->alt_text,
                'width'      => $m->width,
                'height'     => $m->height,
                'human_size' => $m->human_size,
            ])
        );
    }
}
