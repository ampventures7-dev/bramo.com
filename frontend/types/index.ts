export * from "./supabase";

export type LocationType = 'Dapoli' | 'Harnai';

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  location: LocationType;
  beachDistance: string;
  description: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  contactPhone: string;
  whatsappNumber: string;
  upiId: string;
  paymentOptions: ('pay_at_hotel' | 'upi_qr')[];
  address: string;
  featured?: boolean;
}

export interface BookingDetails {
  id?: string;
  hotelId: string;
  hotelName: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  guestsCount: number;
  roomsCount: number;
  totalPrice: number;
  paymentMethod: 'pay_at_hotel' | 'upi_qr';
  upiRefNumber?: string;
  specialRequests?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
