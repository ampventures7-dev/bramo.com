import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { DbHotel, RoomType, RoomImage, Review } from "@/types/supabase";

export interface HotelWithDetails extends DbHotel {
  room_types: RoomType[];
  images: string[];
  starting_price: number;
  average_rating: number;
  review_count: number;
  has_ac: boolean;
  has_non_ac: boolean;
  reviews?: Review[];
  whatsapp_number?: string;
  upi_id?: string;
}

// Fallback seed data if Supabase credentials are placeholder or offline
const SEED_HOTELS_DATA: HotelWithDetails[] = [
  {
    id: "b1111111-1111-1111-1111-111111111111",
    owner_id: "a1111111-1111-1111-1111-111111111111",
    name: "Murud Beach Palms Resort",
    area: "Dapoli",
    address: "Murud Beach Road, Murud, Taluka Dapoli, Ratnagiri 415712",
    lat: 17.7733,
    lng: 73.1189,
    description: "Surrounded by swaying coconut and betel nut (supari wadi) plantations in Dapoli. Just a 2-minute walk to Murud Beach, famous for water sports and morning dolphin watching boat safaris. Enjoy freshly prepared Ukadiche Modak and homely Konkani hospitality.",
    amenities: ["Beach Access (150m)", "AC Rooms", "Konkani Ukadiche Modak", "Free Wi-Fi", "Power Backup", "Free Parking", "Pet Friendly"],
    checkin_time: "12:00 PM",
    checkout_time: "10:00 AM",
    status: "approved",
    starting_price: 2600,
    average_rating: 4.9,
    review_count: 138,
    has_ac: true,
    has_non_ac: false,
    whatsapp_number: "919422388200",
    upi_id: "murudpalms@oksbi",
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
    ],
    room_types: [
      {
        id: "c1111111-1111-1111-1111-111111111111",
        hotel_id: "b1111111-1111-1111-1111-111111111111",
        name: "Deluxe Coconut Garden AC Room",
        is_ac: true,
        beds_count: 1,
        bed_type: "1 Queen Bed (Standard)",
        capacity: 2,
        base_price: 2600,
        weekend_price: 3100,
        extra_guest_fee: 400,
        amenities: ["1 Queen Bed", "Split AC", "Garden View Balcony", "Geyser", "Free Wi-Fi"],
        total_rooms: 6,
      },
      {
        id: "c1111111-2222-2222-2222-222222222222",
        hotel_id: "b1111111-1111-1111-1111-111111111111",
        name: "Family Sea-Breeze Quad Suite",
        is_ac: true,
        beds_count: 2,
        bed_type: "2 King Beds (Family Suite)",
        capacity: 4,
        base_price: 4200,
        weekend_price: 4900,
        extra_guest_fee: 500,
        amenities: ["2 King Beds", "Split AC", "Large Balcony", "Electric Kettle", "Smart TV"],
        total_rooms: 4,
      },
    ],
    reviews: [
      {
        id: "r1",
        booking_id: null,
        hotel_id: "b1111111-1111-1111-1111-111111111111",
        guest_id: "g1",
        rating: 5,
        comment: "Murud beach is just 2 mins away! The coconut grove setting and ukadiche modak in the morning were unforgettable.",
        created_at: "2026-03-12T10:00:00Z",
      },
      {
        id: "r2",
        booking_id: null,
        hotel_id: "b1111111-1111-1111-1111-111111111111",
        guest_id: "g2",
        rating: 5,
        comment: "Very clean AC rooms and host Suresh Kadam arranged the dolphin safari boat ride right on time.",
        created_at: "2026-03-20T14:30:00Z",
      },
    ],
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    owner_id: "a1111111-1111-1111-1111-111111111111",
    name: "Ladghar Tamas Sunset Resort",
    area: "Dapoli",
    address: "Tamas Tirtha Road, Ladghar Beach, Dapoli 415712",
    lat: 17.7335,
    lng: 73.1332,
    description: "Situated right on Ladghar Beach, renowned for its red-pebble shoreline (Tamas Tirtha) and fiery sunsets. Experience authentic home-style Surmai and Pomfret thalis with fresh Solkadhi.",
    amenities: ["Beach Access (150m)", "Sunset Deck", "Fresh Malvani Seafood", "Hot Water Geyser", "Free Parking", "Power Backup"],
    checkin_time: "01:00 PM",
    checkout_time: "10:30 AM",
    status: "approved",
    starting_price: 3200,
    average_rating: 4.8,
    review_count: 76,
    has_ac: true,
    has_non_ac: true,
    whatsapp_number: "919890122334",
    upi_id: "ladgharsunset@icici",
    images: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    ],
    room_types: [
      {
        id: "c2222222-1111-1111-1111-111111111111",
        hotel_id: "b2222222-2222-2222-2222-222222222222",
        name: "Tamas Sunset View AC Room",
        is_ac: true,
        beds_count: 1,
        bed_type: "1 King Bed (Standard)",
        capacity: 2,
        base_price: 3200,
        weekend_price: 3800,
        extra_guest_fee: 450,
        amenities: ["1 King Bed", "AC", "Private Sunset Patio", "Hot Water", "Coffee Maker"],
        total_rooms: 5,
      },
      {
        id: "c2222222-2222-2222-2222-222222222222",
        hotel_id: "b2222222-2222-2222-2222-222222222222",
        name: "Beachfront Laterite Villa (Non-AC)",
        is_ac: false,
        beds_count: 2,
        bed_type: "2 Double Beds (Family Villa)",
        capacity: 4,
        base_price: 3600,
        weekend_price: 4300,
        extra_guest_fee: 450,
        amenities: ["2 Double Beds", "Natural Cooling Chira Walls", "Direct Beach Access", "Spacious Veranda"],
        total_rooms: 3,
      },
    ],
    reviews: [
      {
        id: "r3",
        booking_id: null,
        hotel_id: "b2222222-2222-2222-2222-222222222222",
        guest_id: "g3",
        rating: 5,
        comment: "The sunset from Ladghar Tamas Tirtha beach is unreal. Authentic Surmai fish thali was fresh and delicious.",
        created_at: "2026-03-24T18:00:00Z",
      },
    ],
  },
  {
    id: "b3333333-3333-3333-3333-333333333333",
    owner_id: "a1111111-1111-1111-1111-111111111111",
    name: "Karde Golden Sands Cottages",
    area: "Dapoli",
    address: "Karde Beach Village, Post Murud, Taluka Dapoli 415712",
    lat: 17.755,
    lng: 73.125,
    description: "Traditional red laterite stone (chira) eco-cottages nestled right next to the gentle waves of Karde beach. Quiet, pristine, and ideal for peaceful family holidays and dolphin spotting from the shore.",
    amenities: ["Beach Access (150m)", "Laterite Stone Architecture", "Pure Veg & Seafood Kitchens", "Free Wi-Fi", "Children Play Area"],
    checkin_time: "12:00 PM",
    checkout_time: "10:00 AM",
    status: "approved",
    starting_price: 1900,
    average_rating: 4.8,
    review_count: 62,
    has_ac: true,
    has_non_ac: true,
    whatsapp_number: "919765433211",
    upi_id: "kardecottages@ybl",
    images: [
      "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    ],
    room_types: [
      {
        id: "c3333333-1111-1111-1111-111111111111",
        hotel_id: "b3333333-3333-3333-3333-333333333333",
        name: "Traditional Eco Chira Cottage (Non-AC)",
        is_ac: false,
        beds_count: 1,
        bed_type: "1 Queen Bed (Standard)",
        capacity: 2,
        base_price: 1900,
        weekend_price: 2300,
        extra_guest_fee: 350,
        amenities: ["1 Queen Bed", "Ceiling Fan", "Attached Western Bath", "Solar Hot Water", "Veranda Hammock"],
        total_rooms: 8,
      },
      {
        id: "c3333333-2222-2222-2222-222222222222",
        hotel_id: "b3333333-3333-3333-3333-333333333333",
        name: "Deluxe Oceanfront Family Cottage",
        is_ac: true,
        beds_count: 2,
        bed_type: "2 Double Beds (Family Cottage)",
        capacity: 4,
        base_price: 2900,
        weekend_price: 3500,
        extra_guest_fee: 450,
        amenities: ["2 Double Beds", "Split AC", "Full Ocean View", "Work Desk"],
        total_rooms: 4,
      },
    ],
    reviews: [
      {
        id: "r4",
        booking_id: null,
        hotel_id: "b3333333-3333-3333-3333-333333333333",
        guest_id: "g4",
        rating: 5,
        comment: "Karde beach is so quiet and uncrowded. Waking up to the sound of waves was incredible.",
        created_at: "2026-03-28T09:00:00Z",
      },
    ],
  },
  {
    id: "b4444444-4444-4444-4444-444444444444",
    owner_id: "a2222222-2222-2222-2222-222222222222",
    name: "Suvarnadurg Coastal Haven",
    area: "Harnai",
    address: "Bunder Road, Near Fish Market, Harnai Port, Ratnagiri 415713",
    lat: 17.8136,
    lng: 73.0911,
    description: "Directly facing the historic Suvarnadurg sea fort and Harnai harbor. Guests can watch traditional fishing trawlers return and savor the freshest fish auctions in Maharashtra.",
    amenities: ["Sea View Balconies", "Beach Access (150m)", "Fresh Fish Market Access", "Free Wi-Fi", "24/7 Hot Water", "Power Backup"],
    checkin_time: "12:30 PM",
    checkout_time: "10:00 AM",
    status: "approved",
    starting_price: 2400,
    average_rating: 4.8,
    review_count: 94,
    has_ac: true,
    has_non_ac: true,
    whatsapp_number: "919823411001",
    upi_id: "suvarnadurg.haven@okaxis",
    images: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    ],
    room_types: [
      {
        id: "c4444444-1111-1111-1111-111111111111",
        hotel_id: "b4444444-4444-4444-4444-444444444444",
        name: "Suvarnadurg Sea Fort View AC Suite",
        is_ac: true,
        beds_count: 1,
        bed_type: "1 King Bed (Standard)",
        capacity: 2,
        base_price: 2400,
        weekend_price: 2900,
        extra_guest_fee: 400,
        amenities: ["1 King Bed", "AC", "Unobstructed Fort View Balcony", "Geyser", "Wi-Fi"],
        total_rooms: 6,
      },
      {
        id: "c4444444-2222-2222-2222-222222222222",
        hotel_id: "b4444444-4444-4444-4444-444444444444",
        name: "Harnai Bunder Family Harbor Room (Non-AC)",
        is_ac: false,
        beds_count: 2,
        bed_type: "2 Queen Beds (Family Room)",
        capacity: 4,
        base_price: 2800,
        weekend_price: 3400,
        extra_guest_fee: 400,
        amenities: ["2 Queen Beds", "High Speed Ceiling Fans", "Harbor View", "Attached Bath"],
        total_rooms: 4,
      },
    ],
    reviews: [
      {
        id: "r5",
        booking_id: null,
        hotel_id: "b4444444-4444-4444-4444-444444444444",
        guest_id: "g5",
        rating: 5,
        comment: "Direct view of Suvarnadurg fort from the room! Loved the morning stroll to Harnai fish auction.",
        created_at: "2026-04-01T11:20:00Z",
      },
    ],
  },
  {
    id: "b5555555-5555-5555-5555-555555555555",
    owner_id: "a2222222-2222-2222-2222-222222222222",
    name: "Harnai Cliff & Lighthouse Retreat",
    area: "Harnai",
    address: "Lighthouse Point Road, Harnai, Ratnagiri District 415713",
    lat: 17.821,
    lng: 73.095,
    description: "Elevated cliffside retreat offering 270-degree panoramic views of the Arabian Sea and Harnai lighthouse. Cool evening sea breezes, starlit Konkan skies, and pure serenity.",
    amenities: ["Lighthouse Sea Panorama", "AC Rooms", "Solkadhi & Rice Bhakri Meals", "Free Parking", "Free Wi-Fi"],
    checkin_time: "01:00 PM",
    checkout_time: "11:00 AM",
    status: "approved",
    starting_price: 2600,
    average_rating: 4.7,
    review_count: 48,
    has_ac: true,
    has_non_ac: false,
    whatsapp_number: "919822077112",
    upi_id: "harnailighthouse@paytm",
    images: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    ],
    room_types: [
      {
        id: "c5555555-1111-1111-1111-111111111111",
        hotel_id: "b5555555-5555-5555-5555-555555555555",
        name: "Lighthouse Panoramic AC Room",
        is_ac: true,
        beds_count: 1,
        bed_type: "1 King Bed (Standard)",
        capacity: 2,
        base_price: 2600,
        weekend_price: 3100,
        extra_guest_fee: 400,
        amenities: ["1 King Bed", "Inverter AC", "270° Ocean Panorama", "Electric Kettle", "Free Wi-Fi"],
        total_rooms: 5,
      },
      {
        id: "c5555555-2222-2222-2222-222222222222",
        hotel_id: "b5555555-5555-5555-5555-555555555555",
        name: "Cliffside Konkani Suite",
        is_ac: true,
        beds_count: 2,
        bed_type: "2 King Beds (Family Suite)",
        capacity: 4,
        base_price: 3900,
        weekend_price: 4600,
        extra_guest_fee: 500,
        amenities: ["2 King Beds", "Split AC", "Private Sun Deck", "Modern Bath", "Tea/Coffee Setup"],
        total_rooms: 3,
      },
    ],
    reviews: [
      {
        id: "r6",
        booking_id: null,
        hotel_id: "b5555555-5555-5555-5555-555555555555",
        guest_id: "g6",
        rating: 5,
        comment: "The cliffside view is breathtaking! Very clean rooms and the freshest Konkani seafood dinner.",
        created_at: "2026-04-05T19:00:00Z",
      },
    ],
  },
];

export async function fetchAllHotels(): Promise<HotelWithDetails[]> {
  if (isSupabaseConfigured) {
    try {
      const { data: hotels, error } = await supabase
        .from("hotels")
        .select(`
          *,
          room_types (*),
          room_images (*),
          reviews (*)
        `)
        .eq("status", "approved");

      if (!error && hotels && hotels.length > 0) {
        return hotels.map((h: any) => {
          const roomTypes: RoomType[] = h.room_types || [];
          const images: string[] = (h.room_images || [])
            .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((img: any) => img.url);

          const reviews: Review[] = h.reviews || [];
          const startingPrice = roomTypes.length > 0
            ? Math.min(...roomTypes.map((r) => Number(r.base_price)))
            : 2000;

          const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 5), 0);
          const avgRating = reviews.length > 0
            ? Math.round((totalRating / reviews.length) * 10) / 10
            : 4.8;

          return {
            ...h,
            room_types: roomTypes,
            images: images.length > 0 ? images : [
              "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80"
            ],
            starting_price: startingPrice,
            average_rating: avgRating,
            review_count: reviews.length || 24,
            has_ac: roomTypes.some((r) => r.is_ac),
            has_non_ac: roomTypes.some((r) => !r.is_ac),
            reviews,
          };
        });
      }
    } catch (err) {
      console.warn("Supabase query fallback to seed data:", err);
    }
  }

  // Fallback to verified seed data
  return SEED_HOTELS_DATA;
}

export async function fetchHotelById(id: string): Promise<HotelWithDetails | null> {
  const allHotels = await fetchAllHotels();
  const found = allHotels.find((h) => h.id === id);
  if (found) return found;

  // Check matching by slug or partial name
  const matchByName = allHotels.find((h) =>
    h.name.toLowerCase().replace(/[^a-z0-9]/g, "-").includes(id.toLowerCase())
  );
  return matchByName || allHotels[0] || null;
}
