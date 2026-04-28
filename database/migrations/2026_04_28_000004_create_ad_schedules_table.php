<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('advertisement_id')
                  ->unique()
                  ->constrained('advertisements')
                  ->cascadeOnDelete();

            // JSON array of weekday numbers: [0=Sun, 1=Mon, ..., 6=Sat]
            // null = every day
            $table->json('days_of_week')->nullable();

            // Time-window within the day (nullable = all day)
            $table->time('time_from')->nullable();
            $table->time('time_to')->nullable();

            $table->string('timezone', 50)->default('UTC');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_schedules');
    }
};
