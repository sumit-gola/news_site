<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add missing columns to the pre-existing pages table.
 * The table was created earlier with a different schema; this migration
 * brings it in line with the full CMS page builder requirements.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            if (! Schema::hasColumn('pages', 'category_id')) {
                $table->foreignId('category_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            }
            if (! Schema::hasColumn('pages', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('status');
            }
            if (! Schema::hasColumn('pages', 'is_featured')) {
                $table->boolean('is_featured')->default(false)->after('show_in_menu');
            }
            if (! Schema::hasColumn('pages', 'noindex')) {
                $table->boolean('noindex')->default(false)->after('is_featured');
            }
            if (! Schema::hasColumn('pages', 'views')) {
                $table->unsignedBigInteger('views')->default(0)->after('noindex');
            }
            if (! Schema::hasColumn('pages', 'canonical_url')) {
                $table->string('canonical_url')->nullable()->after('og_image');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropForeignIfExists(['category_id']);
            foreach (['category_id', 'published_at', 'is_featured', 'noindex', 'views', 'canonical_url'] as $col) {
                if (Schema::hasColumn('pages', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
