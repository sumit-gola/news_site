<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('advertisers')) {
            Schema::table('advertisers', function (Blueprint $table) {
                if (!Schema::hasColumn('advertisers', 'company_name')) {
                    $table->string('company_name')->nullable();
                }

                if (!Schema::hasColumn('advertisers', 'notes')) {
                    $table->text('notes')->nullable();
                }

                if (!Schema::hasColumn('advertisers', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
            });

            if (Schema::hasColumn('advertisers', 'status') && Schema::hasColumn('advertisers', 'is_active')) {
                DB::table('advertisers')
                    ->whereNull('is_active')
                    ->orWhere('is_active', 0)
                    ->update([
                        'is_active' => DB::raw("CASE WHEN status = 'active' THEN 1 ELSE 0 END"),
                    ]);
            }
        }

        if (Schema::hasTable('ad_slots')) {
            Schema::table('ad_slots', function (Blueprint $table) {
                if (!Schema::hasColumn('ad_slots', 'page')) {
                    $table->string('page')->nullable();
                }

                if (!Schema::hasColumn('ad_slots', 'position')) {
                    $table->string('position')->default('sidebar');
                }

                if (!Schema::hasColumn('ad_slots', 'allowed_sizes')) {
                    $table->json('allowed_sizes')->nullable();
                }

                if (!Schema::hasColumn('ad_slots', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
            });

            if (Schema::hasColumn('ad_slots', 'location') && Schema::hasColumn('ad_slots', 'position')) {
                DB::statement("UPDATE ad_slots SET position = CASE WHEN location IS NOT NULL AND location != '' THEN location ELSE position END");
            }

            if (Schema::hasColumn('ad_slots', 'status') && Schema::hasColumn('ad_slots', 'is_active')) {
                DB::statement("UPDATE ad_slots SET is_active = CASE WHEN status = 'active' THEN 1 ELSE 0 END");
            }
        }

        if (Schema::hasTable('advertisements')) {
            Schema::table('advertisements', function (Blueprint $table) {
                if (!Schema::hasColumn('advertisements', 'ad_slot_id')) {
                    $table->unsignedBigInteger('ad_slot_id')->nullable();
                }

                if (!Schema::hasColumn('advertisements', 'image_path')) {
                    $table->string('image_path')->nullable();
                }

                if (!Schema::hasColumn('advertisements', 'html_code')) {
                    $table->longText('html_code')->nullable();
                }

                if (!Schema::hasColumn('advertisements', 'script_code')) {
                    $table->longText('script_code')->nullable();
                }

                if (!Schema::hasColumn('advertisements', 'target_url')) {
                    $table->string('target_url')->nullable();
                }

                if (!Schema::hasColumn('advertisements', 'open_in_new_tab')) {
                    $table->boolean('open_in_new_tab')->default(false);
                }

                if (!Schema::hasColumn('advertisements', 'width')) {
                    $table->unsignedInteger('width')->nullable();
                }

                if (!Schema::hasColumn('advertisements', 'height')) {
                    $table->unsignedInteger('height')->nullable();
                }

                if (!Schema::hasColumn('advertisements', 'position')) {
                    $table->string('position')->default('sidebar');
                }

                if (!Schema::hasColumn('advertisements', 'pages')) {
                    $table->json('pages')->nullable();
                }

                if (!Schema::hasColumn('advertisements', 'category_ids')) {
                    $table->json('category_ids')->nullable();
                }

                if (!Schema::hasColumn('advertisements', 'rotation_type')) {
                    $table->string('rotation_type')->default('random');
                }
            });

            if (Schema::hasColumn('advertisements', 'image_url') && Schema::hasColumn('advertisements', 'image_path')) {
                DB::statement("UPDATE advertisements SET image_path = COALESCE(image_path, image_url)");
            }

            if (Schema::hasColumn('advertisements', 'redirect_url') && Schema::hasColumn('advertisements', 'target_url')) {
                DB::statement("UPDATE advertisements SET target_url = COALESCE(target_url, redirect_url)");
            }

            if (Schema::hasColumn('advertisements', 'custom_width') && Schema::hasColumn('advertisements', 'width')) {
                DB::statement("UPDATE advertisements SET width = COALESCE(width, CAST(custom_width AS INTEGER)) WHERE custom_width IS NOT NULL AND custom_width != ''");
            }

            if (Schema::hasColumn('advertisements', 'custom_height') && Schema::hasColumn('advertisements', 'height')) {
                DB::statement("UPDATE advertisements SET height = COALESCE(height, CAST(custom_height AS INTEGER)) WHERE custom_height IS NOT NULL AND custom_height != ''");
            }
        }

        if (Schema::hasTable('ad_performance')) {
            Schema::table('ad_performance', function (Blueprint $table) {
                if (!Schema::hasColumn('ad_performance', 'ctr')) {
                    $table->decimal('ctr', 8, 4)->default(0);
                }
            });

            if (Schema::hasColumn('ad_performance', 'click_through_rate') && Schema::hasColumn('ad_performance', 'ctr')) {
                DB::statement("UPDATE ad_performance SET ctr = COALESCE(ctr, click_through_rate, 0)");
            }
        }
    }

    public function down(): void
    {
        // Intentionally left empty because this migration normalizes legacy local schemas.
    }
};
