<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('advertisement_id')
                  ->constrained('advertisements')
                  ->cascadeOnDelete();

            $table->string('label', 5);           // 'A' or 'B'
            $table->string('media_url')->nullable();
            $table->longText('embed_code')->nullable();
            $table->string('cta_label', 80)->nullable();

            // Traffic split weight (0-100); sum of A+B should equal 100
            $table->unsignedTinyInteger('weight')->default(50);

            // Atomic counters — kept in sync with ad_impressions/ad_clicks rows
            $table->unsignedBigInteger('impressions_count')->default(0);
            $table->unsignedBigInteger('clicks_count')->default(0);

            $table->timestamps();

            $table->unique(['advertisement_id', 'label']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_variants');
    }
};
