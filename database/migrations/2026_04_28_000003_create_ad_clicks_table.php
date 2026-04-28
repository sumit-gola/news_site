<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('advertisement_id')
                  ->constrained('advertisements')
                  ->cascadeOnDelete();

            $table->string('session_hash', 64)->index();
            $table->string('ip_hash', 64)->nullable();

            $table->enum('device_type', ['desktop', 'tablet', 'mobile']);
            $table->string('page_url', 2048)->nullable();
            $table->string('variant_label', 5)->nullable();

            $table->timestamp('created_at')->useCurrent()->index();

            $table->index(['advertisement_id', 'created_at'], 'clk_ad_time_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_clicks');
    }
};
