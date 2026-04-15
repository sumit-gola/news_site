<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'title'               => $this->title,
            'slug'                => $this->slug,
            'excerpt'             => $this->excerpt,
            'content'             => $this->when($request->routeIs('api.articles.show'), $this->content),
            'featured_image_url'  => $this->featured_image_url,
            'status'              => $this->status,
            'published_at'        => $this->published_at?->toIso8601String(),
            'is_breaking'         => $this->is_breaking,
            'is_featured'         => $this->is_featured,
            'allow_comments'      => $this->allow_comments,
            'views'               => $this->views,
            'read_time'           => $this->read_time,
            'author'              => [
                'id'   => $this->author?->id,
                'name' => $this->author?->name,
            ],
            'categories'          => CategoryResource::collection($this->whenLoaded('categories')),
            'tags'                => TagResource::collection($this->whenLoaded('tags')),
            'meta'                => $this->when($request->routeIs('api.articles.show'), [
                'meta_title'       => $this->meta?->meta_title,
                'meta_description' => $this->meta?->meta_description,
                'canonical_url'    => $this->meta?->canonical_url,
                'og_image'         => $this->meta?->og_image,
            ]),
            'url'                 => route('news.show', $this->slug),
            'created_at'          => $this->created_at?->toIso8601String(),
            'updated_at'          => $this->updated_at?->toIso8601String(),
        ];
    }
}
