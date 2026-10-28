-- ==============================================================================
-- bhramo.com — Real Property Insertion
-- Property: Appas Beach Resort (Palande Beach, Dapoli)
-- ==============================================================================

-- 1. Insert Hotel
INSERT INTO public.hotels (
  id,
  name,
  area,
  address,
  lat,
  lng,
  description,
  amenities,
  checkin_time,
  checkout_time,
  status,
  whatsapp_number,
  upi_id,
  commission_rate
) VALUES (
  'b1111111-9999-9999-9999-000000000001',
  'Appas Beach Resort',
  'Dapoli',
  'Palande Beach Road, Near Murud-Harnai Coastal Stretch, Taluka Dapoli 415713',
  17.7960,
  73.1040,
  'Nestled right along pristine Palande Beach with direct beach touch through a serene canopy of coastal trees and lush greenery. Experience true Konkan homestay warmth with peaceful coastal vibes. In-house restaurant with fresh home-style Konkani thalis and fresh seafood prepared on demand (no breakfast included in homestay).',
  ARRAY[
    'Palande Beach Touch (<50m)',
    'Lush Coastal Greenery',
    'Authentic Konkan Vibe',
    'In-House Restaurant',
    'Fresh Food on Demand',
    'Surmai & Pomfret Meals',
    'Free Private Parking',
    'Hot Water (Geyser)',
    'Power Backup'
  ],
  '12:00 PM',
  '10:30 AM',
  'approved',
  '917447568595',
  'appasresort@upi',
  15.00
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities;

-- 2. Insert Room Types
INSERT INTO public.room_types (
  id,
  hotel_id,
  name,
  is_ac,
  capacity,
  base_price,
  weekend_price,
  amenities,
  total_rooms
) VALUES 
(
  'c1111111-9999-9999-9999-000000000001',
  'b1111111-9999-9999-9999-000000000001',
  'Deluxe Beachside AC Cottage Room',
  true,
  3,
  2400.00,
  2800.00,
  ARRAY['Split AC', 'Direct Beach Path Access', 'Attached Western Bathroom', 'Geyser Hot Water', 'Greenery View'],
  4
),
(
  'c1111111-9999-9999-9999-000000000002',
  'b1111111-9999-9999-9999-000000000001',
  'Standard Palande Green Homestay Room (Non-AC)',
  false,
  2,
  1800.00,
  2100.00,
  ARRAY['High-speed Ceiling Fan', 'Natural Coastal Breeze', 'Attached Bathroom', 'Quiet Garden Ambience'],
  4
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert Room Images (Referencing Real Local Assets / CDN)
INSERT INTO public.room_images (
  hotel_id,
  url,
  sort_order
) VALUES 
  ('b1111111-9999-9999-9999-000000000001', '/hotels/appas-beach-resort/palande-beach-path.jpg', 0),
  ('b1111111-9999-9999-9999-000000000001', '/hotels/appas-beach-resort/driveway-greenery-cottage.jpg', 1),
  ('b1111111-9999-9999-9999-000000000001', '/hotels/appas-beach-resort/garden-hillside-palms.jpg', 2),
  ('b1111111-9999-9999-9999-000000000001', '/hotels/appas-beach-resort/exterior-cottage.jpg', 3),
  ('b1111111-9999-9999-9999-000000000001', '/hotels/appas-beach-resort/bedroom-deluxe.jpg', 4),
  ('b1111111-9999-9999-9999-000000000001', '/hotels/appas-beach-resort/bedroom-wooden.jpg', 5),
  ('b1111111-9999-9999-9999-000000000001', '/hotels/appas-beach-resort/beach-touch-sunset-trail.jpg', 6),
  ('b1111111-9999-9999-9999-000000000001', '/hotels/appas-beach-resort/room-mirror.jpg', 7);
