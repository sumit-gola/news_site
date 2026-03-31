<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class SqliteImportSeeder extends Seeder
{
    private string $sqlitePath;

    public function __construct()
    {
        $this->sqlitePath = database_path('database.sqlite');
    }

    public function run(): void
    {
        if (! file_exists($this->sqlitePath)) {
            $this->command->error("SQLite file not found: {$this->sqlitePath}");
            return;
        }

        // Register temporary SQLite connection
        config(['database.connections.sqlite_src' => [
            'driver'   => 'sqlite',
            'database' => $this->sqlitePath,
            'prefix'   => '',
            'foreign_key_constraints' => false,
        ]]);

        $src = DB::connection('sqlite_src');

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $this->importLanguages($src);
        $this->importUsers($src);
        $this->importCategories($src);
        $this->importArticles($src);
        $this->importArticleMeta($src);
        $this->importArticleCategories($src);
        $this->importPages($src);
        $this->importComments($src);
        $this->importAdSlots($src);
        $this->importAdvertisers($src);
        $this->importAdvertisements($src);
        $this->importAdPerformance($src);
        $this->importRolesAndPermissions($src);

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $this->command->info('SQLite import completed.');
    }

    // ── Languages ─────────────────────────────────────────────────────────────

    private function importLanguages($src): void
    {
        if (! Schema::hasTable('languages')) {
            $this->command->warn('languages table does not exist — skipping.');
            return;
        }

        DB::table('languages')->truncate();

        $rows = $src->table('languages')->get();
        foreach ($rows as $row) {
            DB::table('languages')->insert([
                'id'          => $row->id,
                'code'        => $row->code,
                'name'        => $row->name,
                'native_name' => $row->native_name,
                'direction'   => $row->direction,
                'is_active'   => $row->is_active,
                'sort_order'  => $row->sort_order,
                'created_at'  => $row->created_at,
                'updated_at'  => $row->updated_at,
            ]);
        }

        $this->command->info("Languages: {$rows->count()} imported.");
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    private function importUsers($src): void
    {
        DB::table('model_has_roles')->truncate();
        DB::table('model_has_permissions')->truncate();
        DB::table('users')->truncate();

        $rows = $src->table('users')->get();
        foreach ($rows as $row) {
            DB::table('users')->insert([
                'id'                        => $row->id,
                'name'                      => $row->name,
                'email'                     => $row->email,
                'email_verified_at'         => $row->email_verified_at,
                'password'                  => $row->password,
                'remember_token'            => $row->remember_token,
                'status'                    => $row->status ?? 'active',
                'created_at'                => $row->created_at,
                'updated_at'                => $row->updated_at,
                'two_factor_secret'         => null,
                'two_factor_recovery_codes' => null,
                'two_factor_confirmed_at'   => null,
            ]);
        }

        $this->command->info("Users: {$rows->count()} imported.");
    }

    // ── Categories ────────────────────────────────────────────────────────────

    private function importCategories($src): void
    {
        DB::table('article_category')->truncate();
        DB::table('categories')->truncate();

        // Import root categories first (parent_id IS NULL), then children
        $all = $src->table('categories')->get();

        $roots    = $all->whereNull('parent_id')->values();
        $children = $all->whereNotNull('parent_id')->values();

        foreach ([$roots, $children] as $batch) {
            foreach ($batch as $row) {
                DB::table('categories')->insert([
                    'id'               => $row->id,
                    'parent_id'        => $row->parent_id,
                    'name'             => $row->name,
                    'slug'             => $row->slug,
                    'description'      => $row->description,
                    'featured_image'   => $row->featured_image,
                    'color'            => $row->color,
                    'icon'             => $row->icon ?? null,
                    'meta_title'       => isset($row->meta_title) ? Str::limit($row->meta_title, 250, '') : null,
                    'meta_description' => isset($row->meta_description) ? Str::limit($row->meta_description, 155, '') : null,
                    'meta_keywords'    => isset($row->meta_keywords) ? Str::limit($row->meta_keywords, 250, '') : null,
                    'og_image'         => $row->og_image ?? null,
                    'order'            => $row->order ?? 0,
                    'is_active'        => $row->is_active ?? 1,
                    'created_at'       => $row->created_at,
                    'updated_at'       => $row->updated_at,
                    'deleted_at'       => $row->deleted_at ?? null,
                ]);
            }
        }

        $this->command->info("Categories: {$all->count()} imported.");
    }

    // ── Articles ──────────────────────────────────────────────────────────────

    private function importArticles($src): void
    {
        DB::table('article_meta')->truncate();
        DB::table('article_category')->truncate();
        DB::table('article_tag')->truncate();
        DB::table('article_media')->truncate();
        DB::table('articles')->truncate();

        $total = $src->table('articles')->count();
        $imported = 0;

        // Insert one at a time — articles can be several MB each (large Hindi content)
        $src->table('articles')->orderBy('id')->chunk(50, function ($rows) use (&$imported) {
            foreach ($rows as $row) {
                DB::table('articles')->insert([
                    'id'             => $row->id,
                    'user_id'        => $row->user_id,
                    'title'          => $row->title,
                    'slug'           => $row->slug,
                    'content'        => $row->content,
                    'excerpt'        => $row->excerpt,
                    'featured_image' => $row->featured_image,
                    'status'         => $row->status,
                    'published_at'   => $row->published_at,
                    'views'          => $row->views ?? 0,
                    'approved_by'    => $row->approved_by ?? null,
                    'thumbnail'      => $row->thumbnail ?? null,
                    'deleted_at'     => $row->deleted_at ?? null,
                    'created_at'     => $row->created_at,
                    'updated_at'     => $row->updated_at,
                ]);
                $imported++;
            }
        });

        $this->command->info("Articles: {$imported}/{$total} imported.");
    }

    // ── Article Meta ──────────────────────────────────────────────────────────

    private function importArticleMeta($src): void
    {
        DB::table('article_meta')->truncate();

        $rows = $src->table('article_meta')->get();
        $batch = [];

        foreach ($rows as $row) {
            $batch[] = [
                'id'               => $row->id,
                'article_id'       => $row->article_id,
                'meta_title'       => $row->meta_title ? Str::limit($row->meta_title, 250, '') : null,
                'meta_description' => $row->meta_description ? Str::limit($row->meta_description, 155, '') : null,
                'meta_keywords'    => $row->meta_keywords ? Str::limit($row->meta_keywords, 250, '') : null,
                'og_image'         => $row->og_image,
                'canonical_url'    => $row->canonical_url ? Str::limit($row->canonical_url, 250, '') : null,
                'read_time'        => $row->read_time,
                'word_count'       => $row->word_count,
                'created_at'       => $row->created_at,
                'updated_at'       => $row->updated_at,
            ];
        }

        if ($batch) {
            foreach (array_chunk($batch, 200) as $chunk) {
                DB::table('article_meta')->insert($chunk);
            }
        }

        $this->command->info("Article meta: {$rows->count()} imported.");
    }

    // ── Article Categories ────────────────────────────────────────────────────

    private function importArticleCategories($src): void
    {
        DB::table('article_category')->truncate();

        $total = $src->table('article_category')->count();
        $imported = 0;

        $src->table('article_category')->orderBy('article_id')->chunk(500, function ($rows) use (&$imported) {
            $batch = [];
            foreach ($rows as $row) {
                $batch[] = [
                    'article_id'  => $row->article_id,
                    'category_id' => $row->category_id,
                ];
            }
            DB::table('article_category')->insert($batch);
            $imported += count($batch);
        });

        $this->command->info("Article categories: {$imported}/{$total} imported.");
    }

    // ── Pages ─────────────────────────────────────────────────────────────────

    private function importPages($src): void
    {
        if (! Schema::hasTable('pages')) {
            $this->command->warn('pages table does not exist — skipping.');
            return;
        }

        DB::table('pages')->truncate();

        $rows = $src->table('pages')->get();
        foreach ($rows as $row) {
            DB::table('pages')->insert([
                'id'             => $row->id,
                'user_id'        => $row->user_id,
                'title'          => $row->title,
                'slug'           => $row->slug,
                'content'        => $row->content,
                'excerpt'        => $row->excerpt ?? null,
                'featured_image' => $row->featured_image ?? null,
                'category_id'    => $row->category_id ?? null,
                'status'         => $row->status,
                'template'       => $row->template ?? 'default',
                'show_in_menu'   => $row->show_in_menu ?? 0,
                'is_featured'    => $row->is_featured ?? 0,
                'noindex'        => $row->noindex ?? 0,
                'order'          => $row->order ?? 0,
                'views'          => $row->views ?? 0,
                'published_at'   => $row->published_at ?? null,
                'seo_meta'       => json_encode([
                    'meta_title'       => $row->meta_title ?? null,
                    'meta_description' => $row->meta_description ?? null,
                    'meta_keywords'    => $row->meta_keywords ?? null,
                    'og_image'         => $row->og_image ?? null,
                    'canonical_url'    => $row->canonical_url ?? null,
                ]),
                'deleted_at'     => $row->deleted_at ?? null,
                'created_at'     => $row->created_at,
                'updated_at'     => $row->updated_at,
            ]);
        }

        $this->command->info("Pages: {$rows->count()} imported.");
    }

    // ── Comments ──────────────────────────────────────────────────────────────

    private function importComments($src): void
    {
        DB::table('comments')->truncate();

        $rows = $src->table('comments')->get();
        foreach ($rows as $row) {
            DB::table('comments')->insert([
                'id'          => $row->id,
                'article_id'  => $row->article_id,
                'user_id'     => $row->user_id ?? null,
                'parent_id'   => $row->parent_id ?? null,
                'body'        => $row->body,
                'status'      => $row->status ?? 'pending',
                'guest_name'  => $row->guest_name ?? null,
                'guest_email' => $row->guest_email ?? null,
                'ip_address'  => $row->ip_address ?? null,
                'deleted_at'  => $row->deleted_at ?? null,
                'created_at'  => $row->created_at,
                'updated_at'  => $row->updated_at,
            ]);
        }

        $this->command->info("Comments: {$rows->count()} imported.");
    }

    // ── Ad Slots ──────────────────────────────────────────────────────────────

    private function importAdSlots($src): void
    {
        DB::table('ad_performance')->truncate();
        DB::table('advertisements')->truncate();
        DB::table('ad_slots')->truncate();

        $rows = $src->table('ad_slots')->get();
        foreach ($rows as $row) {
            $allowedSizes = $row->allowed_sizes;
            if (is_string($allowedSizes) && ! str_starts_with(trim($allowedSizes), '[')) {
                $allowedSizes = json_encode(array_map('trim', explode(',', $allowedSizes)));
            }

            DB::table('ad_slots')->insert([
                'id'            => $row->id,
                'name'          => $row->name,
                'slug'          => $row->slug,
                'page'          => $row->page ?? null,
                'position'      => $row->position ?? $row->location ?? 'sidebar',
                'allowed_sizes' => $allowedSizes,
                'description'   => $row->description ?? null,
                'is_active'     => $row->is_active ?? 1,
                'created_at'    => $row->created_at,
                'updated_at'    => $row->updated_at,
            ]);
        }

        $this->command->info("Ad slots: {$rows->count()} imported.");
    }

    // ── Advertisers ───────────────────────────────────────────────────────────

    private function importAdvertisers($src): void
    {
        DB::table('advertisers')->truncate();

        $rows = $src->table('advertisers')->get();
        foreach ($rows as $row) {
            DB::table('advertisers')->insert([
                'id'           => $row->id,
                'name'         => $row->name,
                'email'        => $row->email,
                'phone'        => $row->phone,
                'company_name' => $row->company_name ?? null,
                'notes'        => $row->notes ?? null,
                'is_active'    => $row->is_active ?? 1,
                'deleted_at'   => $row->deleted_at ?? null,
                'created_at'   => $row->created_at,
                'updated_at'   => $row->updated_at,
            ]);
        }

        $this->command->info("Advertisers: {$rows->count()} imported.");
    }

    // ── Advertisements ────────────────────────────────────────────────────────

    private function importAdvertisements($src): void
    {
        DB::table('ad_performance')->truncate();
        DB::table('advertisements')->truncate();

        $rows = $src->table('advertisements')->get();
        foreach ($rows as $row) {
            $pages       = $this->ensureJson($row->pages ?? null);
            $categoryIds = $this->ensureJson($row->category_ids ?? null);
            $targeting   = $this->ensureJson($row->targeting ?? null);

            DB::table('advertisements')->insert([
                'id'                    => $row->id,
                'advertiser_id'         => $row->advertiser_id,
                'ad_slot_id'            => $row->ad_slot_id ?? null,
                'title'                 => $row->title,
                'slug'                  => $row->slug ?? Str::slug($row->title),
                'description'           => $row->description ?? null,
                'ad_type'               => $row->ad_type ?? 'image',
                'image_url'             => $row->image_url ?? null,
                'image_path'            => $row->image_path ?? null,
                'video_url'             => $row->video_url ?? null,
                'html_code'             => $row->html_code ?? null,
                'script_code'           => $row->script_code ?? null,
                'size'                  => $row->size ?? null,
                'custom_width'          => $row->custom_width ?? null,
                'custom_height'         => $row->custom_height ?? null,
                'redirect_url'          => $row->redirect_url ?? null,
                'target_url'            => $row->target_url ?? $row->redirect_url ?? null,
                'open_in_new_tab'       => $row->open_in_new_tab ?? 0,
                'width'                 => $row->width ?? null,
                'height'                => $row->height ?? null,
                'position'              => $row->position ?? 'sidebar',
                'pages'                 => $pages,
                'category_ids'          => $categoryIds,
                'rotation_type'         => $row->rotation_type ?? 'random',
                'status'                => in_array($row->status ?? '', ['active', 'inactive']) ? $row->status : 'inactive',
                'start_date'            => $row->start_date ?? null,
                'end_date'              => $row->end_date ?? null,
                'priority'              => $row->priority ?? 1,
                'is_responsive'         => $row->is_responsive ?? 1,
                'targeting'             => $targeting,
                'total_impressions'     => $row->total_impressions ?? 0,
                'total_clicks'          => $row->total_clicks ?? 0,
                'deleted_at'            => $row->deleted_at ?? null,
                'created_at'            => $row->created_at,
                'updated_at'            => $row->updated_at,
            ]);
        }

        $this->command->info("Advertisements: {$rows->count()} imported.");
    }

    // ── Ad Performance ────────────────────────────────────────────────────────

    private function importAdPerformance($src): void
    {
        DB::table('ad_performance')->truncate();

        $total = $src->table('ad_performance')->count();
        $imported = 0;

        $src->table('ad_performance')->orderBy('id')->chunk(200, function ($rows) use (&$imported) {
            $batch = [];
            foreach ($rows as $row) {
                $batch[] = [
                    'id'               => $row->id,
                    'advertisement_id' => $row->advertisement_id,
                    'date'             => $row->date,
                    'impressions'      => $row->impressions ?? 0,
                    'clicks'           => $row->clicks ?? 0,
                    'ctr'              => $row->ctr ?? 0,
                    'created_at'       => $row->created_at ?? now(),
                    'updated_at'       => $row->updated_at ?? now(),
                ];
            }
            DB::table('ad_performance')->insertOrIgnore($batch);
            $imported += count($batch);
        });

        $this->command->info("Ad performance: {$imported}/{$total} imported.");
    }

    // ── Roles & Permissions ───────────────────────────────────────────────────

    private function importRolesAndPermissions($src): void
    {
        DB::table('model_has_permissions')->truncate();
        DB::table('model_has_roles')->truncate();
        DB::table('role_has_permissions')->truncate();
        DB::table('permissions')->truncate();
        DB::table('roles')->truncate();

        // Roles
        $roles = $src->table('roles')->get();
        foreach ($roles as $row) {
            DB::table('roles')->insert([
                'id'           => $row->id,
                'name'         => $row->name,
                'display_name' => $row->display_name ?? $row->name,
                'description'  => $row->description ?? null,
                'color'        => $row->color ?? null,
                'created_at'   => $row->created_at,
                'updated_at'   => $row->updated_at,
            ]);
        }

        // Permissions
        $permissions = $src->table('permissions')->get();
        foreach ($permissions as $row) {
            DB::table('permissions')->insert([
                'id'           => $row->id,
                'name'         => $row->name,
                'display_name' => $row->display_name ?? $row->name,
                'group'        => $row->group ?? null,
                'created_at'   => $row->created_at,
                'updated_at'   => $row->updated_at,
            ]);
        }

        // Role has permissions
        $rhp = $src->table('role_has_permissions')->get();
        foreach ($rhp as $row) {
            DB::table('role_has_permissions')->insert([
                'role_id'       => $row->role_id,
                'permission_id' => $row->permission_id,
            ]);
        }

        // Model has roles
        $mhr = $src->table('model_has_roles')->get();
        foreach ($mhr as $row) {
            DB::table('model_has_roles')->insert([
                'role_id'    => $row->role_id,
                'model_type' => $row->model_type,
                'model_id'   => $row->model_id,
            ]);
        }

        // Model has permissions
        $mhp = $src->table('model_has_permissions')->get();
        foreach ($mhp as $row) {
            DB::table('model_has_permissions')->insert([
                'permission_id' => $row->permission_id,
                'model_type'    => $row->model_type,
                'model_id'      => $row->model_id,
            ]);
        }

        $this->command->info("Roles: {$roles->count()}, Permissions: {$permissions->count()} imported.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function ensureJson($value): ?string
    {
        if ($value === null) {
            return null;
        }
        // Already valid JSON
        if (is_string($value) && str_starts_with(trim($value), '[') || str_starts_with(trim($value ?? ''), '{')) {
            return $value;
        }
        return json_encode($value);
    }
}
