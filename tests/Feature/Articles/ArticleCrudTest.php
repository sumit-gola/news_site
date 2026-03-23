<?php

namespace Tests\Feature\Articles;

use App\Models\Article;
use App\Models\ArticleMeta;
use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleCrudTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $reporter;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $this->admin    = User::where('email', 'admin@newsportal.com')->first();
        $this->reporter = User::where('email', 'reporter@newsportal.com')->first();
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function test_reporter_can_create_article(): void
    {
        $category = Category::factory()->create(['is_active' => true]);

        $response = $this->actingAs($this->reporter)->post('/articles', [
            'title'       => 'Test Article Title',
            'excerpt'     => 'A short excerpt for the article.',
            'content'     => '<p>The full article content goes here.</p>',
            'category_ids'=> [$category->id],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('articles', ['title' => 'Test Article Title', 'status' => 'draft']);
    }

    public function test_guest_cannot_create_article(): void
    {
        $this->post('/articles', ['title' => 'Test'])->assertRedirect('/login');
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function test_reporter_can_edit_own_draft(): void
    {
        $article = Article::factory()->draft()->create(['user_id' => $this->reporter->id]);

        $response = $this->actingAs($this->reporter)->put("/articles/{$article->id}", [
            'title'   => 'Updated Title',
            'excerpt' => 'Updated excerpt.',
            'content' => '<p>Updated content.</p>',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('articles', ['id' => $article->id, 'title' => 'Updated Title']);
    }

    public function test_reporter_cannot_edit_other_reporters_article(): void
    {
        $otherArticle = Article::factory()->draft()->create();

        $this->actingAs($this->reporter)
            ->put("/articles/{$otherArticle->id}", ['title' => 'Hacked'])
            ->assertForbidden();
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    public function test_admin_can_delete_any_article(): void
    {
        $article = Article::factory()->create();

        $this->actingAs($this->admin)
            ->delete("/articles/{$article->id}")
            ->assertRedirect();

        $this->assertSoftDeleted('articles', ['id' => $article->id]);
    }

    public function test_reporter_cannot_delete_published_article(): void
    {
        $article = Article::factory()->create([
            'user_id' => $this->reporter->id,
            'status'  => 'published',
        ]);

        $this->actingAs($this->reporter)
            ->delete("/articles/{$article->id}")
            ->assertForbidden();
    }

    // ─── Workflow ─────────────────────────────────────────────────────────────

    public function test_reporter_can_submit_draft_for_approval(): void
    {
        $category = Category::factory()->create(['is_active' => true]);
        $article  = Article::factory()->draft()->create(['user_id' => $this->reporter->id]);
        $article->categories()->attach($category->id);

        $this->actingAs($this->reporter)
            ->post("/articles/{$article->id}/submit")
            ->assertRedirect();

        $this->assertDatabaseHas('articles', ['id' => $article->id, 'status' => 'pending']);
    }

    public function test_admin_can_publish_article(): void
    {
        $article = Article::factory()->pending()->create();

        $this->actingAs($this->admin)
            ->post("/admin/articles/{$article->id}/publish")
            ->assertRedirect();

        $this->assertDatabaseHas('articles', ['id' => $article->id, 'status' => 'published']);
    }

    public function test_reporter_cannot_publish_article(): void
    {
        $article = Article::factory()->pending()->create(['user_id' => $this->reporter->id]);

        $this->actingAs($this->reporter)
            ->post("/admin/articles/{$article->id}/publish")
            ->assertForbidden();
    }
}
