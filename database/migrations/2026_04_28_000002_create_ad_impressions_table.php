<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_impressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('advertisement_id')
                  ->constrained('advertisements')
                  ->cascadeOnDelete();

            // Hashed identifiers — no raw PII stored
            $table->string('session_hash', 64)->index();
            $table->string('ip_hash', 64)->nullable();

            $table->enum('device_type', ['desktop', 'tablet', 'mobile']);
            $table->string('page_url', 2048)->nullable();

            // variant label if A/B test was active ('A', 'B', or null)
            $table->string('variant_label', 5)->nullable();

            $table->timestamp('created_at')->useCurrent()->index();

            // Composite index for per-ad time-series queries
            $table->index(['advertisement_id', 'created_at'], 'imp_ad_time_index');

            // Dedup guard: one impression per session per ad per hour (enforced in service)
            $table->index(['advertisement_id', 'session_hash'], 'imp_dedup_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_impressions');
    }
};
