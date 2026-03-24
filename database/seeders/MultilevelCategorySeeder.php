<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class MultilevelCategorySeeder extends Seeder
{
    /**
     * Seed multilevel categories with comprehensive Indian states & cities,
     * sports hierarchy, and other news categories.
     */
    public function run(): void
    {
        $categories = [
            // ── States → Cities ──────────────────────────────────
            [
                'name'        => 'States',
                'color'       => '#06b6d4',
                'icon'        => 'map',
                'description' => 'News from across Indian states and cities',
                'order'       => 1,
                'children'    => [
                    [
                        'name'     => 'Rajasthan',
                        'color'    => '#0891b2',
                        'order'    => 1,
                        'children' => [
                            ['name' => 'Jaipur',       'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Jodhpur',      'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Udaipur',      'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Kota',         'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Ajmer',        'color' => '#06b6d4', 'order' => 5],
                            ['name' => 'Bikaner',      'color' => '#06b6d4', 'order' => 6],
                            ['name' => 'Alwar',        'color' => '#06b6d4', 'order' => 7],
                            ['name' => 'Bhilwara',     'color' => '#06b6d4', 'order' => 8],
                            ['name' => 'Sikar',        'color' => '#06b6d4', 'order' => 9],
                            ['name' => 'Pali',         'color' => '#06b6d4', 'order' => 10],
                        ],
                    ],
                    [
                        'name'     => 'Maharashtra',
                        'color'    => '#0891b2',
                        'order'    => 2,
                        'children' => [
                            ['name' => 'Mumbai',       'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Pune',         'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Nagpur',       'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Nashik',       'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Aurangabad',   'color' => '#06b6d4', 'order' => 5],
                            ['name' => 'Thane',        'color' => '#06b6d4', 'order' => 6],
                            ['name' => 'Kolhapur',     'color' => '#06b6d4', 'order' => 7],
                            ['name' => 'Solapur',      'color' => '#06b6d4', 'order' => 8],
                        ],
                    ],
                    [
                        'name'     => 'Uttar Pradesh',
                        'color'    => '#0891b2',
                        'order'    => 3,
                        'children' => [
                            ['name' => 'Lucknow',      'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Varanasi',     'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Noida',        'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Agra',         'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Kanpur',       'color' => '#06b6d4', 'order' => 5],
                            ['name' => 'Prayagraj',    'color' => '#06b6d4', 'order' => 6],
                            ['name' => 'Meerut',       'color' => '#06b6d4', 'order' => 7],
                            ['name' => 'Ghaziabad',    'color' => '#06b6d4', 'order' => 8],
                        ],
                    ],
                    [
                        'name'     => 'Delhi',
                        'color'    => '#0891b2',
                        'order'    => 4,
                        'children' => [
                            ['name' => 'New Delhi',     'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'North Delhi',   'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'South Delhi',   'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'East Delhi',    'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'West Delhi',    'color' => '#06b6d4', 'order' => 5],
                            ['name' => 'Central Delhi', 'color' => '#06b6d4', 'order' => 6],
                        ],
                    ],
                    [
                        'name'     => 'Karnataka',
                        'color'    => '#0891b2',
                        'order'    => 5,
                        'children' => [
                            ['name' => 'Bengaluru',    'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Mysuru',       'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Mangaluru',    'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Hubli',        'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Belgaum',      'color' => '#06b6d4', 'order' => 5],
                            ['name' => 'Davangere',    'color' => '#06b6d4', 'order' => 6],
                        ],
                    ],
                    [
                        'name'     => 'Tamil Nadu',
                        'color'    => '#0891b2',
                        'order'    => 6,
                        'children' => [
                            ['name' => 'Chennai',      'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Coimbatore',   'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Madurai',      'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Tiruchirappalli', 'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Salem',        'color' => '#06b6d4', 'order' => 5],
                            ['name' => 'Tirunelveli',  'color' => '#06b6d4', 'order' => 6],
                        ],
                    ],
                    [
                        'name'     => 'Gujarat',
                        'color'    => '#0891b2',
                        'order'    => 7,
                        'children' => [
                            ['name' => 'Ahmedabad',    'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Surat',        'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Vadodara',     'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Rajkot',       'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Gandhinagar',  'color' => '#06b6d4', 'order' => 5],
                            ['name' => 'Bhavnagar',    'color' => '#06b6d4', 'order' => 6],
                        ],
                    ],
                    [
                        'name'     => 'Madhya Pradesh',
                        'color'    => '#0891b2',
                        'order'    => 8,
                        'children' => [
                            ['name' => 'Bhopal',       'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Indore',       'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Jabalpur',     'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Gwalior',      'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Ujjain',       'color' => '#06b6d4', 'order' => 5],
                        ],
                    ],
                    [
                        'name'     => 'West Bengal',
                        'color'    => '#0891b2',
                        'order'    => 9,
                        'children' => [
                            ['name' => 'Kolkata',      'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Howrah',       'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Durgapur',     'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Siliguri',     'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Asansol',      'color' => '#06b6d4', 'order' => 5],
                        ],
                    ],
                    [
                        'name'     => 'Telangana',
                        'color'    => '#0891b2',
                        'order'    => 10,
                        'children' => [
                            ['name' => 'Hyderabad',    'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Warangal',     'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Nizamabad',    'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Karimnagar',   'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Khammam',      'color' => '#06b6d4', 'order' => 5],
                        ],
                    ],
                    [
                        'name'     => 'Andhra Pradesh',
                        'color'    => '#0891b2',
                        'order'    => 11,
                        'children' => [
                            ['name' => 'Visakhapatnam', 'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Vijayawada',    'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Guntur',        'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Tirupati',      'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Nellore',       'color' => '#06b6d4', 'order' => 5],
                            ['name' => 'Kakinada',      'color' => '#06b6d4', 'order' => 6],
                        ],
                    ],
                    [
                        'name'     => 'Kerala',
                        'color'    => '#0891b2',
                        'order'    => 12,
                        'children' => [
                            ['name' => 'Thiruvananthapuram', 'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Kochi',         'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Kozhikode',     'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Thrissur',      'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Kannur',        'color' => '#06b6d4', 'order' => 5],
                        ],
                    ],
                    [
                        'name'     => 'Punjab',
                        'color'    => '#0891b2',
                        'order'    => 13,
                        'children' => [
                            ['name' => 'Chandigarh',   'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Ludhiana',     'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Amritsar',     'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Jalandhar',    'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Patiala',      'color' => '#06b6d4', 'order' => 5],
                            ['name' => 'Bathinda',     'color' => '#06b6d4', 'order' => 6],
                        ],
                    ],
                    [
                        'name'     => 'Haryana',
                        'color'    => '#0891b2',
                        'order'    => 14,
                        'children' => [
                            ['name' => 'Gurugram',     'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Faridabad',    'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Panipat',      'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Ambala',       'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Hisar',        'color' => '#06b6d4', 'order' => 5],
                            ['name' => 'Karnal',       'color' => '#06b6d4', 'order' => 6],
                            ['name' => 'Rohtak',       'color' => '#06b6d4', 'order' => 7],
                        ],
                    ],
                    [
                        'name'     => 'Bihar',
                        'color'    => '#0891b2',
                        'order'    => 15,
                        'children' => [
                            ['name' => 'Patna',        'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Gaya',         'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Muzaffarpur',  'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Bhagalpur',    'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Darbhanga',    'color' => '#06b6d4', 'order' => 5],
                        ],
                    ],
                    [
                        'name'     => 'Odisha',
                        'color'    => '#0891b2',
                        'order'    => 16,
                        'children' => [
                            ['name' => 'Bhubaneswar',  'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Cuttack',      'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Rourkela',     'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Puri',         'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Berhampur',    'color' => '#06b6d4', 'order' => 5],
                        ],
                    ],
                    [
                        'name'     => 'Jharkhand',
                        'color'    => '#0891b2',
                        'order'    => 17,
                        'children' => [
                            ['name' => 'Ranchi',       'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Jamshedpur',   'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Dhanbad',      'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Bokaro',       'color' => '#06b6d4', 'order' => 4],
                        ],
                    ],
                    [
                        'name'     => 'Chhattisgarh',
                        'color'    => '#0891b2',
                        'order'    => 18,
                        'children' => [
                            ['name' => 'Raipur',       'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Bhilai',       'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Bilaspur',     'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Korba',        'color' => '#06b6d4', 'order' => 4],
                        ],
                    ],
                    [
                        'name'     => 'Assam',
                        'color'    => '#0891b2',
                        'order'    => 19,
                        'children' => [
                            ['name' => 'Guwahati',     'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Silchar',      'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Dibrugarh',    'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Jorhat',       'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Tezpur',       'color' => '#06b6d4', 'order' => 5],
                        ],
                    ],
                    [
                        'name'     => 'Uttarakhand',
                        'color'    => '#0891b2',
                        'order'    => 20,
                        'children' => [
                            ['name' => 'Dehradun',     'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Haridwar',     'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Rishikesh',    'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Nainital',     'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Haldwani',     'color' => '#06b6d4', 'order' => 5],
                        ],
                    ],
                    [
                        'name'     => 'Himachal Pradesh',
                        'color'    => '#0891b2',
                        'order'    => 21,
                        'children' => [
                            ['name' => 'Shimla',       'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Manali',       'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Dharamshala',  'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Kullu',        'color' => '#06b6d4', 'order' => 4],
                            ['name' => 'Solan',        'color' => '#06b6d4', 'order' => 5],
                        ],
                    ],
                    [
                        'name'     => 'Jammu & Kashmir',
                        'color'    => '#0891b2',
                        'order'    => 22,
                        'children' => [
                            ['name' => 'Srinagar',     'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Jammu',        'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Anantnag',     'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Baramulla',    'color' => '#06b6d4', 'order' => 4],
                        ],
                    ],
                    [
                        'name'     => 'Goa',
                        'color'    => '#0891b2',
                        'order'    => 23,
                        'children' => [
                            ['name' => 'Panaji',       'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Margao',       'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Vasco da Gama', 'color' => '#06b6d4', 'order' => 3],
                            ['name' => 'Mapusa',       'color' => '#06b6d4', 'order' => 4],
                        ],
                    ],
                    [
                        'name'     => 'Tripura',
                        'color'    => '#0891b2',
                        'order'    => 24,
                        'children' => [
                            ['name' => 'Agartala',     'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Udaipur',      'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Dharmanagar',  'color' => '#06b6d4', 'order' => 3],
                        ],
                    ],
                    [
                        'name'     => 'Meghalaya',
                        'color'    => '#0891b2',
                        'order'    => 25,
                        'children' => [
                            ['name' => 'Shillong',     'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Tura',         'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Jowai',        'color' => '#06b6d4', 'order' => 3],
                        ],
                    ],
                    [
                        'name'     => 'Manipur',
                        'color'    => '#0891b2',
                        'order'    => 26,
                        'children' => [
                            ['name' => 'Imphal',       'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Thoubal',      'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Bishnupur',    'color' => '#06b6d4', 'order' => 3],
                        ],
                    ],
                    [
                        'name'     => 'Nagaland',
                        'color'    => '#0891b2',
                        'order'    => 27,
                        'children' => [
                            ['name' => 'Kohima',       'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Dimapur',      'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Mokokchung',   'color' => '#06b6d4', 'order' => 3],
                        ],
                    ],
                    [
                        'name'     => 'Mizoram',
                        'color'    => '#0891b2',
                        'order'    => 28,
                        'children' => [
                            ['name' => 'Aizawl',      'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Lunglei',     'color' => '#06b6d4', 'order' => 2],
                        ],
                    ],
                    [
                        'name'     => 'Arunachal Pradesh',
                        'color'    => '#0891b2',
                        'order'    => 29,
                        'children' => [
                            ['name' => 'Itanagar',     'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Naharlagun',   'color' => '#06b6d4', 'order' => 2],
                            ['name' => 'Pasighat',     'color' => '#06b6d4', 'order' => 3],
                        ],
                    ],
                    [
                        'name'     => 'Sikkim',
                        'color'    => '#0891b2',
                        'order'    => 30,
                        'children' => [
                            ['name' => 'Gangtok',      'color' => '#06b6d4', 'order' => 1],
                            ['name' => 'Namchi',       'color' => '#06b6d4', 'order' => 2],
                        ],
                    ],
                ],
            ],

            // ── Sports → Types ───────────────────────────────────
            [
                'name'        => 'Sports',
                'color'       => '#f59e0b',
                'icon'        => 'trophy',
                'description' => 'Latest sports news, scores and updates',
                'order'       => 2,
                'children'    => [
                    [
                        'name'     => 'Cricket',
                        'color'    => '#d97706',
                        'order'    => 1,
                        'children' => [
                            ['name' => 'IPL',              'color' => '#f59e0b', 'order' => 1],
                            ['name' => 'International Cricket', 'color' => '#f59e0b', 'order' => 2],
                            ['name' => 'Domestic Cricket', 'color' => '#f59e0b', 'order' => 3],
                        ],
                    ],
                    [
                        'name'     => 'Football',
                        'color'    => '#d97706',
                        'order'    => 2,
                        'children' => [
                            ['name' => 'Premier League', 'color' => '#f59e0b', 'order' => 1],
                            ['name' => 'La Liga',        'color' => '#f59e0b', 'order' => 2],
                            ['name' => 'ISL',            'color' => '#f59e0b', 'order' => 3],
                            ['name' => 'FIFA',           'color' => '#f59e0b', 'order' => 4],
                        ],
                    ],
                    [
                        'name'  => 'Tennis',
                        'color' => '#d97706',
                        'order' => 3,
                    ],
                    [
                        'name'  => 'Badminton',
                        'color' => '#d97706',
                        'order' => 4,
                    ],
                    [
                        'name'  => 'Hockey',
                        'color' => '#d97706',
                        'order' => 5,
                    ],
                    [
                        'name'  => 'Kabaddi',
                        'color' => '#d97706',
                        'order' => 6,
                    ],
                    [
                        'name'  => 'Wrestling',
                        'color' => '#d97706',
                        'order' => 7,
                    ],
                    [
                        'name'  => 'Athletics',
                        'color' => '#d97706',
                        'order' => 8,
                    ],
                    [
                        'name'  => 'Boxing',
                        'color' => '#d97706',
                        'order' => 9,
                    ],
                ],
            ],

            // ── Technology ───────────────────────────────────────
            [
                'name'        => 'Technology',
                'color'       => '#3b82f6',
                'icon'        => 'cpu',
                'description' => 'Latest technology trends and innovations',
                'order'       => 3,
                'children'    => [
                    ['name' => 'Artificial Intelligence', 'color' => '#2563eb', 'order' => 1],
                    ['name' => 'Cybersecurity',           'color' => '#2563eb', 'order' => 2],
                    ['name' => 'Gadgets',                 'color' => '#2563eb', 'order' => 3],
                    ['name' => 'Startups',                'color' => '#2563eb', 'order' => 4],
                    ['name' => 'Social Media',            'color' => '#2563eb', 'order' => 5],
                ],
            ],

            // ── Business ─────────────────────────────────────────
            [
                'name'        => 'Business',
                'color'       => '#10b981',
                'icon'        => 'briefcase',
                'description' => 'Business and economy updates',
                'order'       => 4,
                'children'    => [
                    ['name' => 'Stock Market',  'color' => '#059669', 'order' => 1],
                    ['name' => 'Real Estate',   'color' => '#059669', 'order' => 2],
                    ['name' => 'Banking',       'color' => '#059669', 'order' => 3],
                    ['name' => 'Economy',       'color' => '#059669', 'order' => 4],
                ],
            ],

            // ── Health ───────────────────────────────────────────
            [
                'name'        => 'Health',
                'color'       => '#ec4899',
                'icon'        => 'heart-pulse',
                'description' => 'Health, wellness and medical news',
                'order'       => 5,
                'children'    => [
                    ['name' => 'Fitness',       'color' => '#db2777', 'order' => 1],
                    ['name' => 'Nutrition',     'color' => '#db2777', 'order' => 2],
                    ['name' => 'Mental Health', 'color' => '#db2777', 'order' => 3],
                ],
            ],

            // ── Entertainment ────────────────────────────────────
            [
                'name'        => 'Entertainment',
                'color'       => '#f97316',
                'icon'        => 'clapperboard',
                'description' => 'Movies, music, TV shows and celebrity news',
                'order'       => 6,
                'children'    => [
                    ['name' => 'Bollywood',   'color' => '#ea580c', 'order' => 1],
                    ['name' => 'Hollywood',   'color' => '#ea580c', 'order' => 2],
                    ['name' => 'Music',       'color' => '#ea580c', 'order' => 3],
                    ['name' => 'Web Series',  'color' => '#ea580c', 'order' => 4],
                ],
            ],

            // ── Politics ─────────────────────────────────────────
            [
                'name'        => 'Politics',
                'color'       => '#ef4444',
                'icon'        => 'landmark',
                'description' => 'Political news and government updates',
                'order'       => 7,
                'children'    => [
                    ['name' => 'National Politics',      'color' => '#dc2626', 'order' => 1],
                    ['name' => 'International Politics', 'color' => '#dc2626', 'order' => 2],
                    ['name' => 'Elections',              'color' => '#dc2626', 'order' => 3],
                ],
            ],

            // ── Science ──────────────────────────────────────────
            [
                'name'        => 'Science',
                'color'       => '#8b5cf6',
                'icon'        => 'flask-conical',
                'description' => 'Scientific discoveries and research',
                'order'       => 8,
                'children'    => [
                    ['name' => 'Space',       'color' => '#7c3aed', 'order' => 1],
                    ['name' => 'Environment', 'color' => '#7c3aed', 'order' => 2],
                    ['name' => 'Research',    'color' => '#7c3aed', 'order' => 3],
                ],
            ],

            // ── World ────────────────────────────────────────────
            [
                'name'        => 'World',
                'color'       => '#14b8a6',
                'icon'        => 'globe',
                'description' => 'International news from around the world',
                'order'       => 9,
            ],

            // ── Education ────────────────────────────────────────
            [
                'name'        => 'Education',
                'color'       => '#6366f1',
                'icon'        => 'graduation-cap',
                'description' => 'Education news, exams and results',
                'order'       => 10,
                'children'    => [
                    ['name' => 'Board Exams',        'color' => '#4f46e5', 'order' => 1],
                    ['name' => 'Competitive Exams',  'color' => '#4f46e5', 'order' => 2],
                    ['name' => 'Universities',       'color' => '#4f46e5', 'order' => 3],
                ],
            ],
        ];

        // Clear existing categories
        Category::query()->forceDelete();

        $totalCreated = 0;

        foreach ($categories as $data) {
            $totalCreated += $this->createCategory($data);
        }

        $this->command->info("MultilevelCategorySeeder completed: {$totalCreated} categories created.");
    }

    /**
     * Recursively create a category and its children.
     */
    private function createCategory(array $data, ?int $parentId = null): int
    {
        $children = $data['children'] ?? [];
        unset($data['children']);

        $category = Category::create([
            'parent_id'   => $parentId,
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'color'       => $data['color'],
            'icon'        => $data['icon'] ?? null,
            'order'       => $data['order'],
            'is_active'   => true,
        ]);

        $count = 1;

        foreach ($children as $childData) {
            $count += $this->createCategory($childData, $category->id);
        }

        return $count;
    }
}
