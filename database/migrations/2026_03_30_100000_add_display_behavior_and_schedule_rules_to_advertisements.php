<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('advertisements', function (Blueprint $table) {
            if (! Schema::hasColumn('advertisements', 'display_behavior')) {
                $table->string('display_behavior', 30)->default('standard')->after('position');
            }
            if (! Schema::hasColumn('advertisements', 'display_config')) {
                $table->json('display_config')->nullable()->after('display_behavior');
            }
            if (! Schema::hasColumn('advertisements', 'is_closable')) {
                $table->boolean('is_closable')->default(false)->after('display_config');
            }
            if (! Schema::hasColumn('advertisements', 'close_button_delay_seconds')) {
                $table->unsignedSmallInteger('close_button_delay_seconds')->default(0)->after('is_closable');
            }
            if (! Schema::hasColumn('advertisements', 'schedule_rules')) {
                $table->json('schedule_rules')->nullable()->after('recurrence_days');
            }
            if (! Schema::hasColumn('advertisements', 'max_total_impressions')) {
                $table->unsignedInteger('max_total_impressions')->nullable()->after('schedule_rules');
            }
            if (! Schema::hasColumn('advertisements', 'max_daily_impressions')) {
                $table->unsignedInteger('max_daily_impressions')->nullable()->after('max_total_impressions');
            }
            if (! Schema::hasColumn('advertisements', 'url_patterns')) {
                $table->json('url_patterns')->nullable()->after('audience_tags');
            }
            if (! Schema::hasColumn('advertisements', 'exclude_rules')) {
                $table->json('exclude_rules')->nullable()->after('url_patterns');
            }
        });
    }

    public function down(): void
    {
        Schema::table('advertisements', function (Blueprint $table) {
            $columns = [
                'display_behavior',
                'display_config',
                'is_closable',
                'close_button_delay_seconds',
                'schedule_rules',
                'max_total_impressions',
                'max_daily_impressions',
                'url_patterns',
                'exclude_rules',
            ];

            foreach ($columns as $col) {
                if (Schema::hasColumn('advertisements', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
