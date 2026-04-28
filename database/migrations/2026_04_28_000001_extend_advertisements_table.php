<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('advertisements', function (Blueprint $table) {
            // Behavioral type (replaces overloaded placement logic)
            $table->enum('ad_type', ['fixed', 'closable', 'floating', 'popup', 'inline', 'sticky'])
                  ->default('fixed')
                  ->after('title');

            // Extend media_type to support embed/script ads
            $table->dropColumn('media_type');
        });

        // Re-add media_type with extended enum (MySQL can't alter enums directly)
        Schema::table('advertisements', function (Blueprint $table) {
            $table->enum('media_type', ['image', 'video', 'html', 'script'])
                  ->default('image')
                  ->after('media_url');

            // HTML/script embed code
            $table->longText('embed_code')->nullable()->after('media_type');

            // CTA
            $table->string('cta_label', 80)->nullable()->after('redirect_url');
            $table->string('bg_color', 7)->nullable()->after('cta_label');

            // Floating ad config
            $table->enum('float_position', ['bottom-right', 'bottom-left', 'top-right', 'top-left'])
                  ->default('bottom-right')
                  ->nullable()
                  ->after('bg_color');
            $table->enum('float_animation', ['slide', 'fade', 'bounce'])
                  ->default('slide')
                  ->nullable()
                  ->after('float_position');

            // Popup config
            $table->unsignedSmallInteger('popup_delay_seconds')->default(3)->after('float_animation');
            $table->unsignedSmallInteger('popup_frequency_minutes')->nullable()->after('popup_delay_seconds');

            // Sticky config
            $table->unsignedSmallInteger('sticky_offset_px')->default(0)->after('popup_frequency_minutes');

            // A/B testing flag
            $table->boolean('ab_testing_enabled')->default(false)->after('sticky_offset_px');

            // Composite index for ad serving (type + status + placement)
            $table->index(['ad_type', 'status', 'placement_type'], 'ads_type_status_placement_index');
        });
    }

    public function down(): void
    {
        Schema::table('advertisements', function (Blueprint $table) {
            $table->dropIndex('ads_type_status_placement_index');
            $table->dropColumn([
                'ad_type', 'embed_code', 'cta_label', 'bg_color',
                'float_position', 'float_animation',
                'popup_delay_seconds', 'popup_frequency_minutes',
                'sticky_offset_px', 'ab_testing_enabled',
            ]);
            $table->dropColumn('media_type');
        });

        Schema::table('advertisements', function (Blueprint $table) {
            $table->enum('media_type', ['image', 'video'])->default('image')->after('media_url');
        });
    }
};
