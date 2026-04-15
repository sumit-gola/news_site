<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('advertisements')) {
            Schema::table('advertisements', function (Blueprint $table): void {
                if (!Schema::hasColumn('advertisements', 'slug')) {
                    $table->string('slug')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'description')) {
                    $table->text('description')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'image_url')) {
                    $table->string('image_url')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'video_url')) {
                    $table->string('video_url')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'size')) {
                    $table->string('size')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'custom_width')) {
                    $table->unsignedInteger('custom_width')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'custom_height')) {
                    $table->unsignedInteger('custom_height')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'redirect_url')) {
                    $table->string('redirect_url')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'daily_limit')) {
                    $table->unsignedInteger('daily_limit')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'is_responsive')) {
                    $table->boolean('is_responsive')->default(true);
                }
                if (!Schema::hasColumn('advertisements', 'targeting')) {
                    $table->json('targeting')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'is_pinned')) {
                    $table->boolean('is_pinned')->default(false);
                }
                if (!Schema::hasColumn('advertisements', 'is_house_ad')) {
                    $table->boolean('is_house_ad')->default(false);
                }
                if (!Schema::hasColumn('advertisements', 'is_fallback')) {
                    $table->boolean('is_fallback')->default(false);
                }
                if (!Schema::hasColumn('advertisements', 'fallback_ad_id')) {
                    $table->unsignedBigInteger('fallback_ad_id')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'workflow_status')) {
                    $table->string('workflow_status', 40)->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'reviewer_notes')) {
                    $table->text('reviewer_notes')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'internal_comments')) {
                    $table->text('internal_comments')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'recurrence_type')) {
                    $table->string('recurrence_type', 30)->default('always');
                }
                if (!Schema::hasColumn('advertisements', 'recurrence_days')) {
                    $table->json('recurrence_days')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'frequency_cap_type')) {
                    $table->string('frequency_cap_type', 20)->default('none');
                }
                if (!Schema::hasColumn('advertisements', 'frequency_cap_value')) {
                    $table->unsignedInteger('frequency_cap_value')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'device_targets')) {
                    $table->json('device_targets')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'geo_countries')) {
                    $table->json('geo_countries')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'language_locales')) {
                    $table->json('language_locales')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'audience_tags')) {
                    $table->json('audience_tags')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'utm_params')) {
                    $table->json('utm_params')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'has_video')) {
                    $table->boolean('has_video')->default(false);
                }
                if (!Schema::hasColumn('advertisements', 'video_embed_url')) {
                    $table->string('video_embed_url')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'supported_sizes')) {
                    $table->json('supported_sizes')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'variant_enabled')) {
                    $table->boolean('variant_enabled')->default(false);
                }
                if (!Schema::hasColumn('advertisements', 'variant_a')) {
                    $table->json('variant_a')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'variant_b')) {
                    $table->json('variant_b')->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'variant_split')) {
                    $table->unsignedTinyInteger('variant_split')->default(50);
                }
                if (!Schema::hasColumn('advertisements', 'winner_metric')) {
                    $table->string('winner_metric', 40)->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'daily_budget')) {
                    $table->decimal('daily_budget', 10, 2)->nullable();
                }
                if (!Schema::hasColumn('advertisements', 'spent_amount')) {
                    $table->decimal('spent_amount', 10, 2)->default(0);
                }
                if (!Schema::hasColumn('advertisements', 'last_served_at')) {
                    $table->dateTime('last_served_at')->nullable();
                }
            });
        }

        if (Schema::hasTable('ad_performance')) {
            Schema::table('ad_performance', function (Blueprint $table): void {
                if (!Schema::hasColumn('ad_performance', 'page')) {
                    $table->string('page', 30)->nullable();
                }
                if (!Schema::hasColumn('ad_performance', 'position')) {
                    $table->string('position', 30)->nullable();
                }
                if (!Schema::hasColumn('ad_performance', 'device')) {
                    $table->string('device', 20)->nullable();
                }
                if (!Schema::hasColumn('ad_performance', 'slot_id')) {
                    $table->unsignedBigInteger('slot_id')->nullable();
                }
                if (!Schema::hasColumn('ad_performance', 'advertiser_id')) {
                    $table->unsignedBigInteger('advertiser_id')->nullable();
                }
            });
        }

        if (!Schema::hasTable('ad_audit_events')) {
            Schema::create('ad_audit_events', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('advertisement_id')->nullable();
                $table->unsignedBigInteger('actor_id')->nullable();
                $table->string('event_type', 60);
                $table->json('meta')->nullable();
                $table->timestamps();

                $table->index('advertisement_id');
                $table->index('event_type');
                $table->index('created_at');
            });
        }

        if (!Schema::hasTable('ad_event_logs')) {
            Schema::create('ad_event_logs', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('advertisement_id');
                $table->string('event_type', 20);
                $table->string('page', 30)->nullable();
                $table->string('position', 30)->nullable();
                $table->string('device', 20)->nullable();
                $table->string('country', 8)->nullable();
                $table->string('locale', 12)->nullable();
                $table->unsignedBigInteger('slot_id')->nullable();
                $table->unsignedBigInteger('advertiser_id')->nullable();
                $table->timestamps();

                $table->index(['advertisement_id', 'event_type']);
                $table->index(['event_type', 'created_at']);
                $table->index('device');
                $table->index('page');
                $table->index('position');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('advertisements')) {
            Schema::table('advertisements', function (Blueprint $table): void {
                foreach ([
                    'slug',
                    'description',
                    'image_url',
                    'video_url',
                    'size',
                    'custom_width',
                    'custom_height',
                    'redirect_url',
                    'daily_limit',
                    'is_responsive',
                    'targeting',
                    'is_pinned',
                    'is_house_ad',
                    'is_fallback',
                    'fallback_ad_id',
                    'workflow_status',
                    'reviewer_notes',
                    'internal_comments',
                    'recurrence_type',
                    'recurrence_days',
                    'frequency_cap_type',
                    'frequency_cap_value',
                    'device_targets',
                    'geo_countries',
                    'language_locales',
                    'audience_tags',
                    'utm_params',
                    'has_video',
                    'video_embed_url',
                    'supported_sizes',
                    'variant_enabled',
                    'variant_a',
                    'variant_b',
                    'variant_split',
                    'winner_metric',
                    'daily_budget',
                    'spent_amount',
                    'last_served_at',
                ] as $column) {
                    if (Schema::hasColumn('advertisements', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('ad_performance')) {
            Schema::table('ad_performance', function (Blueprint $table): void {
                foreach (['page', 'position', 'device', 'slot_id', 'advertiser_id'] as $column) {
                    if (Schema::hasColumn('ad_performance', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        Schema::dropIfExists('ad_audit_events');
        Schema::dropIfExists('ad_event_logs');
    }
};
