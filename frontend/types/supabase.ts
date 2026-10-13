export type UserRole = "guest" | "owner" | "admin";
export type HotelArea = "Dapoli" | "Harnai";
export type HotelStatus = "pending" | "approved" | "rejected";
export type BookingStatus = "requested" | "pending_verification" | "confirmed" | "cancelled" | "completed";
export type LedgerType = "received" | "refund" | "payout";

export interface PlatformSettings {
  id: string;
  upi_id: string;
  qr_image_url: string;
  business_name: string;
  default_booking_fee_percent: number;
  updated_at?: string;
}

export type OwnerApprovalStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  role: UserRole;
  approval_status?: OwnerApprovalStatus;
  hotel_name?: string;
  hotel_area?: string;
  created_at?: string;
}

export interface DbHotel {
  id: string;
  owner_id: string;
  name: string;
  area: HotelArea;
  address: string;
  lat: number;
  lng: number;
  description: string | null;
  amenities: string[];
  checkin_time: string;
  checkout_time: string;
  status: HotelStatus;
  booking_fee_percent?: number | null;
  commission_rate?: number;
  created_at?: string;
}

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  is_ac: boolean;
  beds_count?: number; // 1 = Standard / 1 bed (max 2 guests), 2 = 2 beds (max 4 guests)
  bed_type?: string;   // e.g. "1 Queen Bed", "2 King Beds"
  capacity: number;    // 2 for 1-bed room, 4 for 2-bed room
  base_price: number;
  weekend_price: number;
  extra_guest_fee?: number; // Comparative fee per additional guest per night
  amenities: string[];
  total_rooms: number;
  created_at?: string;
}

export interface RoomImage {
  id: string;
  room_type_id: string;
  hotel_id: string;
  url: string;
  sort_order: number;
  created_at?: string;
}

export interface Availability {
  id?: string;
  room_type_id: string;
  date: string; // YYYY-MM-DD
  rooms_available: number;
  price_override: number | null;
  created_at?: string;
}

export interface Booking {
  id: string;
  guest_id: string | null;
  hotel_id: string;
  room_type_id: string;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  guests: number;
  total_amount: number;
  advance_paid: number;
  booking_fee_amount: number;
  balance_amount: number;
  utr: string | null;
  screenshot_url?: string | null;
  status: BookingStatus;
  payment_id: string | null;
  hold_expires_at?: string | null;
  verification_expires_at?: string | null;
  created_at?: string;
}

export interface LedgerEntry {
  id: string;
  booking_id: string;
  type: LedgerType;
  amount: number;
  utr: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string | null;
  hotel_id: string;
  guest_id: string;
  rating: number; // 1 to 5
  comment: string | null;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      platform_settings: {
        Row: PlatformSettings;
        Insert: Omit<PlatformSettings, "updated_at"> & { updated_at?: string };
        Update: Partial<PlatformSettings>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at"> & { created_at?: string };
        Update: Partial<Omit<Profile, "id">>;
      };
      hotels: {
        Row: DbHotel;
        Insert: Omit<DbHotel, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<DbHotel, "id">>;
      };
      room_types: {
        Row: RoomType;
        Insert: Omit<RoomType, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<RoomType, "id">>;
      };
      room_images: {
        Row: RoomImage;
        Insert: Omit<RoomImage, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<RoomImage, "id">>;
      };
      availability: {
        Row: Availability;
        Insert: Omit<Availability, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Availability, "room_type_id" | "date">>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Booking, "id">>;
      };
      ledger: {
        Row: LedgerEntry;
        Insert: Omit<LedgerEntry, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<LedgerEntry, "id">>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Review, "id">>;
      };
    };
  };
}
