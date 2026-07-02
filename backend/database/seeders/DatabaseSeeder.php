<?php

namespace Database\Seeders;

use App\Models\{User, Plan, SeoPage, FeatureFlag, AppConfig, Setting};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Super Admin ──────────────────────────────────────────────────────
        User::firstOrCreate(['email' => 'admin@peppy.app'], [
            'name'              => 'Peppy Admin',
            'username'          => 'peppyadmin',
            'password'          => Hash::make('Admin@123!'),
            'role'              => 'super_admin',
            'status'            => 'active',
            'is_verified'       => true,
            'email_verified_at' => now(),
            'referral_code'     => 'ADMIN001',
            'coin_balance'      => 9999,
        ]);

        // ── Plans ─────────────────────────────────────────────────────────────
        $plans = [
            [
                'name'             => 'Free',
                'slug'             => 'free',
                'tier'             => 'free',
                'price_monthly'    => 0,
                'price_yearly'     => 0,
                'features'         => ['5 likes/day', '3 messages/day', 'Basic matching'],
                'max_likes_per_day'=> 5,
                'max_messages_per_day' => 3,
                'sort_order'       => 1,
            ],
            [
                'name'             => 'Premium',
                'slug'             => 'premium',
                'tier'             => 'premium',
                'price_monthly'    => 9.99,
                'price_yearly'     => 99.99,
                'features'         => ['Unlimited likes', 'Unlimited messages', 'See who liked you', 'Priority matching', 'No ads', '50 coins/month'],
                'max_likes_per_day'=> null,
                'coins_included'   => 50,
                'can_see_who_liked'=> true,
                'priority_match'   => true,
                'hide_ads'         => true,
                'read_receipts'    => true,
                'is_popular'       => true,
                'sort_order'       => 2,
            ],
            [
                'name'             => 'VIP',
                'slug'             => 'vip',
                'tier'             => 'vip',
                'price_monthly'    => 19.99,
                'price_yearly'     => 199.99,
                'features'         => ['All Premium features', 'VIP badge', '200 coins/month', 'Top of search results', 'Dedicated support'],
                'max_likes_per_day'=> null,
                'coins_included'   => 200,
                'can_see_who_liked'=> true,
                'priority_match'   => true,
                'hide_ads'         => true,
                'read_receipts'    => true,
                'sort_order'       => 3,
            ],
            [
                'name'             => 'Corporate',
                'slug'             => 'corporate',
                'tier'             => 'corporate',
                'price_monthly'    => 49.99,
                'price_yearly'     => 499.99,
                'features'         => ['All VIP features', 'Event hosting', 'Team accounts', 'API access', 'Custom branding', '1000 coins/month'],
                'max_likes_per_day'=> null,
                'coins_included'   => 1000,
                'can_see_who_liked'=> true,
                'priority_match'   => true,
                'hide_ads'         => true,
                'read_receipts'    => true,
                'sort_order'       => 4,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::firstOrCreate(['slug' => $plan['slug']], $plan);
        }

        // ── SEO Pages ─────────────────────────────────────────────────────────
        $seoPages = [
            ['page_key' => 'home',     'page_title' => 'Home',     'meta_title' => 'Peppy — Find Your Perfect Match',    'meta_description' => 'Discover meaningful connections on Peppy, the social dating app trusted by millions.'],
            ['page_key' => 'about',    'page_title' => 'About',    'meta_title' => 'About Peppy',                         'meta_description' => 'Learn about Peppy and our mission to create meaningful connections.'],
            ['page_key' => 'pricing',  'page_title' => 'Pricing',  'meta_title' => 'Peppy Premium Plans & Pricing',       'meta_description' => 'Choose the perfect Peppy plan. Free, Premium, VIP, and Corporate options available.'],
            ['page_key' => 'events',   'page_title' => 'Events',   'meta_title' => 'Local Events & Meetups — Peppy',      'meta_description' => 'Discover and join local events and meetups near you.'],
            ['page_key' => 'blog',     'page_title' => 'Blog',     'meta_title' => 'Dating Tips & Advice — Peppy Blog',   'meta_description' => 'Expert dating advice, success stories, and relationship tips from the Peppy team.'],
            ['page_key' => 'privacy',  'page_title' => 'Privacy',  'meta_title' => 'Privacy Policy — Peppy',              'meta_description' => 'Read our privacy policy to understand how we protect your data.'],
            ['page_key' => 'terms',    'page_title' => 'Terms',    'meta_title' => 'Terms of Service — Peppy',            'meta_description' => 'Read our terms of service and user agreement.'],
            ['page_key' => 'contact',  'page_title' => 'Contact',  'meta_title' => 'Contact Peppy Support',               'meta_description' => 'Get in touch with the Peppy support team.'],
        ];

        foreach ($seoPages as $page) {
            SeoPage::firstOrCreate(['page_key' => $page['page_key']], $page);
        }

        // ── Feature Flags ─────────────────────────────────────────────────────
        $flags = [
            ['key' => 'ai_matching',       'name' => 'AI Smart Matching',      'is_enabled' => true,  'rollout_percentage' => 100],
            ['key' => 'video_calls',        'name' => 'Video Calls',            'is_enabled' => true,  'rollout_percentage' => 100],
            ['key' => 'audio_calls',        'name' => 'Audio Calls',            'is_enabled' => true,  'rollout_percentage' => 100],
            ['key' => 'group_events',       'name' => 'Group Events',           'is_enabled' => true,  'rollout_percentage' => 100],
            ['key' => 'stories',            'name' => 'Stories Feature',        'is_enabled' => false, 'rollout_percentage' => 0],
            ['key' => 'live_streaming',     'name' => 'Live Streaming',         'is_enabled' => false, 'rollout_percentage' => 0],
            ['key' => 'virtual_gifts',      'name' => 'Virtual Gifts',          'is_enabled' => true,  'rollout_percentage' => 80],
            ['key' => 'super_boost',        'name' => 'Profile Super Boost',    'is_enabled' => true,  'rollout_percentage' => 50],
        ];

        foreach ($flags as $flag) {
            FeatureFlag::firstOrCreate(['key' => $flag['key']], $flag);
        }

        // ── App Settings ──────────────────────────────────────────────────────
        $settings = [
            ['key' => 'app_name',           'value' => 'Peppy',               'group' => 'general'],
            ['key' => 'app_tagline',        'value' => 'Find Your Perfect Match', 'group' => 'general'],
            ['key' => 'support_email',      'value' => 'support@peppy.app',   'group' => 'general'],
            ['key' => 'maintenance_mode',   'value' => '0',                   'group' => 'system'],
            ['key' => 'registration_open',  'value' => '1',                   'group' => 'system'],
            ['key' => 'coin_rate_audio',    'value' => '5',                   'group' => 'coins'],
            ['key' => 'coin_rate_video',    'value' => '10',                  'group' => 'coins'],
            ['key' => 'two_factor_required','value' => '0',                   'group' => 'security'],
            ['key' => 'session_timeout',    'value' => '120',                 'group' => 'security'],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(['key' => $setting['key']], $setting);
        }

        $this->command->info('Database seeded successfully.');
    }
}
