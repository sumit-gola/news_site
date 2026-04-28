<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advertisements', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->text('description')->nullable();

            // Media
            $table->string('media_url')->nullable();
            $table->enum('media_type', ['image', 'video'])->default('image');

            // CTA
            $table->string('redirect_url');

            // Targeting
            $table->enum('placement_type', ['header', 'sidebar', 'inline', 'footer', 'popup']);
            $table->enum('device_target', ['all', 'desktop', 'tablet', 'mobile'])->default('all');

            // Scheduling
            $table->datetime('start_datetime')->nullable();
            $table->datetime('end_datetime')->nullable();

            // Control
            $table->enum('status', ['active', 'inactive', 'draft'])->default('draft');
            $table->unsignedInteger('priority')->default(0);
            $table->boolean('is_dismissible')->default(true);

            // Creator
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            // Tracking counters (atomic increments, no joins needed for basic stats)
            $table->unsignedBigInteger('impressions_count')->default(0);
            $table->unsignedBigInteger('clicks_count')->default(0);

            $table->timestamps();
            $table->softDeletes();

            // Indexes for the active-ads query: status + placement + device + date range
            $table->index(['status', 'placement_type', 'device_target'], 'ads_targeting_index');
            $table->index(['start_datetime', 'end_datetime'], 'ads_schedule_index');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advertisements');
    }
};
