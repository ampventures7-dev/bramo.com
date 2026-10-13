-- ==============================================================================
-- bhramo.com — Supabase Seed Data
-- 5 Sample Hotels (3 in Dapoli, 2 in Harnai) with 2 Room Types Each
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED PROFILES (SAMPLE OWNERS & ADMIN)
-- ------------------------------------------------------------------------------
-- Fixed deterministic UUIDs for seed referencing
INSERT INTO public.profiles (id, name, phone, role)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Suresh Kadam (Dapoli Host)', '+91 94223 88200', 'owner'),
  ('a2222222-2222-2222-2222-222222222222', 'Pravin Joshi (Harnai Host)', '+91 98234 11001', 'owner'),
  ('a3333333-3333-3333-3333-333333333333', 'Bhramo Platform Admin', '+91 98765 43210', 'admin')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role;

-- ------------------------------------------------------------------------------
-- 2. SEED HOTELS (3 in Dapoli, 2 in Harnai)
-- ------------------------------------------------------------------------------
-- Hotel 1 (Dapoli): Murud Beach Palms Resort
INSERT INTO public.hotels (
  id, owner_id, name, area, address, lat, lng, description, amenities, checkin_time, checkout_time, status
) VALUES (
  'b1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  'Murud Beach Palms Resort',
  'Dapoli',
  'Murud Beach Road, Murud, Taluka Dapoli, Ratnagiri 415712',
  17.7733000,
  73.1189000,
  'Surrounded by swaying coconut and betel nut (supari wadi) plantations in Dapoli. Just a 2-minute walk to Murud Beach, famous for water sports and morning dolphin watching boat safaris.',
  ARRAY['Beach Access (150m)', 'AC Rooms', 'Konkani Ukadiche Modak', 'Free Wi-Fi', 'Power Backup', 'Free Parking', 'Pet Friendly'],
  '12:00 PM',
  '10:00 AM',
  'approved'
) ON CONFLICT (id) DO NOTHING;

-- Hotel 2 (Dapoli): Ladghar Tamas Sunset Resort
INSERT INTO public.hotels (
  id, owner_id, name, area, address, lat, lng, description, amenities, checkin_time, checkout_time, status
) VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'a1111111-1111-1111-1111-111111111111',
  'Ladghar Tamas Sunset Resort',
  'Dapoli',
  'Tamas Tirtha Road, Ladghar Beach, Dapoli 415712',
  17.7335000,
  73.1332000,
  'Situated right on Ladghar Beach, renowned for its red-pebble shoreline (Tamas Tirtha) and fiery sunsets. Experience authentic home-style Surmai and Pomfret thalis with fresh Solkadhi.',
  ARRAY['Direct Beachfront', 'Sunset Deck', 'Fresh Malvani Seafood', 'Hot Water Geyser', 'Car & Bike Parking', 'Power Backup'],
  '01:00 PM',
  '10:30 AM',
  'approved'
) ON CONFLICT (id) DO NOTHING;

-- Hotel 3 (Dapoli): Karde Golden Sands Cottages
INSERT INTO public.hotels (
  id, owner_id, name, area, address, lat, lng, description, amenities, checkin_time, checkout_time, status
) VALUES (
  'b3333333-3333-3333-3333-333333333333',
  'a1111111-1111-1111-1111-111111111111',
  'Karde Golden Sands Cottages',
  'Dapoli',
  'Karde Beach Village, Post Murud, Taluka Dapoli 415712',
  17.7550000,
  73.1250000,
  'Traditional red laterite stone (chira) eco-cottages nestled right next to the gentle waves of Karde beach. Quiet, pristine, and ideal for peaceful family holidays and dolphin spotting from the shore.',
  ARRAY['Direct Beach Access', 'Laterite Stone Architecture', 'Pure Veg & Seafood Kitchens', 'Hammocks under Trees', 'Children Play Area'],
  '12:00 PM',
  '10:00 AM',
  'approved'
) ON CONFLICT (id) DO NOTHING;

-- Hotel 4 (Harnai): Suvarnadurg Coastal Haven
INSERT INTO public.hotels (
  id, owner_id, name, area, address, lat, lng, description, amenities, checkin_time, checkout_time, status
) VALUES (
  'b4444444-4444-4444-4444-444444444444',
  'a2222222-2222-2222-2222-222222222222',
  'Suvarnadurg Coastal Haven',
  'Harnai',
  'Bunder Road, Near Fish Market, Harnai Port, Ratnagiri 415713',
  17.8136000,
  73.0911000,
  'Directly facing the historic Suvarnadurg sea fort and Harnai harbor. Guests can watch traditional fishing trawlers return and savor the freshest fish auctions in Maharashtra.',
  ARRAY['Sea View Balconies', 'Direct Seafront Facing Fort', 'Fresh Fish Market Access', 'Free Wi-Fi', '24/7 Hot Water', 'Power Backup'],
  '12:30 PM',
  '10:00 AM',
  'approved'
) ON CONFLICT (id) DO NOTHING;

-- Hotel 5 (Harnai): Harnai Cliff & Lighthouse Retreat
INSERT INTO public.hotels (
  id, owner_id, name, area, address, lat, lng, description, amenities, checkin_time, checkout_time, status
) VALUES (
  'b5555555-5555-5555-5555-555555555555',
  'a2222222-2222-2222-2222-222222222222',
  'Harnai Cliff & Lighthouse Retreat',
  'Harnai',
  'Lighthouse Point Road, Harnai, Ratnagiri District 415713',
  17.8210000,
  73.0950000,
  'Elevated cliffside retreat offering 270-degree panoramic views of the Arabian Sea and Harnai lighthouse. Cool evening sea breezes, starlit Konkan skies, and pure serenity.',
  ARRAY['Lighthouse Sea Panorama', 'AC Rooms', 'Solkadhi & Rice Bhakri Meals', 'Private Sunset Patio', 'Secure Parking'],
  '01:00 PM',
  '11:00 AM',
  'approved'
) ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 3. SEED ROOM TYPES (2 ROOM TYPES EACH = 10 TOTAL)
-- ------------------------------------------------------------------------------
-- Hotel 1 (Murud Beach Palms Resort) Room Types
INSERT INTO public.room_types (
  id, hotel_id, name, is_ac, capacity, base_price, weekend_price, amenities, total_rooms
) VALUES
(
  'c1111111-1111-1111-1111-111111111111',
  'b1111111-1111-1111-1111-111111111111',
  'Deluxe Coconut Garden AC Room',
  true,
  2,
  2600.00,
  3100.00,
  ARRAY['Queen Bed', 'Split AC', 'Garden View Balcony', 'Geyser', 'Free Wi-Fi'],
  6
),
(
  'c1111111-2222-2222-2222-222222222222',
  'b1111111-1111-1111-1111-111111111111',
  'Family Sea-Breeze Quad Suite',
  true,
  4,
  4200.00,
  4900.00,
  ARRAY['2 King Beds', 'Split AC', 'Large Balcony', 'Electric Kettle', 'Smart TV'],
  4
) ON CONFLICT (id) DO NOTHING;

-- Hotel 2 (Ladghar Tamas Sunset Resort) Room Types
INSERT INTO public.room_types (
  id, hotel_id, name, is_ac, capacity, base_price, weekend_price, amenities, total_rooms
) VALUES
(
  'c2222222-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'Tamas Sunset View AC Room',
  true,
  2,
  3200.00,
  3800.00,
  ARRAY['King Bed', 'AC', 'Private Sunset Patio', 'Hot Water', 'Coffee Maker'],
  5
),
(
  'c2222222-2222-2222-2222-222222222222',
  'b2222222-2222-2222-2222-222222222222',
  'Beachfront Laterite Villa',
  false,
  4,
  3600.00,
  4300.00,
  ARRAY['Natural Cooling Chira Walls', 'Direct Beach Access', 'Spacious Veranda', '2 Double Beds'],
  3
) ON CONFLICT (id) DO NOTHING;

-- Hotel 3 (Karde Golden Sands Cottages) Room Types
INSERT INTO public.room_types (
  id, hotel_id, name, is_ac, capacity, base_price, weekend_price, amenities, total_rooms
) VALUES
(
  'c3333333-1111-1111-1111-111111111111',
  'b3333333-3333-3333-3333-333333333333',
  'Traditional Eco Chira Cottage',
  false,
  2,
  1900.00,
  2300.00,
  ARRAY['Queen Bed', 'Ceiling Fan', 'Attached Western Bath', 'Solar Hot Water', 'Veranda Hammock'],
  8
),
(
  'c3333333-2222-2222-2222-222222222222',
  'b3333333-3333-3333-3333-333333333333',
  'Deluxe Oceanfront AC Cottage',
  true,
  3,
  2700.00,
  3300.00,
  ARRAY['King Bed + Extra Mattress', 'Split AC', 'Full Ocean View', 'Work Desk'],
  4
) ON CONFLICT (id) DO NOTHING;

-- Hotel 4 (Suvarnadurg Coastal Haven) Room Types
INSERT INTO public.room_types (
  id, hotel_id, name, is_ac, capacity, base_price, weekend_price, amenities, total_rooms
) VALUES
(
  'c4444444-1111-1111-1111-111111111111',
  'b4444444-4444-4444-4444-444444444444',
  'Suvarnadurg Sea Fort View AC Suite',
  true,
  2,
  2400.00,
  2900.00,
  ARRAY['King Bed', 'AC', 'Unobstructed Fort View Balcony', 'Geyser', 'Wi-Fi'],
  6
),
(
  'c4444444-2222-2222-2222-222222222222',
  'b4444444-4444-4444-4444-444444444444',
  'Harnai Bunder Family Harbor Room',
  false,
  4,
  2800.00,
  3400.00,
  ARRAY['2 Queen Beds', 'High Speed Ceiling Fans', 'Harbor View', 'Attached Bath'],
  4
) ON CONFLICT (id) DO NOTHING;

-- Hotel 5 (Harnai Cliff & Lighthouse Retreat) Room Types
INSERT INTO public.room_types (
  id, hotel_id, name, is_ac, capacity, base_price, weekend_price, amenities, total_rooms
) VALUES
(
  'c5555555-1111-1111-1111-111111111111',
  'b5555555-5555-5555-5555-555555555555',
  'Lighthouse Panoramic AC Room',
  true,
  2,
  2600.00,
  3100.00,
  ARRAY['King Bed', 'Inverter AC', '270° Ocean Panorama', 'Electric Kettle', 'Free Wi-Fi'],
  5
),
(
  'c5555555-2222-2222-2222-222222222222',
  'b5555555-5555-5555-5555-555555555555',
  'Cliffside Konkani Suite',
  true,
  4,
  3900.00,
  4600.00,
  ARRAY['2 King Beds', 'Split AC', 'Private Sun Deck', 'Modern Bath', 'Tea/Coffee Setup'],
  3
) ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 4. SEED ROOM IMAGES (COMPRESSED / WEBP PHOTO ASSETS)
-- ------------------------------------------------------------------------------
INSERT INTO public.room_images (room_type_id, hotel_id, url, sort_order)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', 0),
  ('c1111111-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', 1),
  ('c2222222-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', 0),
  ('c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', 1),
  ('c3333333-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80', 0),
  ('c3333333-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', 1),
  ('c4444444-1111-1111-1111-111111111111', 'b4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80', 0),
  ('c4444444-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80', 1),
  ('c5555555-1111-1111-1111-111111111111', 'b5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80', 0),
  ('c5555555-2222-2222-2222-222222222222', 'b5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 1)
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 5. SEED SAMPLE REVIEWS
-- ------------------------------------------------------------------------------
INSERT INTO public.reviews (hotel_id, guest_id, rating, comment)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 5, 'Murud beach is just 2 mins away! The coconut grove setting and ukadiche modak in the morning were unforgettable.'),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 5, 'The sunset from Ladghar Tamas Tirtha beach is unreal. Authentic Surmai fish thali was fresh and delicious.'),
  ('b4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 5, 'Direct view of Suvarnadurg fort from the room! Loved the morning stroll to Harnai fish auction.')
ON CONFLICT (id) DO NOTHING;
