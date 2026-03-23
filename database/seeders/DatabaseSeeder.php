<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            ArticleSeeder::class,
            AdSlotSeeder::class,
            AdvertiserSeeder::class,
            AdvertisementSeeder::class,
        ]);
    }
}
