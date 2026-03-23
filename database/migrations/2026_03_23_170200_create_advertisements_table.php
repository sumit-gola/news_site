<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('advertisements')) {
            return;
        }

        Schema::create('advertisements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('advertiser_id')->nullable()->constrained('advertisers')->nullOnDelete();
            $table->foreignId('ad_slot_id')->nullable()->constrained('ad_slots')->nullOnDelete();

            $table->string('title');
            $table->enum('ad_type', ['image', 'html', 'script'])->default('image');
            $table->string('image_path')->nullable();
            $table->longText('html_code')->nullable();
            $table->longText('script_code')->nullable();

            $table->string('target_url')->nullable();
            $table->boolean('open_in_new_tab')->default(false);

            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->enum('position', ['header', 'sidebar', 'inline', 'footer', 'popup'])->default('sidebar');

            $table->json('pages')->nullable();
            $table->json('category_ids')->nullable();

            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();

            $table->unsignedInteger('priority')->default(1);
            $table->enum('rotation_type', ['sequential', 'random'])->default('random');
            $table->enum('status', ['active', 'inactive'])->default('active');

            $table->unsignedBigInteger('total_impressions')->default(0);
            $table->unsignedBigInteger('total_clicks')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['position', 'status']);
            $table->index(['start_date', 'end_date']);
            $table->index(['priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advertisements');
    }
};
