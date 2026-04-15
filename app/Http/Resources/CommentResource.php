<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'body'         => $this->body,
            'author_name'  => $this->display_name,
            'parent_id'    => $this->parent_id,
            'replies'      => CommentResource::collection($this->whenLoaded('replies')),
            'created_at'   => $this->created_at?->diffForHumans(),
        ];
    }
}
