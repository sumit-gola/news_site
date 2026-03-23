<?php

namespace Database\Seeders;

use App\Models\Advertiser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdvertiserSeeder extends Seeder
{
    public function run(): void
    {
        $advertisers = [
            [
                'name' => 'TechNova Media',
                'slug' => 'technova-media',
                'email' => 'ads@technova.example',
                'phone' => '+91-98765-00111',
                'company_name' => 'TechNova Media Pvt Ltd',
                'description' => 'Focus on software and cloud campaigns.',
                'notes' => 'Focus on software and cloud campaigns.',
                'status' => 'active',
                'contact_person' => 'TechNova Media',
                'is_active' => true,
            ],
            [
                'name' => 'HealthFirst Labs',
                'slug' => 'healthfirst-labs',
                'email' => 'campaigns@healthfirst.example',
                'phone' => '+91-98765-00222',
                'company_name' => 'HealthFirst Labs',
                'description' => 'Sponsored wellness and healthcare content.',
                'notes' => 'Sponsored wellness and healthcare content.',
                'status' => 'active',
                'contact_person' => 'HealthFirst Labs',
                'is_active' => true,
            ],
            [
                'name' => 'FinEdge Capital',
                'slug' => 'finedge-capital',
                'email' => 'media@finedge.example',
                'phone' => '+91-98765-00333',
                'company_name' => 'FinEdge Capital Services',
                'description' => 'Finance and investment ad partner.',
                'notes' => 'Finance and investment ad partner.',
                'status' => 'active',
                'contact_person' => 'FinEdge Capital',
                'is_active' => true,
            ],
            [
                'name' => 'TravelNest',
                'slug' => 'travelnest',
                'email' => 'promo@travelnest.example',
                'phone' => '+91-98765-00444',
                'company_name' => 'TravelNest Holidays',
                'description' => 'Seasonal campaigns for travel destinations.',
                'notes' => 'Seasonal campaigns for travel destinations.',
                'status' => 'active',
                'contact_person' => 'TravelNest',
                'is_active' => true,
            ],
        ];

        foreach ($advertisers as $advertiser) {
            Advertiser::query()->updateOrCreate(
                ['email' => $advertiser['email']],
                $advertiser + ['slug' => Str::slug($advertiser['name'])],
            );
        }

        $this->command?->info('AdvertiserSeeder completed.');
    }
}
