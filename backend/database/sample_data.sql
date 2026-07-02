-- ============================================================
--  zingDates — Sample Database
--  Version  : 1.0
--  Date     : 2026-06-28
--  Engine   : MySQL 8.x / MariaDB 10.6+
--
--  Import:  mysql -u root -p zingdates_db < sample_data.sql
--
--  Default password for ALL users: Password@123
--  Super-admin login : admin@zingdates.app / Admin@123!
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';


-- ============================================================
-- USERS  (15 rows)
-- Password hash below = bcrypt("Password@123")
-- ============================================================
INSERT INTO `users` (`id`,`name`,`username`,`email`,`phone`,`country_code`,`email_verified_at`,`phone_verified_at`,`password`,`gender`,`date_of_birth`,`bio`,`profession`,`city`,`country`,`latitude`,`longitude`,`interests`,`avatar`,`role`,`status`,`is_verified`,`is_premium`,`kyc_status`,`coin_balance`,`referral_code`,`referred_by`,`last_active_at`,`created_at`,`updated_at`) VALUES

-- Staff accounts
(1, 'Rahul Mehta',     'rahulmehta',   'admin@zingdates.app',    '9876543210', '91', '2024-01-01 00:00:00', '2024-01-01 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'male',   '1990-03-15', 'Platform administrator.',  'Software Engineer', 'Mumbai',    'IN', 19.0760000, 72.8777000, '["Tech","Travel","Music"]',        NULL, 'super_admin', 'active', 1, 0, 'approved', 9999.00, 'ADMIN001', NULL, '2026-06-28 08:30:00', '2024-01-01 00:00:00', '2026-06-28 08:30:00'),
(2, 'Sarah Johnson',   'sarahj',       'sarah@zingdates.app',    '4155552671', '1',  '2024-03-15 00:00:00', '2024-03-15 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'female', '1993-07-22', 'Platform admin & community lead.', 'Community Manager', 'New York', 'US', 40.7128000, -74.0060000,'["Events","Fashion","Travel"]',     NULL, 'admin',       'active', 1, 0, 'approved', 500.00,  'SARAH001', NULL, '2026-06-28 10:15:00', '2024-03-15 00:00:00', '2026-06-28 10:15:00'),
(3, 'Tom Bradley',     'tombradley',   'tom@zingdates.app',      '4425553892', '44', '2024-06-01 00:00:00', '2024-06-01 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'male',   '1988-11-10', 'Events specialist.',               'Event Manager',     'London',   'GB', 51.5074000, -0.1278000, '["Events","Photography","Sports"]', NULL, 'event_manager','active',1, 0, 'approved', 200.00,  'TOM00001', NULL, '2026-06-28 09:00:00', '2024-06-01 00:00:00', '2026-06-28 09:00:00'),
(4, 'Aisha Patel',     'aishapatel',   'aisha@zingdates.app',    '9512349876', '91', '2024-09-10 00:00:00', '2024-09-10 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'female', '1995-04-18', 'Support champion.',                'Customer Support',  'Bangalore', 'IN',12.9716000, 77.5946000, '["Reading","Cooking","Yoga"]',     NULL, 'support_agent','active',1, 0, 'approved', 150.00,  'AISHA001', NULL, '2026-06-28 09:45:00', '2024-09-10 00:00:00', '2026-06-28 09:45:00'),

-- Regular users
(5,  'Priya Sharma',   'priyasharma',  'priya@gmail.com',        '9811122233', '91', '2025-01-10 00:00:00', '2025-01-10 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'female', '1997-06-12', 'Coffee lover & weekend hiker. Looking for someone genuine.',    'UX Designer',       'Delhi',     'IN',28.6139000, 77.2090000, '["Hiking","Coffee","Travel","Photography"]', NULL, 'user', 'active', 1, 1, 'approved', 320.00, 'PRIYA001', NULL, '2026-06-28 07:20:00', '2025-01-10 00:00:00', '2026-06-28 07:20:00'),
(6,  'James Wilson',   'jameswilson',  'james@outlook.com',      '2125559876', '1',  '2025-02-14 00:00:00', '2025-02-14 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'male',   '1992-09-05', 'Software dev by day, musician by night.',                       'Software Developer', 'New York', 'US',40.7128000, -74.0060000,'["Music","Coding","Fitness","Reading"]', NULL, 'user', 'active', 1, 1, 'approved', 480.00, 'JAMES001', NULL, '2026-06-28 11:30:00', '2025-02-14 00:00:00', '2026-06-28 11:30:00'),
(7,  'Sofia Rodrigues','sofiar',       'sofia@hotmail.com',      '3465551234', '34', '2025-03-20 00:00:00', '2025-03-20 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'female', '1999-01-28', 'Foodie, dancer, and part-time dreamer.',                         'Marketing Manager', 'Barcelona', 'ES',41.3851000, 2.1734000,  '["Dancing","Food","Art","Travel"]', NULL, 'user', 'active', 1, 0, 'none',     95.00,  'SOFIA001', 5, '2026-06-27 18:45:00', '2025-03-20 00:00:00', '2026-06-27 18:45:00'),
(8,  'Arjun Nair',     'arjunnair',    'arjun@gmail.com',        '9944556677', '91', '2025-04-05 00:00:00', '2025-04-05 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'male',   '1994-12-03', 'Finance professional who loves cricket and biryani.',            'Finance Analyst',   'Hyderabad', 'IN',17.3850000, 78.4867000, '["Cricket","Cooking","Finance","Movies"]',NULL,'user','active',1, 0, 'approved', 60.00,  'ARJUN001', NULL,'2026-06-28 06:10:00', '2025-04-05 00:00:00', '2026-06-28 06:10:00'),
(9,  'Emma Thompson',  'emmat',        'emma@gmail.com',         '7775554433', '44', '2025-05-18 00:00:00', '2025-05-18 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'female', '1996-08-22', 'Teacher, book club organiser, terrible cook.',                  'Teacher',           'London',   'GB',51.5074000, -0.1278000, '["Books","Teaching","Yoga","Baking"]', NULL,'user','active',1, 1, 'approved',250.00, 'EMMA0001', NULL,'2026-06-28 14:00:00', '2025-05-18 00:00:00', '2026-06-28 14:00:00'),
(10, 'Riya Kapoor',    'riyakapoor',   'riya@gmail.com',         '9876001122', '91', '2025-06-01 00:00:00', '2025-06-01 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'female', '2000-03-14', 'Fashion blogger and aspiring chef.',                             'Content Creator',   'Jaipur',   'IN',26.9124000, 75.7873000, '["Fashion","Food","Travel","Photography"]',NULL,'user','active',1, 0, 'none',    20.00,  'RIYA0001', 6, '2026-06-28 09:00:00', '2025-06-01 00:00:00', '2026-06-28 09:00:00'),
(11, 'Carlos Mendez',  'carlosmendez', 'carlos@gmail.com',       '5215559001', '52', '2025-06-15 00:00:00', '2025-06-15 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'male',   '1991-05-30', 'Architect with a passion for salsa dancing.',                   'Architect',         'Mexico City','MX',19.4326000,-99.1332000,'["Architecture","Salsa","Art","Football"]',NULL,'user','active',1, 1, 'approved',190.00, 'CARLOS01', NULL,'2026-06-27 21:30:00', '2025-06-15 00:00:00', '2026-06-27 21:30:00'),
(12, 'Yuki Tanaka',    'yukitanaka',   'yuki@gmail.com',         '8001112222', '81', '2025-07-20 00:00:00', '2025-07-20 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'female', '1998-02-08', 'Graphic designer and anime enthusiast.',                         'Graphic Designer',  'Tokyo',    'JP',35.6762000,139.6503000, '["Design","Anime","Gaming","Travel"]', NULL,'user','active',1, 0, 'none',    45.00,  'YUKI0001', NULL,'2026-06-28 03:20:00', '2025-07-20 00:00:00', '2026-06-28 03:20:00'),
(13, 'Mohammed Al-Rashid','mohammedar','mohammed@gmail.com',     '5551239876', '971','2025-08-10 00:00:00', '2025-08-10 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'male',   '1989-09-19', 'Entrepreneur and avid traveller. 40+ countries visited.',        'Entrepreneur',      'Dubai',    'AE',25.2048000, 55.2708000, '["Travel","Business","Sports","Food"]', NULL,'user','active',1, 1, 'approved',750.00, 'MOHAM001', NULL,'2026-06-28 12:10:00', '2025-08-10 00:00:00', '2026-06-28 12:10:00'),
(14, 'Natasha Ivanova', 'natashaii',   'natasha@gmail.com',      '7495550011', '7',  '2025-09-05 00:00:00', '2025-09-05 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'female', '2001-11-25', 'Student, violin player, cat mom.',                               'Student',           'Moscow',   'RU',55.7558000, 37.6176000, '["Music","Cats","Art","Reading"]',     NULL,'user','active',0, 0, 'none',    10.00,  'NATA0001', NULL,'2026-06-27 16:00:00', '2025-09-05 00:00:00', '2026-06-27 16:00:00'),
(15, 'David Park',     'davidpark',   'david@gmail.com',         '8185557788', '1',  '2025-10-12 00:00:00', '2025-10-12 00:00:00', '$2y$12$LMz5.CNHxhp7Gic3nyEPFOcCyYTQaBHJAn/1L.RnBJByKjbO7kY/i', 'male',   '1993-07-07', 'Physician, marathon runner, terrible at cooking.',               'Physician',         'Los Angeles','US',34.0522000,-118.2437000,'["Running","Medicine","Travel","Movies"]',NULL,'user','suspended',0, 0, 'none',  5.00,  'DAVID001', NULL,'2026-06-20 10:00:00', '2025-10-12 00:00:00', '2026-06-28 00:00:00');


-- ============================================================
-- USER PHOTOS  (sample photos per user)
-- ============================================================
INSERT INTO `user_photos` (`id`,`user_id`,`path`,`thumbnail`,`sort_order`,`is_primary`,`created_at`,`updated_at`) VALUES
(1,  5,  'photos/5/primary.jpg',  'photos/5/primary_thumb.jpg',  0, 1, '2025-01-10 01:00:00', '2025-01-10 01:00:00'),
(2,  5,  'photos/5/photo2.jpg',   'photos/5/photo2_thumb.jpg',   1, 0, '2025-01-12 10:00:00', '2025-01-12 10:00:00'),
(3,  6,  'photos/6/primary.jpg',  'photos/6/primary_thumb.jpg',  0, 1, '2025-02-14 02:00:00', '2025-02-14 02:00:00'),
(4,  7,  'photos/7/primary.jpg',  'photos/7/primary_thumb.jpg',  0, 1, '2025-03-20 03:00:00', '2025-03-20 03:00:00'),
(5,  8,  'photos/8/primary.jpg',  'photos/8/primary_thumb.jpg',  0, 1, '2025-04-05 04:00:00', '2025-04-05 04:00:00'),
(6,  9,  'photos/9/primary.jpg',  'photos/9/primary_thumb.jpg',  0, 1, '2025-05-18 05:00:00', '2025-05-18 05:00:00'),
(7,  11, 'photos/11/primary.jpg', 'photos/11/primary_thumb.jpg', 0, 1, '2025-06-15 06:00:00', '2025-06-15 06:00:00'),
(8,  13, 'photos/13/primary.jpg', 'photos/13/primary_thumb.jpg', 0, 1, '2025-08-10 07:00:00', '2025-08-10 07:00:00');


-- ============================================================
-- PLANS  (4 tiers)
-- ============================================================
INSERT INTO `plans` (`id`,`name`,`slug`,`description`,`tier`,`price_monthly`,`price_yearly`,`currency`,`features`,`max_likes_per_day`,`max_messages_per_day`,`coins_included`,`can_see_who_liked`,`priority_match`,`hide_ads`,`read_receipts`,`is_active`,`is_popular`,`sort_order`,`created_at`,`updated_at`) VALUES
(1, 'Free',      'free',      'Get started at no cost.',                  'free',      0.00,   0.00,   'INR', '["Basic matching","5 likes per day","3 messages per day"]',                                                          5,  3,    0, 0, 0, 0, 0, 1, 0, 1, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(2, 'Premium',   'premium',   'Unlimited connections & priority matching.','premium',  699.00, 6999.00,'INR', '["Unlimited likes","Unlimited messages","50 coins/month","See who liked you","Priority matching","No ads","Read receipts"]',NULL,NULL, 50, 1, 1, 1, 1, 1, 1, 2, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(3, 'VIP',       'vip',       'Everything in Premium plus VIP perks.',    'vip',      1499.00,14999.00,'INR', '["All Premium features","200 coins/month","VIP badge","Top search results","Dedicated support","Boost profile weekly"]',NULL,NULL,200, 1, 1, 1, 1, 1, 0, 3, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(4, 'Corporate', 'corporate', 'For event hosts and large organisations.', 'corporate', 3999.00,39999.00,'INR','["All VIP features","1000 coins/month","Event hosting","Team accounts (5 seats)","API access","Custom branding"]',     NULL,NULL,1000,1, 1, 1, 1, 1, 0, 4, '2024-01-01 00:00:00', '2024-01-01 00:00:00');


-- ============================================================
-- SUBSCRIPTIONS  (active subscriptions for premium users)
-- ============================================================
INSERT INTO `subscriptions` (`id`,`user_id`,`plan_id`,`status`,`billing_cycle`,`amount`,`currency`,`payment_gateway`,`auto_renew`,`current_period_start`,`current_period_end`,`created_at`,`updated_at`) VALUES
(1,  5,  2, 'active',    'monthly', 699.00,  'INR', 'razorpay', 1, '2026-06-01 00:00:00', '2026-07-01 00:00:00', '2025-01-10 02:00:00', '2026-06-01 00:00:00'),
(2,  6,  2, 'active',    'yearly',  6999.00, 'INR', 'stripe',   1, '2026-01-14 00:00:00', '2027-01-14 00:00:00', '2025-02-14 02:00:00', '2026-01-14 00:00:00'),
(3,  9,  2, 'active',    'monthly', 699.00,  'INR', 'razorpay', 1, '2026-06-18 00:00:00', '2026-07-18 00:00:00', '2025-05-18 02:00:00', '2026-06-18 00:00:00'),
(4,  11, 3, 'active',    'monthly', 1499.00, 'INR', 'razorpay', 1, '2026-06-15 00:00:00', '2026-07-15 00:00:00', '2025-06-15 02:00:00', '2026-06-15 00:00:00'),
(5,  13, 3, 'active',    'yearly',  14999.00,'INR', 'stripe',   1, '2026-01-10 00:00:00', '2027-01-10 00:00:00', '2025-08-10 02:00:00', '2026-01-10 00:00:00'),
(6,  7,  1, 'cancelled', 'monthly', 699.00,  'INR', 'razorpay', 0, '2026-02-20 00:00:00', '2026-03-20 00:00:00', '2025-03-20 02:00:00', '2026-03-01 00:00:00');


-- ============================================================
-- TRANSACTIONS  (purchases & refunds)
-- ============================================================
INSERT INTO `transactions` (`id`,`user_id`,`transaction_id`,`type`,`amount`,`currency`,`status`,`payment_gateway`,`gateway_transaction_id`,`description`,`ip_address`,`created_at`,`updated_at`) VALUES
(1,  5,  'TXN-20250110-0001', 'subscription',   699.00,  'INR', 'completed', 'razorpay', 'rzp_pay_001', 'Premium Monthly — Jan 2025',    '103.21.45.100', '2025-01-10 02:00:00', '2025-01-10 02:05:00'),
(2,  6,  'TXN-20250214-0002', 'subscription',  6999.00,  'INR', 'completed', 'stripe',   'ch_001stripe', 'Premium Yearly — Feb 2025',    '74.125.12.55',  '2025-02-14 02:00:00', '2025-02-14 02:05:00'),
(3,  5,  'TXN-20250315-0003', 'coin_purchase',  349.00,  'INR', 'completed', 'razorpay', 'rzp_pay_003', '250 Coins Pack',                 '103.21.45.100', '2025-03-15 10:00:00', '2025-03-15 10:02:00'),
(4,  8,  'TXN-20250405-0004', 'coin_purchase',  149.00,  'INR', 'completed', 'razorpay', 'rzp_pay_004', '100 Coins Pack',                 '49.37.10.200',  '2025-04-05 14:00:00', '2025-04-05 14:01:00'),
(5,  13, 'TXN-20250810-0005', 'subscription', 14999.00,  'INR', 'completed', 'stripe',   'ch_002stripe', 'VIP Yearly — Aug 2025',         '87.100.220.11', '2025-08-10 02:00:00', '2025-08-10 02:05:00'),
(6,  11, 'TXN-20250615-0006', 'subscription',  1499.00,  'INR', 'completed', 'razorpay', 'rzp_pay_006', 'VIP Monthly — Jun 2025',         '189.203.45.66', '2025-06-15 02:00:00', '2025-06-15 02:03:00'),
(7,  6,  'TXN-20260105-0007', 'coin_purchase',  599.00,  'INR', 'completed', 'stripe',   'ch_003stripe', '500 Coins Pack',                 '74.125.12.55',  '2026-01-05 09:00:00', '2026-01-05 09:01:00'),
(8,  9,  'TXN-20260618-0008', 'subscription',    699.00, 'INR', 'completed', 'razorpay', 'rzp_pay_008', 'Premium Monthly — Jun 2026',     '202.54.1.200',  '2026-06-18 02:00:00', '2026-06-18 02:02:00'),
(9,  7,  'TXN-20260220-0009', 'subscription',    699.00, 'INR', 'refunded',  'razorpay', 'rzp_pay_009', 'Premium Monthly — Refunded',      '91.108.4.100',  '2026-02-20 02:00:00', '2026-03-01 11:00:00'),
(10, 5,  'TXN-20260601-0010', 'subscription',    699.00, 'INR', 'completed', 'razorpay', 'rzp_pay_010', 'Premium Monthly — Jun 2026',     '103.21.45.100', '2026-06-01 02:00:00', '2026-06-01 02:02:00');


-- ============================================================
-- COIN LEDGER  (credit / debit history)
-- ============================================================
INSERT INTO `coin_ledger` (`id`,`user_id`,`amount`,`type`,`source`,`balance_after`,`description`,`created_at`,`updated_at`) VALUES
(1,  5,   50.00, 'credit', 'subscription',    50.00,  'Premium plan coins — Jan 2025',          '2025-01-10 02:05:00', '2025-01-10 02:05:00'),
(2,  5,  250.00, 'credit', 'purchase',       300.00,  '250 Coins Pack purchase',                '2025-03-15 10:02:00', '2025-03-15 10:02:00'),
(3,  5,  -10.00, 'debit',  'audio_call',     290.00,  'Audio call with James Wilson (2 min)',   '2025-06-20 15:30:00', '2025-06-20 15:30:00'),
(4,  5,  -25.00, 'debit',  'video_call',     265.00,  'Video call with James Wilson (1 min)',   '2025-07-10 18:00:00', '2025-07-10 18:00:00'),
(5,  5,   50.00, 'credit', 'subscription',   315.00,  'Premium plan coins — Feb 2025',          '2025-02-10 02:05:00', '2025-02-10 02:05:00'),
(6,  6,  500.00, 'credit', 'purchase',       500.00,  '500 Coins Pack purchase',                '2026-01-05 09:01:00', '2026-01-05 09:01:00'),
(7,  6,  -25.00, 'debit',  'video_call',     475.00,  'Video call with Priya Sharma (1 min)',   '2026-02-14 19:00:00', '2026-02-14 19:00:00'),
(8,  8,  100.00, 'credit', 'purchase',       100.00,  '100 Coins Pack purchase',                '2025-04-05 14:01:00', '2025-04-05 14:01:00'),
(9,  8,  -10.00, 'debit',  'audio_call',      90.00,  'Audio call with Emma Thompson (2 min)',  '2025-09-12 11:00:00', '2025-09-12 11:00:00'),
(10, 11, 200.00, 'credit', 'subscription',   200.00,  'VIP plan coins — Jun 2025',              '2025-06-15 02:03:00', '2025-06-15 02:03:00'),
(11, 11, -10.00, 'debit',  'gift',           190.00,  'Virtual gift sent to Priya Sharma',      '2025-08-01 20:00:00', '2025-08-01 20:00:00'),
(12, 13, 200.00, 'credit', 'subscription',   200.00,  'VIP plan coins — Aug 2025',              '2025-08-10 02:05:00', '2025-08-10 02:05:00'),
(13, 13, 200.00, 'credit', 'subscription',   400.00,  'VIP plan coins — Sep 2025',              '2025-09-10 02:05:00', '2025-09-10 02:05:00'),
(14, 5,   25.00, 'credit', 'referral',       340.00,  'Referral bonus — Sofia joined',          '2025-03-20 03:05:00', '2025-03-20 03:05:00'),
(15, 1, 9999.00, 'credit', 'admin_adjustment',9999.00,'Admin balance initialisation',           '2024-01-01 00:05:00', '2024-01-01 00:05:00');


-- ============================================================
-- EVENTS  (6 events in various states)
-- ============================================================
INSERT INTO `events` (`id`,`user_id`,`title`,`slug`,`description`,`category`,`type`,`status`,`venue_name`,`venue_address`,`city`,`country`,`latitude`,`longitude`,`starts_at`,`ends_at`,`max_capacity`,`ticket_price`,`currency`,`is_free`,`cover_image`,`tags`,`views_count`,`created_at`,`updated_at`) VALUES
(1, 3, 'Speed Dating Night — London',          'speed-dating-london-2026',      'Meet 10+ potential matches in one fun evening at a premium venue in Central London. Includes drinks and light bites.',           'Dating',    'in_person', 'approved', 'The Ivy Club',        '1 West Street',          'London',      'GB', 51.5105000, -0.1287000, '2026-07-15 19:00:00', '2026-07-15 22:00:00', 30,  499.00, 'INR', 0, 'events/1/cover.jpg',  '["dating","speed-dating","london"]',         1240, '2026-05-01 10:00:00', '2026-06-01 10:00:00'),
(2, 3, 'Singles Hiking Day — Mumbai',          'singles-hiking-mumbai-2026',    'A morning hike through Sanjay Gandhi National Park. Great way to meet active singles in a relaxed outdoor setting.',          'Outdoor',   'in_person', 'approved', 'SGNP Entry Gate',     'Borivali East',          'Mumbai',      'IN', 19.2147000, 72.9095000, '2026-07-20 07:00:00', '2026-07-20 13:00:00', 50,    0.00, 'INR', 1, 'events/2/cover.jpg',  '["hiking","singles","mumbai","outdoor"]',    892,  '2026-05-15 09:00:00', '2026-06-10 09:00:00'),
(3, 5, 'Creative Arts & Wine Mixer — Delhi',   'arts-wine-delhi-2026',          'Paint, sip and mingle. A creative evening pairing local art with curated wines. All skill levels welcome.',                   'Arts',      'in_person', 'approved', 'The Art Lounge',      '12 Mehrauli Road',       'Delhi',       'IN', 28.5245000, 77.1855000, '2026-07-25 17:00:00', '2026-07-25 21:00:00', 40,  799.00, 'INR', 0, 'events/3/cover.jpg',  '["art","wine","delhi","creative"]',          654,  '2026-06-01 11:00:00', '2026-06-20 11:00:00'),
(4, 3, 'Virtual Game Night',                   'virtual-game-night-jul-2026',   'Join singles from around the world for a fun virtual games night. Includes trivia, Skribbl and online party games.',          'Gaming',    'virtual',   'approved', NULL,                  NULL,                     'Global',      NULL, NULL,        NULL,        '2026-07-12 20:00:00', '2026-07-12 22:30:00', 100,   0.00, 'INR', 1, 'events/4/cover.jpg',  '["gaming","virtual","online","fun"]',        2100, '2026-06-05 08:00:00', '2026-06-25 08:00:00'),
(5, 1, 'Premium Members Gala — Bangalore',     'premium-gala-bangalore-2026',   'An exclusive gala dinner for Premium and VIP members. Black tie optional. Live music, fine dining, and curated connections.', 'Gala',      'in_person', 'approved', 'Taj West End',        '25 Race Course Road',    'Bangalore',   'IN', 12.9884000, 77.5972000, '2026-08-10 19:30:00', '2026-08-11 00:00:00', 80, 1999.00, 'INR', 0, 'events/5/cover.jpg',  '["premium","gala","bangalore","exclusive"]', 3450, '2026-06-10 12:00:00', '2026-06-28 12:00:00'),
(6, 6, 'Salsa & Samba Social — New York',      'salsa-social-nyc-2026',         'A Latin dance social for singles who love to move. Beginner-friendly. Partner rotation every few songs.',                    'Dancing',   'in_person', 'pending',  'Studio 310',          '310 W 43rd Street',      'New York',    'US', 40.7589000, -73.9945000, '2026-08-05 20:00:00', '2026-08-06 01:00:00', 60,  1200.00,'INR', 0, 'events/6/cover.jpg',  '["salsa","dance","nyc","singles"]',          210,  '2026-06-25 14:00:00', '2026-06-28 14:00:00');


-- ============================================================
-- EVENT REGISTRATIONS
-- ============================================================
INSERT INTO `event_registrations` (`id`,`event_id`,`user_id`,`status`,`ticket_code`,`is_checked_in`,`checked_in_at`,`transaction_id`,`created_at`,`updated_at`) VALUES
(1,  1,  6,  'registered', 'TKT1A2B3C', 0, NULL, NULL, '2026-06-10 10:00:00', '2026-06-10 10:00:00'),
(2,  1,  9,  'registered', 'TKT4D5E6F', 0, NULL, NULL, '2026-06-12 14:00:00', '2026-06-12 14:00:00'),
(3,  2,  5,  'registered', 'TKT7G8H9I', 0, NULL, NULL, '2026-06-15 08:00:00', '2026-06-15 08:00:00'),
(4,  2,  8,  'registered', 'TKTJKLMNOP', 0, NULL, NULL, '2026-06-16 09:00:00', '2026-06-16 09:00:00'),
(5,  2,  10, 'registered', 'TKTQRSTUV', 0, NULL, NULL, '2026-06-17 11:00:00', '2026-06-17 11:00:00'),
(6,  3,  5,  'registered', 'TKTWXYZ12', 0, NULL, NULL, '2026-06-20 13:00:00', '2026-06-20 13:00:00'),
(7,  3,  7,  'registered', 'TKT34ABCD', 0, NULL, NULL, '2026-06-21 15:00:00', '2026-06-21 15:00:00'),
(8,  4,  6,  'registered', 'TKT56EFGH', 0, NULL, NULL, '2026-06-25 20:00:00', '2026-06-25 20:00:00'),
(9,  4,  12, 'registered', 'TKT78IJKL', 0, NULL, NULL, '2026-06-26 19:00:00', '2026-06-26 19:00:00'),
(10, 5,  13, 'registered', 'TKT90MNOP', 0, NULL, NULL, '2026-06-27 10:00:00', '2026-06-27 10:00:00');


-- ============================================================
-- CONNECTIONS  (matches / connection requests)
-- ============================================================
INSERT INTO `connections` (`id`,`sender_id`,`receiver_id`,`status`,`accepted_at`,`created_at`,`updated_at`) VALUES
(1,  5,  6,  'accepted', '2025-05-01 14:00:00', '2025-04-28 10:00:00', '2025-05-01 14:00:00'),
(2,  5,  11, 'accepted', '2025-07-15 09:00:00', '2025-07-12 20:00:00', '2025-07-15 09:00:00'),
(3,  6,  9,  'accepted', '2025-06-20 16:00:00', '2025-06-18 11:00:00', '2025-06-20 16:00:00'),
(4,  8,  9,  'accepted', '2025-09-01 12:00:00', '2025-08-28 09:00:00', '2025-09-01 12:00:00'),
(5,  7,  13, 'accepted', '2025-10-10 18:00:00', '2025-10-07 15:00:00', '2025-10-10 18:00:00'),
(6,  11, 12, 'accepted', '2026-01-05 13:00:00', '2026-01-03 20:00:00', '2026-01-05 13:00:00'),
(7,  13, 5,  'accepted', '2025-12-20 11:00:00', '2025-12-18 08:00:00', '2025-12-20 11:00:00'),
(8,  10, 6,  'pending',  NULL,                  '2026-06-27 14:00:00', '2026-06-27 14:00:00'),
(9,  14, 6,  'pending',  NULL,                  '2026-06-28 07:00:00', '2026-06-28 07:00:00'),
(10, 12, 5,  'pending',  NULL,                  '2026-06-28 10:00:00', '2026-06-28 10:00:00'),
(11, 5,  14, 'rejected', NULL,                  '2026-01-15 09:00:00', '2026-01-16 10:00:00'),
(12, 6,  15, 'blocked',  NULL,                  '2026-03-01 08:00:00', '2026-03-01 08:30:00');


-- ============================================================
-- CONVERSATIONS
-- ============================================================
INSERT INTO `conversations` (`id`,`user_one_id`,`user_two_id`,`last_message_at`,`user_one_unread`,`user_two_unread`,`created_at`,`updated_at`) VALUES
(1, 5, 6,  '2026-06-27 22:00:00', 0, 2, '2025-05-01 14:05:00', '2026-06-27 22:00:00'),
(2, 5, 11, '2026-06-25 18:30:00', 1, 0, '2025-07-15 09:10:00', '2026-06-25 18:30:00'),
(3, 6, 9,  '2026-06-20 10:00:00', 0, 0, '2025-06-20 16:05:00', '2026-06-20 10:00:00'),
(4, 8, 9,  '2026-06-28 06:00:00', 0, 1, '2025-09-01 12:10:00', '2026-06-28 06:00:00'),
(5, 7, 13, '2026-06-26 14:00:00', 2, 0, '2025-10-10 18:10:00', '2026-06-26 14:00:00');


-- ============================================================
-- MESSAGES  (20 sample messages)
-- ============================================================
INSERT INTO `messages` (`id`,`conversation_id`,`sender_id`,`type`,`body`,`is_read`,`read_at`,`created_at`,`updated_at`) VALUES
(1,  1, 5,  'text', 'Hey James! I saw you are into music too. What do you play?',         1, '2025-05-01 14:10:00', '2025-05-01 14:07:00', '2025-05-01 14:07:00'),
(2,  1, 6,  'text', 'Hi Priya! Yes, guitar and a bit of piano. You?',                    1, '2025-05-01 14:15:00', '2025-05-01 14:12:00', '2025-05-01 14:12:00'),
(3,  1, 5,  'text', 'I sing! We should jam sometime haha. Are you in London?',            1, '2025-05-01 14:20:00', '2025-05-01 14:18:00', '2025-05-01 14:18:00'),
(4,  1, 6,  'text', 'New York actually! But I travel a lot. Maybe we can meet at an event.',1,'2025-05-02 09:00:00', '2025-05-02 08:55:00','2025-05-02 08:55:00'),
(5,  1, 5,  'text', 'That would be amazing! I just registered for the Speed Dating event.',1, '2025-05-02 09:10:00', '2025-05-02 09:08:00', '2025-05-02 09:08:00'),
(6,  1, 6,  'text', 'So did I 🎉 Looking forward to it!',                                0, NULL,                  '2026-06-27 22:00:00', '2026-06-27 22:00:00'),
(7,  2, 5,  'text', 'Hi Carlos! Love your profile. Fellow traveller here.',               1, '2025-07-15 09:15:00', '2025-07-15 09:12:00', '2025-07-15 09:12:00'),
(8,  2, 11, 'text', 'Thank you Priya! Where have you been recently?',                    1, '2025-07-15 10:00:00', '2025-07-15 09:58:00', '2025-07-15 09:58:00'),
(9,  2, 5,  'text', 'Just got back from Bali! It was incredible. You should go.',         1, '2025-07-15 10:30:00', '2025-07-15 10:28:00', '2025-07-15 10:28:00'),
(10, 2, 11, 'text', 'Bali is on my list! Mexico City is great if you ever visit.',        0, NULL,                  '2026-06-25 18:30:00', '2026-06-25 18:30:00'),
(11, 3, 6,  'text', 'Emma, your bio made me smile. Which books are you reading now?',     1, '2025-06-20 16:10:00', '2025-06-20 16:08:00', '2025-06-20 16:08:00'),
(12, 3, 9,  'text', 'Currently Lessons in Chemistry! You?',                              1, '2025-06-20 17:00:00', '2025-06-20 16:58:00', '2025-06-20 16:58:00'),
(13, 3, 6,  'text', 'Just finished Tomorrow and Tomorrow and Tomorrow. Highly recommend.',1, '2025-06-20 17:30:00', '2025-06-20 17:28:00', '2025-06-20 17:28:00'),
(14, 4, 8,  'text', 'Emma, I saw you are registered for the hiking event too!',           1, '2025-09-01 12:15:00', '2025-09-01 12:12:00', '2025-09-01 12:12:00'),
(15, 4, 9,  'text', 'Yes! It will be fun. Are you an experienced hiker?',                1, '2025-09-01 13:00:00', '2025-09-01 12:58:00', '2025-09-01 12:58:00'),
(16, 4, 8,  'text', 'Moderate level. Love the outdoors though!',                         1, '2025-09-01 13:30:00', '2025-09-01 13:28:00', '2025-09-01 13:28:00'),
(17, 4, 9,  'text', 'Same! See you there 😊',                                            0, NULL,                  '2026-06-28 06:00:00', '2026-06-28 06:00:00'),
(18, 5, 7,  'text', 'Mohammed, your travel stories are incredible! 40 countries wow.',    1, '2025-10-10 18:15:00', '2025-10-10 18:12:00', '2025-10-10 18:12:00'),
(19, 5, 13, 'text', 'Thank you Sofia! Every country teaches you something new.',          1, '2025-10-10 19:00:00', '2025-10-10 18:58:00', '2025-10-10 18:58:00'),
(20, 5, 7,  'text', 'I want to travel more. Any tips for a first solo trip?',             0, NULL,                  '2026-06-26 14:00:00', '2026-06-26 14:00:00');


-- ============================================================
-- CALLS  (audio and video call records)
-- ============================================================
INSERT INTO `calls` (`id`,`caller_id`,`receiver_id`,`type`,`status`,`duration_seconds`,`coins_charged`,`coins_per_minute`,`answered_at`,`ended_at`,`created_at`,`updated_at`) VALUES
(1,  5,  6,  'audio', 'ended',   120, 10.00, 5.00,  '2025-06-20 15:30:05', '2025-06-20 15:32:05', '2025-06-20 15:30:00', '2025-06-20 15:32:10'),
(2,  6,  5,  'video', 'ended',    60, 25.00,25.00,  '2025-07-10 18:00:10', '2025-07-10 18:01:10', '2025-07-10 18:00:00', '2025-07-10 18:01:20'),
(3,  8,  9,  'audio', 'ended',   180, 15.00, 5.00,  '2025-09-12 11:00:05', '2025-09-12 11:03:05', '2025-09-12 11:00:00', '2025-09-12 11:03:10'),
(4,  11, 5,  'audio', 'ended',    30,  5.00, 5.00,  '2025-08-01 20:00:05', '2025-08-01 20:00:35', '2025-08-01 20:00:00', '2025-08-01 20:00:40'),
(5,  5,  13, 'video', 'ended',   240, 75.00,25.00,  '2026-01-20 16:00:10', '2026-01-20 16:04:10', '2026-01-20 16:00:00', '2026-01-20 16:04:20'),
(6,  6,  9,  'audio', 'missed',    0,  0.00, 5.00,  NULL,                  NULL,                  '2026-03-15 20:00:00', '2026-03-15 20:00:30'),
(7,  13, 11, 'audio', 'declined',  0,  0.00, 5.00,  NULL,                  NULL,                  '2026-05-01 10:00:00', '2026-05-01 10:00:15'),
(8,  9,  8,  'video', 'ended',   300, 75.00,25.00,  '2026-06-01 14:00:10', '2026-06-01 14:05:10', '2026-06-01 14:00:00', '2026-06-01 14:05:20');


-- ============================================================
-- GROUPS
-- ============================================================
INSERT INTO `groups` (`id`,`owner_id`,`name`,`slug`,`description`,`category`,`type`,`members_count`,`max_members`,`is_active`,`created_at`,`updated_at`) VALUES
(1, 1,  'Travel Lovers India',    'travel-lovers-india',    'For singles who love to travel across India and beyond.',    'Travel',  'public',  8, 1000, 1, '2025-02-01 10:00:00', '2026-06-28 10:00:00'),
(2, 3,  'London Dating Scene',    'london-dating-scene',    'Events, tips, and meetups for singles in London.',           'Dating',  'public',  5, 500,  1, '2025-03-10 11:00:00', '2026-06-28 11:00:00'),
(3, 5,  'Creative Minds Connect', 'creative-minds-connect', 'A group for creative professionals to connect and collaborate.','Arts', 'public',  4, 200,  1, '2025-08-20 15:00:00', '2026-06-28 15:00:00');


-- ============================================================
-- GROUP MEMBERS
-- ============================================================
INSERT INTO `group_members` (`id`,`group_id`,`user_id`,`role`,`joined_at`) VALUES
(1,  1, 1,  'admin',     '2025-02-01 10:00:00'),
(2,  1, 5,  'member',    '2025-02-05 09:00:00'),
(3,  1, 8,  'member',    '2025-03-01 12:00:00'),
(4,  1, 10, 'moderator', '2025-04-10 14:00:00'),
(5,  1, 12, 'member',    '2025-05-20 16:00:00'),
(6,  1, 13, 'member',    '2025-06-01 10:00:00'),
(7,  1, 7,  'member',    '2025-09-15 11:00:00'),
(8,  1, 11, 'member',    '2025-11-01 09:00:00'),
(9,  2, 3,  'admin',     '2025-03-10 11:00:00'),
(10, 2, 6,  'member',    '2025-04-01 13:00:00'),
(11, 2, 9,  'member',    '2025-05-15 15:00:00'),
(12, 2, 14, 'member',    '2025-10-01 09:00:00'),
(13, 2, 15, 'member',    '2025-11-20 10:00:00'),
(14, 3, 5,  'admin',     '2025-08-20 15:00:00'),
(15, 3, 7,  'member',    '2025-09-01 11:00:00'),
(16, 3, 12, 'member',    '2025-10-15 14:00:00'),
(17, 3, 11, 'member',    '2026-01-10 09:00:00');


-- ============================================================
-- NOTIFICATIONS  (in-app notifications)
-- ============================================================
INSERT INTO `notifications` (`id`,`user_id`,`type`,`title`,`body`,`data`,`is_read`,`read_at`,`created_at`,`updated_at`) VALUES
(1,  5,  'new_connection', 'New Connection Request',   'Carlos Mendez wants to connect with you.',             '{"from_user_id":11}', 1, '2025-07-15 09:05:00', '2025-07-12 20:00:00', '2025-07-12 20:00:00'),
(2,  6,  'new_connection', 'New Connection Request',   'Riya Kapoor wants to connect with you.',               '{"from_user_id":10}', 0, NULL,                  '2026-06-27 14:00:00', '2026-06-27 14:00:00'),
(3,  5,  'new_message',    'New Message',               'James Wilson sent you a message.',                     '{"conversation_id":1}',1,'2025-05-01 14:15:00', '2025-05-01 14:07:00', '2025-05-01 14:07:00'),
(4,  9,  'new_message',    'New Message',               'Arjun Nair sent you a message.',                       '{"conversation_id":4}',0, NULL,                 '2026-06-28 06:00:00', '2026-06-28 06:00:00'),
(5,  5,  'event_reminder', 'Event Tomorrow',            'Singles Hiking Day is tomorrow at 7 AM. Don\'t forget!','{"event_id":2}',      1, '2026-07-19 10:00:00', '2026-07-19 09:00:00', '2026-07-19 09:00:00'),
(6,  13, 'subscription',   'Subscription Renewed',      'Your VIP plan has been renewed for another year.',     '{"plan_id":3}',        1, '2026-01-10 03:00:00', '2026-01-10 02:30:00', '2026-01-10 02:30:00'),
(7,  8,  'coins_low',      'Running Low on Coins',       'You have 60 coins left. Top up to keep connecting.',   '{"balance":60}',       1, '2026-05-01 10:05:00', '2026-05-01 10:00:00', '2026-05-01 10:00:00'),
(8,  7,  'refund',         'Refund Processed',           'Your ₹699 refund has been processed.',                 '{"transaction_id":9}', 1, '2026-03-01 12:00:00', '2026-03-01 11:30:00', '2026-03-01 11:30:00'),
(9,  5,  'like',           'Someone liked your profile', 'Mohammed Al-Rashid liked your profile.',               '{"from_user_id":13}',  1, '2025-12-19 10:00:00', '2025-12-18 08:00:00', '2025-12-18 08:00:00'),
(10, 6,  'new_connection', 'New Connection Request',     'Natasha Ivanova wants to connect with you.',           '{"from_user_id":14}',  0, NULL,                  '2026-06-28 07:00:00', '2026-06-28 07:00:00');


-- ============================================================
-- DEVICE TOKENS  (push notification tokens)
-- ============================================================
INSERT INTO `device_tokens` (`id`,`user_id`,`token`,`platform`,`last_used_at`,`created_at`,`updated_at`) VALUES
(1,  5,  'fcm_token_priya_android_001',  'android', '2026-06-28 07:20:00', '2025-01-10 02:00:00', '2026-06-28 07:20:00'),
(2,  6,  'apns_token_james_ios_001',      'ios',     '2026-06-28 11:30:00', '2025-02-14 02:00:00', '2026-06-28 11:30:00'),
(3,  9,  'fcm_token_emma_android_001',   'android', '2026-06-28 14:00:00', '2025-05-18 02:00:00', '2026-06-28 14:00:00'),
(4,  13, 'apns_token_mohammed_ios_001',   'ios',     '2026-06-28 12:10:00', '2025-08-10 02:00:00', '2026-06-28 12:10:00'),
(5,  11, 'fcm_token_carlos_android_001', 'android', '2026-06-27 21:30:00', '2025-06-15 02:00:00', '2026-06-27 21:30:00');


-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
INSERT INTO `support_tickets` (`id`,`ticket_number`,`user_id`,`assigned_to`,`subject`,`description`,`category`,`priority`,`status`,`first_response_at`,`resolved_at`,`created_at`,`updated_at`) VALUES
(1, 'TKT-A1B2C3', 7,  4, 'Refund not received', 'I cancelled my Premium subscription on March 1st and was told I would receive a refund within 5-7 business days. It has been 10 days and nothing.',  'Billing',  'high',   'resolved',     '2026-03-01 14:00:00', '2026-03-05 10:00:00', '2026-03-01 12:00:00', '2026-03-05 10:00:00'),
(2, 'TKT-D4E5F6', 10, 4, 'Cannot send messages', 'I am on the free plan and I keep getting an error when trying to send a third message in a day. Is this a bug or a limit?',                          'Technical','medium', 'resolved',     '2026-04-10 10:00:00', '2026-04-10 16:00:00', '2026-04-10 09:00:00', '2026-04-10 16:00:00'),
(3, 'TKT-G7H8I9', 14, 4, 'Profile photo not uploading', 'Every time I try to upload a profile photo I get a "file too large" error even though the image is under 2MB.',                             'Technical','medium', 'in_progress',  '2026-06-26 11:00:00', NULL,                  '2026-06-26 10:00:00', '2026-06-27 09:00:00'),
(4, 'TKT-J1K2L3', 8,  NULL, 'Account verification stuck', 'I submitted my KYC documents 3 weeks ago and my status is still "pending". When will it be reviewed?',                                    'Account',  'medium', 'open',         NULL,                  NULL,                  '2026-06-27 15:00:00', '2026-06-27 15:00:00'),
(5, 'TKT-M4N5O6', 15, 4, 'User harassment report', 'A user has been sending me inappropriate messages repeatedly even after I blocked them. Please take action.',                                     'Safety',   'urgent', 'resolved',     '2026-05-20 09:00:00', '2026-05-20 14:00:00', '2026-05-20 08:00:00', '2026-05-20 14:00:00');


-- ============================================================
-- TICKET REPLIES
-- ============================================================
INSERT INTO `ticket_replies` (`id`,`ticket_id`,`user_id`,`body`,`is_staff_reply`,`is_internal_note`,`created_at`,`updated_at`) VALUES
(1, 1, 4,  'Hi Sofia, I can see your cancellation was processed. The refund of ₹699 has been initiated and should appear within 2-3 business days. Apologies for the delay.', 1, 0, '2026-03-01 14:00:00', '2026-03-01 14:00:00'),
(2, 1, 7,  'Thank you! I received it today. All good.',                                                                                                                        0, 0, '2026-03-05 09:00:00', '2026-03-05 09:00:00'),
(3, 1, 4,  'Great! Closing this ticket. Feel free to reach out if you need anything.', 1, 0, '2026-03-05 10:00:00', '2026-03-05 10:00:00'),
(4, 2, 4,  'Hi Riya! The free plan includes 3 messages per day — this is by design, not a bug. Upgrading to Premium removes all limits. Would you like a discount code?',     1, 0, '2026-04-10 10:00:00', '2026-04-10 10:00:00'),
(5, 2, 10, 'Oh I see! Yes please, a discount code would be great.',                                                                                                            0, 0, '2026-04-10 12:00:00', '2026-04-10 12:00:00'),
(6, 2, 4,  'Use code WELCOME20 for 20% off your first Premium month. Closing this ticket.', 1, 0, '2026-04-10 16:00:00', '2026-04-10 16:00:00'),
(7, 3, 4,  'Hi Natasha, thanks for reporting this. Our max upload size is 5MB. Please check that the image dimensions are not excessively large. Try resizing to 1080×1080.',  1, 0, '2026-06-26 11:00:00', '2026-06-26 11:00:00'),
(8, 3, 14, 'I tried that and it still fails. Here are the details: iPhone 14 Pro, Safari browser, iOS 18.',                                                                    0, 0, '2026-06-27 08:00:00', '2026-06-27 08:00:00'),
(9, 3, 4,  'Thank you for the details. Escalating to the engineering team. We will update you within 24 hours.', 1, 0, '2026-06-27 09:00:00', '2026-06-27 09:00:00'),
(10,5, 4,  'Hi, we have reviewed this. The user in question has been suspended. We take safety very seriously. Thank you for reporting.', 1, 0, '2026-05-20 09:00:00', '2026-05-20 09:00:00');


-- ============================================================
-- USER REPORTS
-- ============================================================
INSERT INTO `user_reports` (`id`,`reporter_id`,`reported_id`,`reason`,`description`,`status`,`admin_notes`,`resolved_by`,`resolved_at`,`created_at`,`updated_at`) VALUES
(1, 15, 6,  'harassment',      'This user kept messaging me after I said I was not interested.',                   'resolved',  'Issued formal warning to reported user.',       1, '2026-03-02 10:00:00', '2026-03-01 08:00:00', '2026-03-02 10:00:00'),
(2, 8,  15, 'fake_profile',    'I believe this profile is fake. Photos look like stock images.',                  'resolved',  'Account suspended pending identity review.',    1, '2026-06-22 09:00:00', '2026-06-20 11:00:00', '2026-06-22 09:00:00'),
(3, 12, 10, 'inappropriate',   'User sent unsolicited photos in a message.',                                       'pending',    NULL,                                            NULL, NULL,                '2026-06-27 20:00:00', '2026-06-27 20:00:00');


-- ============================================================
-- CAMPAIGNS  (marketing push/email campaigns)
-- ============================================================
INSERT INTO `campaigns` (`id`,`name`,`subject`,`body`,`type`,`status`,`audience_filter`,`recipient_count`,`sent_count`,`open_count`,`click_count`,`scheduled_at`,`sent_at`,`created_by`,`created_at`,`updated_at`) VALUES
(1, 'Welcome to zingDates',            'Welcome! Start connecting today.',          'Hi {name}, welcome to zingDates! Your journey to meaningful connections starts now. Complete your profile to get better matches.',  'email', 'sent',      '{"trigger":"registration"}',      3210, 3210, 1890, 640, '2026-01-01 09:00:00', '2026-01-01 09:05:00', 2, '2025-12-20 10:00:00', '2026-01-01 10:00:00'),
(2, 'Premium Summer Offer',            NULL,                                        'Summer is the perfect time to find your match! Upgrade to Premium and get unlimited connections. Use code SUMMER25 for 25% off.', 'push',  'sent',      '{"plan":"free","status":"active"}',5400, 5400, 3100, 980, '2026-06-01 10:00:00', '2026-06-01 10:02:00', 2, '2026-05-25 14:00:00', '2026-06-01 11:00:00'),
(3, 'July Event Reminders',            'Events near you this July!',                'Hi {name}, there are exciting events happening near you this July. From speed dating to hiking — find your next adventure.',        'email', 'scheduled', '{"city":"Mumbai,Delhi,London"}',   1800, 0,    0,    0,   '2026-07-01 08:00:00', NULL,                  3, '2026-06-25 09:00:00', '2026-06-25 09:00:00');


-- ============================================================
-- COUPON CODES
-- ============================================================
INSERT INTO `coupon_codes` (`id`,`code`,`discount_type`,`discount_value`,`min_order_amount`,`usage_limit`,`usage_count`,`per_user_limit`,`is_active`,`valid_from`,`valid_until`,`created_at`,`updated_at`) VALUES
(1, 'WELCOME20',  'percentage', 20.00, 499.00, 1000, 42,  1, 1, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2025-12-25 00:00:00', '2026-06-28 00:00:00'),
(2, 'SUMMER25',   'percentage', 25.00, 699.00, 500,  118, 1, 1, '2026-06-01 00:00:00', '2026-07-31 23:59:59', '2026-05-25 00:00:00', '2026-06-28 00:00:00'),
(3, 'FLAT100',    'fixed',     100.00, 699.00, 200,  31,  1, 1, '2026-04-01 00:00:00', '2026-06-30 23:59:59', '2026-03-25 00:00:00', '2026-06-28 00:00:00'),
(4, 'VIP50OFF',   'percentage', 50.00,1499.00, 50,   8,   1, 1, '2026-06-15 00:00:00', '2026-07-15 23:59:59', '2026-06-15 00:00:00', '2026-06-28 00:00:00'),
(5, 'FREEMONTH',  'percentage',100.00,   0.00, 100,  5,   1, 0, '2026-01-01 00:00:00', '2026-03-31 23:59:59', '2025-12-25 00:00:00', '2026-06-01 00:00:00');


-- ============================================================
-- SEO PAGES
-- ============================================================
INSERT INTO `seo_pages` (`id`,`page_key`,`page_title`,`meta_title`,`meta_description`,`meta_keywords`,`og_title`,`og_description`,`robots`,`created_at`,`updated_at`) VALUES
(1, 'home',     'zingDates — Find Your Perfect Match', 'zingDates — The Best Dating & Social App',            'Connect with millions of singles near you. Find meaningful relationships, attend local events, and build real connections on zingDates.',                             'dating app, meet singles, online dating, social events, connections', 'zingDates — Find Your Perfect Match',  'The best place to meet your future partner.',          'index, follow', '2024-01-01 00:00:00', '2026-06-01 00:00:00'),
(2, 'about',    'About zingDates',                     'About zingDates — Our Story',                          'Learn about zingDates — our mission to help people find genuine connections through smart matching, local events, and a safe community platform.',                    'about zingDates, our story, dating platform',                         'About zingDates',                       'Our mission is to help you find real connections.',    'index, follow', '2024-01-01 00:00:00', '2026-06-01 00:00:00'),
(3, 'pricing',  'Pricing — zingDates Plans',           'Pricing & Plans — zingDates',                          'Choose the plan that fits your journey. Free, Premium, VIP and Corporate plans available. Upgrade anytime.',                                                      'dating app pricing, premium plan, subscription',                       'zingDates Pricing',                     'Find the plan that works for you.',                    'index, follow', '2024-01-01 00:00:00', '2026-06-01 00:00:00'),
(4, 'events',   'Events & Meetups — zingDates',        'Singles Events Near You — zingDates',                  'Discover speed dating nights, hiking days, art mixers, and more. Real-world meetups for singles hosted through zingDates.',                                        'singles events, speed dating, meetups near me',                        'Singles Events on zingDates',           'Find events and meetups near you.',                    'index, follow', '2024-01-01 00:00:00', '2026-06-01 00:00:00'),
(5, 'blog',     'Blog — zingDates',                    'Dating Tips, Success Stories & More — zingDates Blog', 'Read dating tips, success stories, relationship advice and app news on the zingDates blog.',                                                                       'dating tips, relationship advice, success stories',                    'zingDates Blog',                        'Tips, stories and advice for modern dating.',          'index, follow', '2024-01-01 00:00:00', '2026-06-01 00:00:00'),
(6, 'privacy',  'Privacy Policy — zingDates',          'Privacy Policy — zingDates',                           'Read the zingDates Privacy Policy to understand how we collect, use and protect your personal data.',                                                               'privacy policy, data protection, GDPR',                               'Privacy Policy',                        'How we protect your data.',                            'index, follow', '2024-01-01 00:00:00', '2026-06-01 00:00:00'),
(7, 'terms',    'Terms of Service — zingDates',        'Terms of Service — zingDates',                         'Read the zingDates Terms of Service. By using our platform you agree to these terms.',                                                                              'terms of service, user agreement',                                    'Terms of Service',                      'Our terms and conditions.',                            'index, follow', '2024-01-01 00:00:00', '2026-06-01 00:00:00'),
(8, 'contact',  'Contact Us — zingDates',              'Contact zingDates Support',                             'Get in touch with the zingDates team. We are here to help with any questions about your account, subscriptions or events.',                                        'contact support, help, zingDates customer service',                   'Contact zingDates',                     'We are here to help.',                                 'index, follow', '2024-01-01 00:00:00', '2026-06-01 00:00:00');


-- ============================================================
-- BLOG POSTS
-- ============================================================
INSERT INTO `blog_posts` (`id`,`author_id`,`title`,`slug`,`excerpt`,`body`,`category`,`tags`,`status`,`meta_title`,`meta_description`,`views_count`,`published_at`,`created_at`,`updated_at`) VALUES
(1, 2, '5 Tips to Write a Profile That Gets Matches',     '5-tips-profile-that-gets-matches',    'Your profile is your first impression. Here is how to make it count.',                      '<p>Your profile is your most powerful tool on zingDates. Here are 5 proven tips to help you stand out...</p><h2>1. Use a clear, recent photo</h2><p>Your primary photo should show your face clearly in good lighting...</p><h2>2. Write a bio that sparks curiosity</h2><p>Instead of listing hobbies, tell a short story...</p><h2>3. Mention your city and interests</h2><p>Specificity creates connection...</p><h2>4. Keep it positive</h2><p>Avoid negatives or a list of what you do NOT want...</p><h2>5. Update it regularly</h2><p>A fresh profile gets more visibility in our algorithm...</p>',                                                                                                                       'Dating Tips',   '["profile tips","dating advice","first impression"]', 'published', '5 Tips for a Great Dating Profile — zingDates Blog', 'Write a profile that attracts quality matches on zingDates.',  4820, '2025-06-01 10:00:00', '2025-05-28 09:00:00', '2026-06-01 09:00:00'),
(2, 2, 'How zingDates Events Changed My Social Life',     'how-events-changed-my-social-life',   'A real story from a member who found her partner at a Speed Dating Night.',                  '<p>When Priya first signed up for zingDates, she was not sure about the events feature...</p><p>"I almost did not go," she told us. "I had anxiety about meeting strangers."</p><p>But she decided to attend the Speed Dating Night in Delhi, and within two hours she had exchanged numbers with three interesting people...</p><p>Six months later, she is in a relationship with someone she met there...</p><p>Events on zingDates are designed to make real-world connections easy and safe...</p>',                                                                                                           'Success Stories','["events","speed dating","success story","real life"]','published','How a zingDates Event Changed My Life — Blog',       'Read how one member found love at a zingDates event.',          3100, '2025-09-15 11:00:00', '2025-09-10 10:00:00', '2026-06-01 09:00:00'),
(3, 1, 'Introducing zingDates Coins: Call, Gift & More', 'introducing-zingdates-coins',          'zingDates Coins let you go beyond text. Here is everything you need to know.',               '<p>We are excited to introduce zingDates Coins — our in-app currency that unlocks richer connections.</p><h2>What can I do with Coins?</h2><ul><li>Audio calls: 5 coins per minute</li><li>Video calls: 10 coins per minute</li><li>Send virtual gifts: from 5 coins</li></ul><h2>How do I get Coins?</h2><p>You can purchase Coin packs starting at ₹149 for 100 coins...</p><p>Premium and VIP members also receive monthly coin bonuses...</p><h2>Are Coins secure?</h2><p>All transactions are processed via Razorpay and Stripe with full encryption...</p>', 'Product Update','["coins","audio call","video call","gifts","feature"]',  'published', 'zingDates Coins — Calls, Gifts & More',              'Learn how zingDates Coins work and how to use them.',           6200, '2025-11-01 09:00:00', '2025-10-25 10:00:00', '2026-06-01 09:00:00'),
(4, 2, '7 Green Flags to Look For on a First Date',      '7-green-flags-first-date',             'Not every first date leads somewhere. Here is what healthy chemistry looks like.',           '<p>We often talk about red flags, but what about green flags? Here are 7 signs your first date is going well...</p><h2>1. They ask follow-up questions</h2><p>This shows they are genuinely listening...</p><h2>2. They are on time</h2><h2>3. No phone distractions</h2><h2>4. The conversation flows naturally</h2><h2>5. They respect your boundaries</h2><h2>6. They talk about future plans without pressure</h2><h2>7. You feel comfortable being yourself</h2><p>Trust your instincts above all...</p>',  'Dating Tips',  '["first date","green flags","dating advice","tips"]', 'published', '7 Green Flags on a First Date — zingDates Blog',    '7 signs your first date is going in the right direction.',       8900, '2026-03-08 10:00:00', '2026-03-01 10:00:00', '2026-06-01 09:00:00');


-- ============================================================
-- FEATURE FLAGS
-- ============================================================
INSERT INTO `feature_flags` (`id`,`key`,`name`,`description`,`is_enabled`,`rollout_percentage`,`created_at`,`updated_at`) VALUES
(1, 'ai_matching',      'AI Matching',           'AI-powered compatibility scoring for match recommendations.',         1, 100, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(2, 'video_calls',      'Video Calls',           'In-app video calling between connected users.',                       1, 100, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(3, 'audio_calls',      'Audio Calls',           'In-app audio calling between connected users.',                       1, 100, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(4, 'group_events',     'Group Events',          'Group event creation and registration.',                              1, 100, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(5, 'stories',          'Stories',               '24-hour story posts (Instagram-style).',                              0, 0,   '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(6, 'live_streaming',   'Live Streaming',        'Live video broadcast feature for events.',                            0, 0,   '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(7, 'virtual_gifts',    'Virtual Gifts',         'Send virtual animated gifts using coins.',                            1, 80,  '2024-01-01 00:00:00', '2026-01-01 00:00:00'),
(8, 'super_boost',      'Super Boost',           'Temporarily push a profile to the top of discovery.',                1, 50,  '2024-01-01 00:00:00', '2026-01-01 00:00:00');


-- ============================================================
-- APP SETTINGS  (global key-value config)
-- ============================================================
INSERT INTO `settings` (`id`,`key`,`value`,`group`,`type`,`created_at`,`updated_at`) VALUES
(1,  'app_name',                  'zingDates',                                  'general',       'string',  '2024-01-01 00:00:00', '2026-06-28 00:00:00'),
(2,  'support_email',             'support@zingdates.app',                      'general',       'string',  '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(3,  'coin_rate_audio_per_min',   '5',                                          'coins',         'integer', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(4,  'coin_rate_video_per_min',   '10',                                         'coins',         'integer', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(5,  'maintenance_mode',          '0',                                          'general',       'boolean', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(6,  'registration_enabled',      '1',                                          'general',       'boolean', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(7,  'session_timeout_minutes',   '120',                                        'security',      'integer', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(8,  'max_photos_per_user',       '6',                                          'users',         'integer', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(9,  'kyc_required_for_calls',    '1',                                          'security',      'boolean', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(10, 'default_currency',          'INR',                                        'payments',      'string',  '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(11, 'razorpay_key_id',           'rzp_test_XXXXXXXXXXXXXXXX',                  'payments',      'string',  '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(12, 'firebase_project_id',       'zingdates-prod',                             'integrations',  'string',  '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(13, 'referral_bonus_coins',      '25',                                         'coins',         'integer', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(14, 'min_age',                   '18',                                         'users',         'integer', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(15, 'max_age',                   '99',                                         'users',         'integer', '2024-01-01 00:00:00', '2024-01-01 00:00:00');


-- ============================================================
-- APP VERSIONS
-- ============================================================
INSERT INTO `app_versions` (`id`,`version`,`platform`,`status`,`changelog`,`force_update`,`download_url`,`released_at`,`created_at`,`updated_at`) VALUES
(1, '1.0.0', 'both',    'deprecated', 'Initial release.',                                                                        0, NULL, '2024-06-01 00:00:00', '2024-06-01 00:00:00', '2025-01-01 00:00:00'),
(2, '1.5.0', 'both',    'deprecated', 'Events feature, improved matching algorithm.',                                            0, NULL, '2024-10-15 00:00:00', '2024-10-15 00:00:00', '2025-06-01 00:00:00'),
(3, '2.0.0', 'both',    'deprecated', 'Audio & video calls, zingDates Coins, VIP plan launched.',                               0, NULL, '2025-03-01 00:00:00', '2025-03-01 00:00:00', '2026-01-01 00:00:00'),
(4, '2.5.0', 'android', 'supported',  'Group feature, improved notifications, bug fixes.',                                       0, NULL, '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2026-06-01 00:00:00'),
(5, '2.5.1', 'ios',     'supported',  'Group feature, improved notifications, iOS 18 compatibility.',                            0, NULL, '2025-09-15 00:00:00', '2025-09-15 00:00:00', '2026-06-01 00:00:00'),
(6, '3.0.0', 'both',    'latest',     'UI redesign, AI matching v2, super boost feature, dark mode, performance improvements.',  1, NULL, '2026-04-01 00:00:00', '2026-04-01 00:00:00', '2026-04-01 00:00:00');


-- ============================================================
-- AUDIT LOGS  (admin actions)
-- ============================================================
INSERT INTO `audit_logs` (`id`,`user_id`,`action`,`module`,`description`,`ip_address`,`subject_id`,`subject_type`,`created_at`,`updated_at`) VALUES
(1,  1, 'SUSPEND_USER',      'Users',         'Suspended user David Park (ID 15) due to fake profile reports.',    '192.168.1.10', 15, 'App\\Models\\User',          '2026-06-22 09:30:00', '2026-06-22 09:30:00'),
(2,  2, 'APPROVE_EVENT',     'Events',        'Approved event: Speed Dating Night — London (ID 1).',               '192.168.1.15',  1, 'App\\Models\\Event',         '2026-06-01 10:15:00', '2026-06-01 10:15:00'),
(3,  2, 'APPROVE_EVENT',     'Events',        'Approved event: Singles Hiking Day — Mumbai (ID 2).',               '192.168.1.15',  2, 'App\\Models\\Event',         '2026-06-10 09:45:00', '2026-06-10 09:45:00'),
(4,  1, 'PROCESS_REFUND',    'Payments',      'Processed refund of ₹699 for transaction TXN-20260220-0009.',       '192.168.1.10',  9, 'App\\Models\\Transaction',   '2026-03-01 11:00:00', '2026-03-01 11:00:00'),
(5,  2, 'SEND_CAMPAIGN',     'Marketing',     'Sent campaign: Premium Summer Offer to 5400 users.',                '192.168.1.15',  2, 'App\\Models\\Campaign',      '2026-06-01 10:05:00', '2026-06-01 10:05:00'),
(6,  1, 'UPDATE_SETTING',    'Settings',      'Updated setting: app_name to zingDates.',                           '192.168.1.10', NULL, NULL,                        '2026-06-28 00:30:00', '2026-06-28 00:30:00'),
(7,  4, 'CLOSE_TICKET',      'Support',       'Resolved support ticket TKT-A1B2C3 (refund request).',              '192.168.1.20',  1, 'App\\Models\\SupportTicket', '2026-03-05 10:00:00', '2026-03-05 10:00:00'),
(8,  1, 'APPROVE_EVENT',     'Events',        'Approved event: Creative Arts & Wine Mixer — Delhi (ID 3).',        '192.168.1.10',  3, 'App\\Models\\Event',         '2026-06-20 11:30:00', '2026-06-20 11:30:00'),
(9,  2, 'CREATE_COUPON',     'Marketing',     'Created coupon code SUMMER25 (25% off).',                           '192.168.1.15',  2, 'App\\Models\\CouponCode',    '2026-05-25 14:00:00', '2026-05-25 14:00:00'),
(10, 1, 'RESOLVE_REPORT',    'Safety',        'Resolved user report (ID 2). Suspended David Park (ID 15).',        '192.168.1.10',  2, 'App\\Models\\UserReport',    '2026-06-22 09:00:00', '2026-06-22 09:00:00');


-- ============================================================
-- SEO REDIRECTS
-- ============================================================
INSERT INTO `seo_redirects` (`id`,`from_url`,`to_url`,`status_code`,`is_active`,`hit_count`,`created_at`,`updated_at`) VALUES
(1, '/dating',            '/app',                       301, 1, 42,  '2024-06-01 00:00:00', '2026-06-01 00:00:00'),
(2, '/register',          '/signup',                    301, 1, 218, '2024-06-01 00:00:00', '2026-06-01 00:00:00'),
(3, '/plans',             '/pricing',                   301, 1, 95,  '2025-01-01 00:00:00', '2026-06-01 00:00:00'),
(4, '/events/london',     '/events?city=london',        301, 1, 31,  '2025-03-01 00:00:00', '2026-06-01 00:00:00'),
(5, '/blog/tips',         '/blog?category=dating-tips', 302, 1, 14,  '2025-06-01 00:00:00', '2026-06-01 00:00:00'),
(6, '/old-about',         '/about',                     301, 0, 7,   '2024-08-01 00:00:00', '2025-12-01 00:00:00');


-- ============================================================
-- CMS PAGES  (static content pages)
-- ============================================================
INSERT INTO `pages` (`id`,`key`,`title`,`slug`,`content`,`status`,`created_at`,`updated_at`) VALUES
(1, 'privacy',  'Privacy Policy',   'privacy-policy',   '<h1>Privacy Policy</h1><p>Last updated: 1 January 2026.</p><h2>1. Information We Collect</h2><p>We collect information you provide directly to us when you create an account, complete your profile, or contact support. This includes your name, email address, date of birth, gender, photos, and any other information you choose to provide.</p><h2>2. How We Use Your Information</h2><p>We use your information to operate and improve the platform, personalise your experience, match you with other users, send notifications, and respond to your requests.</p><h2>3. Data Security</h2><p>We use industry-standard encryption and security measures to protect your personal data. All payment transactions are processed via PCI-DSS compliant gateways.</p><h2>4. Your Rights</h2><p>You may access, correct, or delete your personal data at any time through your account settings or by contacting support@zingdates.app.</p><h2>5. Contact</h2><p>For privacy-related enquiries, email: privacy@zingdates.app</p>', 'published', '2024-01-01 00:00:00', '2026-01-01 00:00:00'),
(2, 'terms',    'Terms of Service', 'terms-of-service', '<h1>Terms of Service</h1><p>Last updated: 1 January 2026.</p><h2>1. Acceptance of Terms</h2><p>By creating an account on zingDates you agree to these Terms of Service and our Privacy Policy.</p><h2>2. Eligibility</h2><p>You must be at least 18 years old to use zingDates. By registering you confirm you meet this requirement.</p><h2>3. Account Responsibility</h2><p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.</p><h2>4. Prohibited Conduct</h2><p>You may not use zingDates to harass, abuse, or harm other users; post false or misleading information; impersonate others; or engage in any unlawful activity.</p><h2>5. Subscriptions & Payments</h2><p>Subscriptions are billed in advance on a monthly or annual basis. Refunds are issued at our discretion in accordance with our Refund Policy.</p><h2>6. Termination</h2><p>We reserve the right to suspend or terminate accounts that violate these terms.</p>', 'published', '2024-01-01 00:00:00', '2026-01-01 00:00:00'),
(3, 'about',    'About Us',         'about',            '<h1>About zingDates</h1><p>zingDates was founded with one belief: that meaningful connections begin with genuine people.</p><h2>Our Mission</h2><p>We build technology that brings people together — not just online, but in real life. From smart matching powered by AI to local events and group meetups, zingDates is the platform for modern singles who want more than a swipe.</p><h2>Our Story</h2><p>zingDates launched in 2024 with a small but passionate team dedicated to making online dating safer, smarter, and more human. Today we serve users across India, the UK, the US, Europe, and beyond.</p><h2>Safety First</h2><p>Every profile goes through identity verification. Our moderation team reviews reports within 24 hours. We believe everyone deserves a safe space to find connection.</p><h2>Contact</h2><p>Email us at hello@zingdates.app or use the contact form on our website.</p>', 'published', '2024-01-01 00:00:00', '2026-06-01 00:00:00'),
(4, 'contact',  'Contact Us',       'contact',          '<h1>Contact Us</h1><p>We are here to help. Reach out to the zingDates team using any of the options below.</p><h2>Support</h2><p>For account, billing or technical issues please email support@zingdates.app or open a support ticket from within your account dashboard.</p><h2>Business Enquiries</h2><p>For partnerships, advertising, or press enquiries email: business@zingdates.app</p><h2>Report a Safety Issue</h2><p>If you feel unsafe or need to report urgent abuse, use the in-app report button or email: safety@zingdates.app. We respond to safety issues within 1 hour.</p><h2>Our Office</h2><p>zingDates Pvt. Ltd., Cyber Vision Infotech, Gurugram, Haryana, India.</p>', 'published', '2024-01-01 00:00:00', '2026-06-01 00:00:00'),
(5, 'refund',   'Refund Policy',    'refund-policy',    '<h1>Refund Policy</h1><p>Last updated: 1 January 2026.</p><h2>Subscription Refunds</h2><p>We offer a 7-day refund window on first-time subscription purchases if you have not used any premium features. Contact support within 7 days of purchase to request a refund.</p><h2>Coin Purchases</h2><p>Coin purchases are non-refundable once coins have been used. Unused coins may be refunded within 14 days of purchase at our discretion.</p><h2>Event Tickets</h2><p>Event ticket refunds are handled by the event organiser. Please contact the organiser directly or raise a support ticket if you require assistance.</p><h2>How to Request</h2><p>Email refunds@zingdates.app with your transaction ID and reason. We aim to process all requests within 5 business days.</p>', 'published', '2024-06-01 00:00:00', '2026-01-01 00:00:00');


-- ============================================================
-- MEDIA FILES  (admin-uploaded assets)
-- ============================================================
INSERT INTO `media_files` (`id`,`uploaded_by`,`name`,`path`,`url`,`mime_type`,`size_bytes`,`width`,`height`,`disk`,`folder`,`created_at`,`updated_at`) VALUES
(1,  2, 'homepage-hero.jpg',         'media/banners/homepage-hero.jpg',      'https://cdn.zingdates.app/media/banners/homepage-hero.jpg',       'image/jpeg', 245120, 1920, 1080, 's3', 'banners',    '2025-01-15 10:00:00', '2026-06-01 10:00:00'),
(2,  2, 'speed-dating-london.jpg',   'media/events/speed-dating-london.jpg', 'https://cdn.zingdates.app/media/events/speed-dating-london.jpg',  'image/jpeg', 189440, 1200, 800,  's3', 'events',     '2026-05-01 10:00:00', '2026-05-01 10:00:00'),
(3,  3, 'hiking-mumbai.jpg',         'media/events/hiking-mumbai.jpg',       'https://cdn.zingdates.app/media/events/hiking-mumbai.jpg',        'image/jpeg', 203776, 1200, 800,  's3', 'events',     '2026-05-15 09:00:00', '2026-05-15 09:00:00'),
(4,  2, 'app-store-badge.png',       'media/assets/app-store-badge.png',     'https://cdn.zingdates.app/media/assets/app-store-badge.png',      'image/png',   18432, 564,  168,  's3', 'assets',     '2024-06-01 00:00:00', '2024-06-01 00:00:00'),
(5,  2, 'google-play-badge.png',     'media/assets/google-play-badge.png',   'https://cdn.zingdates.app/media/assets/google-play-badge.png',    'image/png',   20480, 564,  168,  's3', 'assets',     '2024-06-01 00:00:00', '2024-06-01 00:00:00'),
(6,  2, 'premium-gala-banner.jpg',   'media/events/premium-gala.jpg',        'https://cdn.zingdates.app/media/events/premium-gala.jpg',         'image/jpeg', 312320, 1200, 800,  's3', 'events',     '2026-06-10 12:00:00', '2026-06-10 12:00:00'),
(7,  1, 'blog-profile-tips.jpg',     'media/blog/blog-profile-tips.jpg',     'https://cdn.zingdates.app/media/blog/blog-profile-tips.jpg',      'image/jpeg', 156672, 1200, 630,  's3', 'blog',       '2025-05-28 09:00:00', '2025-05-28 09:00:00'),
(8,  2, 'blog-events-story.jpg',     'media/blog/blog-events-story.jpg',     'https://cdn.zingdates.app/media/blog/blog-events-story.jpg',      'image/jpeg', 141312, 1200, 630,  's3', 'blog',       '2025-09-10 10:00:00', '2025-09-10 10:00:00');


-- ============================================================
-- APP CONFIG  (mobile/public client config)
-- ============================================================
INSERT INTO `app_config` (`id`,`key`,`value`,`group`,`type`,`is_public`,`created_at`,`updated_at`) VALUES
(1,  'app_version_min_android',  '2.5.0',                    'mobile',      'string',  1, '2024-01-01 00:00:00', '2026-06-01 00:00:00'),
(2,  'app_version_min_ios',      '2.5.1',                    'mobile',      'string',  1, '2024-01-01 00:00:00', '2026-06-01 00:00:00'),
(3,  'app_version_latest',       '3.0.0',                    'mobile',      'string',  1, '2024-01-01 00:00:00', '2026-04-01 00:00:00'),
(4,  'coin_pack_options',        '[{"coins":100,"price":149},{"coins":250,"price":349},{"coins":500,"price":599},{"coins":1000,"price":999}]', 'coins', 'json', 1, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(5,  'gift_options',             '[{"id":1,"name":"Rose","coins":5},{"id":2,"name":"Heart","coins":10},{"id":3,"name":"Diamond","coins":50},{"id":4,"name":"Crown","coins":100}]', 'coins', 'json', 1, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(6,  'onboarding_screens',       '["welcome","photos","interests","location","notifications"]', 'mobile', 'json', 1, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(7,  'support_chat_enabled',     '1',                        'support',     'boolean', 1, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(8,  'razorpay_key_public',      'rzp_test_XXXXXXXXXXXXXXXX','payments',    'string',  1, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(9,  'firebase_vapid_key',       'test_vapid_key_placeholder','integrations','string', 0, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(10, 'max_profile_photos',       '6',                        'users',       'integer', 1, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(11, 'event_search_radius_km',   '50',                       'events',      'integer', 1, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(12, 'discovery_default_radius', '25',                       'matching',    'integer', 1, '2024-01-01 00:00:00', '2024-01-01 00:00:00');


-- ============================================================
-- API KEYS  (third-party / internal integration keys)
-- ============================================================
INSERT INTO `api_keys` (`id`,`name`,`key`,`secret`,`type`,`permissions`,`is_active`,`ip_whitelist`,`request_count`,`rate_limit_per_minute`,`last_used_at`,`expires_at`,`created_by`,`created_at`,`updated_at`) VALUES
(1, 'Mobile App — Android',    'pk_android_zd_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', NULL,                                              'public',  '["users:read","events:read","plans:read","config:read"]',    1, NULL,              412850, 120, '2026-06-28 12:00:00', NULL,                  1, '2024-06-01 00:00:00', '2026-06-28 12:00:00'),
(2, 'Mobile App — iOS',        'pk_ios_zd_test_q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7',    NULL,                                              'public',  '["users:read","events:read","plans:read","config:read"]',    1, NULL,              389210, 120, '2026-06-28 11:30:00', NULL,                  1, '2024-06-01 00:00:00', '2026-06-28 11:30:00'),
(3, 'Admin Dashboard',         'sk_admin_zd_test_h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7', 'whsec_admin_secret_placeholder_32chars_long_1234', 'admin',   '["*"]',                                                      1, '192.168.1.0/24',  8920,   300, '2026-06-28 10:00:00', NULL,                  1, '2024-06-01 00:00:00', '2026-06-28 10:00:00'),
(4, 'Webhook Sender Service',  'sk_webhook_zd_test_y1z2a3b4c5d6e7f8g9h0i1j2k3l4m5n6', 'whsec_webhook_secret_placeholder_32chars_5678',   'private', '["webhooks:trigger"]',                                       1, NULL,              1204,   60,  '2026-06-27 18:00:00', NULL,                  1, '2024-06-01 00:00:00', '2026-06-27 18:00:00'),
(5, 'Analytics Integration',   'pk_analytics_zd_test_o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5', NULL,                                              'private', '["users:count","events:stats","transactions:stats"]',         1, '10.0.0.0/8',     320,    30,  '2026-06-25 09:00:00', '2027-06-01 00:00:00', 2, '2026-01-01 00:00:00', '2026-06-25 09:00:00'),
(6, 'Legacy v1 API Key',       'pk_legacy_zd_test_d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6',  NULL,                                              'public',  '["users:read"]',                                             0, NULL,              50100,  60,  '2025-12-01 00:00:00', '2026-01-01 00:00:00', 1, '2024-01-01 00:00:00', '2026-01-01 00:00:00');


-- ============================================================
-- WEBHOOKS  (outbound event notifications)
-- ============================================================
INSERT INTO `webhooks` (`id`,`name`,`url`,`events`,`secret`,`is_active`,`success_count`,`failure_count`,`last_triggered_at`,`last_response`,`created_at`,`updated_at`) VALUES
(1, 'CRM — New User Registered',       'https://crm.internal/hooks/zingdates/new-user',         '["user.registered","user.verified"]',                          'whsec_crm_placeholder_secret_001',     1, 3210, 12, '2026-06-28 07:30:00', '{"status":200,"body":"ok"}',        '2025-01-01 00:00:00', '2026-06-28 07:30:00'),
(2, 'Analytics — Subscription Events', 'https://analytics.internal/hooks/subscriptions',         '["subscription.created","subscription.cancelled","subscription.renewed"]', 'whsec_analytics_secret_002', 1, 580,  3,  '2026-06-18 02:05:00', '{"status":200,"body":"received"}',  '2025-01-01 00:00:00', '2026-06-18 02:05:00'),
(3, 'Slack — Safety Alerts',           'https://hooks.slack.internal/services/T00/B00/XXXX',    '["user.reported","user.suspended"]',                           'whsec_slack_safety_secret_003',        1, 5,    0,  '2026-06-22 09:30:00', '{"status":200,"body":"ok"}',        '2025-06-01 00:00:00', '2026-06-22 09:30:00'),
(4, 'Payment Reconciliation Service',  'https://payments.internal/hooks/zingdates',              '["transaction.completed","transaction.refunded","transaction.failed"]', 'whsec_payment_recon_secret_004', 1, 124,  1,  '2026-06-28 09:00:00', '{"status":200,"body":"ack"}',       '2025-01-01 00:00:00', '2026-06-28 09:00:00'),
(5, 'Email Service — Event Reminders', 'https://email.internal/hooks/event-reminders',           '["event.reminder_due"]',                                       'whsec_email_events_secret_005',        0, 890,  22, '2026-06-15 08:00:00', '{"status":503,"body":"down"}',      '2025-03-01 00:00:00', '2026-06-15 08:00:00');


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  IMPORT COMPLETE
--
--  Summary:
--    Users           : 15  (4 staff + 11 regular)
--    Plans           : 4
--    Subscriptions   : 6
--    Transactions    : 10
--    Coin Ledger     : 15
--    Events          : 6
--    Registrations   : 10
--    Connections     : 12
--    Conversations   : 5
--    Messages        : 20
--    Calls           : 8
--    Groups          : 3
--    Group Members   : 17
--    Notifications   : 10
--    Device Tokens   : 5
--    Support Tickets : 5  (with 10 replies)
--    User Reports    : 3
--    Campaigns       : 3
--    Coupon Codes    : 5
--    SEO Pages       : 8
--    SEO Redirects   : 6
--    Blog Posts      : 4
--    CMS Pages       : 5
--    Media Files     : 8
--    Feature Flags   : 8
--    Settings        : 15
--    App Config      : 12
--    App Versions    : 6
--    API Keys        : 6
--    Webhooks        : 5
--    Audit Logs      : 10
--
--  Login credentials:
--    super_admin  admin@zingdates.app / Admin@123!
--    admin        sarah@zingdates.app / Password@123
--    All others   Password@123
-- ============================================================
