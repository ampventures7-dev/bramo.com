import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { DbHotel, UserRole, Profile, OwnerApprovalStatus } from "@/types/supabase";
import { HotelWithDetails } from "@/lib/hotels-service";
import { GuestBookingItem } from "@/app/my-bookings/page";

export interface AdminHotelItem extends HotelWithDetails {
  owner_name?: string;
  owner_phone?: string;
  commission_rate: number;
}

export interface AdminBookingItem {
  id: string;
  hotelId: string;
  hotelName: string;
  area: "Dapoli" | "Harnai";
  guestId?: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  commissionRate: number;
  commissionEarned: number;
  status: "requested" | "pending_verification" | "confirmed" | "completed" | "cancelled";
  utr?: string;
  createdAt: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  role: UserRole;
  approval_status?: OwnerApprovalStatus;
  hotel_name?: string;
  hotel_area?: string;
  created_at: string;
  bookingsCount: number;
  hotelsCount: number;
}

export interface AdminPlatformStats {
  totalBookings: number;
  confirmedBookingsCount: number;
  totalGrossRevenue: number;
  totalCommissionEarned: number;
  areaBreakdown: {
    dapoliCount: number;
    dapoliRevenue: number;
    dapoliPercentage: number;
    harnaiCount: number;
    harnaiRevenue: number;
    harnaiPercentage: number;
  };
  hotelStats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  userStats: {
    total: number;
    guests: number;
    owners: number;
    admins: number;
  };
}

const LOCAL_ADMIN_HOTELS_KEY = "bhramo_admin_hotels";
const LOCAL_ADMIN_USERS_KEY = "bhramo_admin_users";

// Real verified hotel listings for Admin review
const DEFAULT_ADMIN_HOTELS: AdminHotelItem[] = [
  {
    id: "appas-beach-resort-palande",
    owner_id: "owner-appas-palande",
    owner_name: "Appas Host",
    owner_phone: "+91 74475 68595",
    name: "Appas Beach Resort",
    area: "Dapoli",
    address: "Palande Beach Road, Near Murud-Harnai Coastal Stretch, Taluka Dapoli 415713",
    lat: 17.7960,
    lng: 73.1040,
    description: "Nestled right along pristine Palande Beach with direct beach touch through a serene canopy of coastal trees and lush greenery. Authentic Konkan homestay warmth with fresh food on demand.",
    amenities: ["Palande Beach Touch (<50m)", "Lush Coastal Greenery", "Authentic Konkan Vibe", "In-House Restaurant", "Fresh Food on Demand", "Free Parking"],
    checkin_time: "12:00 PM",
    checkout_time: "10:30 AM",
    status: "approved",
    commission_rate: 15.00,
    starting_price: 1800,
    average_rating: 4.8,
    review_count: 28,
    has_ac: true,
    has_non_ac: true,
    whatsapp_number: "917447568595",
    images: [
      "/hotels/appas-beach-resort/palande-beach-path.jpg",
      "/hotels/appas-beach-resort/driveway-greenery-cottage.jpg",
      "/hotels/appas-beach-resort/garden-hillside-palms.jpg",
      "/hotels/appas-beach-resort/exterior-cottage.jpg",
      "/hotels/appas-beach-resort/bedroom-deluxe.jpg",
      "/hotels/appas-beach-resort/bedroom-wooden.jpg",
      "/hotels/appas-beach-resort/beach-touch-sunset-trail.jpg",
      "/hotels/appas-beach-resort/room-mirror.jpg",
    ],
    room_types: [],
  },
  {
    id: "baliraj-homestay-dapoli",
    owner_id: "owner-baliraj-dapoli",
    owner_name: "Baliraj Host",
    owner_phone: "+91 74475 68595",
    name: "Baliraj Home Stay",
    area: "Dapoli",
    address: "Near Murud Coastal Road, Dapoli, Maharashtra 415713",
    lat: 17.7820,
    lng: 73.1180,
    description: "Welcome to Baliraj Home Stay, a peaceful Konkan retreat surrounded by lush green hills and tranquil coastal nature. Features well-appointed air-conditioned and non-AC rooms with private balconies, scenic hill views, and genuine Konkani homestay hospitality with fresh home-style meals prepared on request.",
    amenities: ["Scenic Hill & Greenery View", "Private Balcony Windows", "Split AC", "Hot Water (Geyser)", "Free Parking", "Home-Style Food on Demand"],
    checkin_time: "12:00 PM",
    checkout_time: "11:00 AM",
    status: "approved",
    commission_rate: 15.00,
    starting_price: 1600,
    average_rating: 4.9,
    review_count: 14,
    has_ac: true,
    has_non_ac: true,
    whatsapp_number: "917447568595",
    images: [
      "/hotels/baliraj-homestay/bedroom-balcony-view.jpg",
      "/hotels/baliraj-homestay/room-split-ac.jpg",
      "/hotels/baliraj-homestay/bedroom-double-bed.jpg",
      "/hotels/baliraj-homestay/balcony-hill-view.jpg"
    ],
    room_types: [],
  },
  {
    id: "isshan-resort-dapoli",
    owner_id: "owner-isshan-dapoli",
    owner_name: "Isshan Host",
    owner_phone: "+91 74475 68595",
    name: "Isshan Resort",
    area: "Dapoli",
    address: "Direct Beach Touch Coastline Road, Murud-Karde Stretch, Dapoli 415713",
    lat: 17.7880,
    lng: 73.1110,
    description: "Beachfront coastal living with direct beach touch, fairy-lit coastal garden, outdoor courtyard dining with warm rope lamps, and comfortable AC cottages.",
    amenities: ["Direct Beach Touch (<30m)", "Beach Garden Lawn", "Outdoor Dining Courtyard", "Split AC", "Hot Water (Geyser)", "Free Parking"],
    checkin_time: "12:00 PM",
    checkout_time: "10:30 AM",
    status: "approved",
    commission_rate: 15.00,
    starting_price: 1900,
    average_rating: 4.9,
    review_count: 22,
    has_ac: true,
    has_non_ac: true,
    whatsapp_number: "917447568595",
    images: [
      "/hotels/isshan-resort/beach-canopy-ocean-view.jpg",
      "/hotels/isshan-resort/night-courtyard-dining.jpg",
      "/hotels/isshan-resort/resort-cottage-verandah.jpg",
      "/hotels/isshan-resort/bedroom-ac-deluxe.jpg",
      "/hotels/isshan-resort/bedroom-window-ac.jpg"
    ],
    room_types: [],
  },
  {
    id: "sachi-sanskruti-dapoli",
    owner_id: "owner-sachi-sanskruti",
    owner_name: "Sachi Sanskruti Host",
    owner_phone: "+91 74475 68595",
    name: "Sachi Sanskruti",
    area: "Dapoli",
    address: "Coastal Road, Taluka Dapoli, District Ratnagiri, Maharashtra 415713",
    lat: 17.7780,
    lng: 73.1250,
    description: "Expansive Konkani homestay surrounded by betel nut wadis and green hills. Large stone courtyard with abundant parking, family suites, and scenic balcony views.",
    amenities: ["Spacious Stone Courtyard", "Free Car & Bus Parking", "Green Hill Views", "Family AC Suites", "Split AC", "Hot Water (Geyser)"],
    checkin_time: "12:00 PM",
    checkout_time: "10:30 AM",
    status: "approved",
    commission_rate: 15.00,
    starting_price: 1800,
    average_rating: 4.8,
    review_count: 19,
    has_ac: true,
    has_non_ac: true,
    whatsapp_number: "917447568595",
    images: [
      "/hotels/sachi-sanskruti/exterior-building-courtyard.jpg",
      "/hotels/sachi-sanskruti/balcony-hill-courtyard-view.jpg",
      "/hotels/sachi-sanskruti/courtyard-palm-gardens.jpg",
      "/hotels/sachi-sanskruti/deluxe-ac-bedroom.jpg",
      "/hotels/sachi-sanskruti/family-suite-room.jpg"
    ],
    room_types: [],
  },
  {
    id: "ishan-laukik-dapoli",
    owner_id: "owner-ishan-laukik",
    owner_name: "Ishan Laukik Host",
    owner_phone: "+91 74475 68595",
    name: "Ishan Laukik",
    area: "Dapoli",
    address: "Palande-Harnai Beachfront Stretch, Dapoli, Maharashtra 415713",
    lat: 17.7920,
    lng: 73.1080,
    description: "Beachfront stay with sliding glass beach-facing rooms, coconut grove, garden gazebo dining, and direct beach touch under 40 meters.",
    amenities: ["Direct Beach Touch (<40m)", "Sliding Glass Beach View", "Coconut Garden Path", "Outdoor Dining Gazebo", "Split AC", "Hot Water"],
    checkin_time: "12:00 PM",
    checkout_time: "10:30 AM",
    status: "approved",
    commission_rate: 15.00,
    starting_price: 1800,
    average_rating: 4.9,
    review_count: 17,
    has_ac: true,
    has_non_ac: true,
    whatsapp_number: "917447568595",
    images: [
      "/hotels/ishan-laukik/bedroom-sliding-beach-view.jpg",
      "/hotels/ishan-laukik/garden-gazebo-beach-trail.jpg",
      "/hotels/ishan-laukik/deluxe-bedroom-blue-bed.jpg",
      "/hotels/ishan-laukik/bedroom-glossy-tiles-interior.jpg"
    ],
    room_types: [],
  },
  {
    id: "hill-sea-homestay-dapoli",
    owner_id: "owner-hill-sea",
    owner_name: "Hill Sea Host",
    owner_phone: "+91 74475 68595",
    name: "Hill Sea Home Stay",
    area: "Dapoli",
    address: "Palande-Murud Coastal Road, Dapoli, Maharashtra 415713",
    lat: 17.7860,
    lng: 73.1140,
    description: "Peaceful Konkan getaway between hills and sea. Spacious pillared viewing veranda overlooking mango groves, AC rooms with wooden beds, and authentic home-cooked meals.",
    amenities: ["Pillared Long Veranda", "Panoramic Village & Hill Views", "Wooden Beds", "Split AC", "Hot Water (Geyser)", "Free Parking"],
    checkin_time: "12:00 PM",
    checkout_time: "10:30 AM",
    status: "approved",
    commission_rate: 15.00,
    starting_price: 1700,
    average_rating: 4.8,
    review_count: 15,
    has_ac: true,
    has_non_ac: true,
    whatsapp_number: "917447568595",
    images: [
      "/hotels/hill-sea-homestay/long-veranda-nature-balcony.jpg",
      "/hotels/hill-sea-homestay/deluxe-ac-bedroom-wooden-bed.jpg",
      "/hotels/hill-sea-homestay/balcony-village-cottage-view.jpg",
      "/hotels/hill-sea-homestay/bedroom-interior-full-view.jpg",
      "/hotels/hill-sea-homestay/bedroom-window-gallery-view.jpg"
    ],
    room_types: [],
  },
];

// Default seed users for Admin management
const DEFAULT_ADMIN_USERS: AdminUserItem[] = [];

// Default master list of platform bookings for Admin view
const DEFAULT_ADMIN_BOOKINGS: AdminBookingItem[] = [];


// ==============================================================================
// 1. HOTEL LISTINGS (APPROVE, REJECT, COMMISSION RATE)
// ==============================================================================

export function getAdminHotels(): AdminHotelItem[] {
  if (typeof window === "undefined") return DEFAULT_ADMIN_HOTELS;
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_HOTELS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_ADMIN_HOTELS_KEY, JSON.stringify(DEFAULT_ADMIN_HOTELS));
      return DEFAULT_ADMIN_HOTELS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ADMIN_HOTELS;
  }
}

export function saveAdminHotels(hotels: AdminHotelItem[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_ADMIN_HOTELS_KEY, JSON.stringify(hotels));
    } catch {
      // ignore
    }
  }
}

/**
 * Approve, Reject or Reset Hotel Status
 */
export async function updateHotelStatus(
  hotelId: string,
  newStatus: "approved" | "rejected" | "pending"
): Promise<{ success: boolean; error?: string }> {
  // Update local storage
  const hotels = getAdminHotels();
  const updated = hotels.map((h) => {
    if (h.id === hotelId) {
      return { ...h, status: newStatus };
    }
    return h;
  });
  saveAdminHotels(updated);

  // Update Supabase if configured
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("hotels")
        .update({ status: newStatus })
        .eq("id", hotelId);
    } catch (e: any) {
      console.warn("Supabase hotel status update warning:", e);
    }
  }

  return { success: true };
}

/**
 * Update Hotel Commission Rate (%)
 */
export async function updateHotelCommissionRate(
  hotelId: string,
  rate: number
): Promise<{ success: boolean; error?: string }> {
  if (rate < 0 || rate > 100) {
    return { success: false, error: "Commission rate must be between 0% and 100%." };
  }

  const hotels = getAdminHotels();
  const updated = hotels.map((h) => {
    if (h.id === hotelId) {
      return { ...h, commission_rate: rate };
    }
    return h;
  });
  saveAdminHotels(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("hotels")
        .update({ commission_rate: rate })
        .eq("id", hotelId);
    } catch (e: any) {
      console.warn("Supabase hotel commission update warning:", e);
    }
  }

  return { success: true };
}

// ==============================================================================
// 2. ALL PLATFORM BOOKINGS
// ==============================================================================

export function getAdminBookings(): AdminBookingItem[] {
  if (typeof window === "undefined") return DEFAULT_ADMIN_BOOKINGS;

  try {
    let list = [...DEFAULT_ADMIN_BOOKINGS];

    // Merge any live user holds created during checkout
    const rawPending = localStorage.getItem("bhramo_active_booking_holds");
    if (rawPending) {
      const pendingHolds = JSON.parse(rawPending);
      pendingHolds.forEach((hold: any) => {
        const exists = list.some((b) => b.id === hold.id);
        if (!exists && hold.status) {
          const hotelRate = 15;
          const commEarned = hold.status !== "cancelled" ? Math.round(hold.totalAmount * (hotelRate / 100)) : 0;
          list.unshift({
            id: hold.id,
            hotelId: hold.hotelId || "b1111111-1111-1111-1111-111111111111",
            hotelName: hold.hotelName || "Konkan Coast Property",
            area: hold.area || "Dapoli",
            guestName: "Guest User",
            guestPhone: "+91 98765 43210",
            checkIn: hold.checkIn,
            checkOut: hold.checkOut,
            nights: hold.nights || 2,
            guests: hold.guests || 2,
            totalAmount: hold.totalAmount,
            advancePaid: Math.round(hold.totalAmount * 0.15),
            balanceAmount: hold.totalAmount - Math.round(hold.totalAmount * 0.15),
            commissionRate: hotelRate,
            commissionEarned: commEarned,
            status: hold.status,
            utr: hold.upiRefNumber || hold.paymentId,
            createdAt: new Date().toISOString(),
          });
        }
      });
    }

    return list;
  } catch {
    return DEFAULT_ADMIN_BOOKINGS;
  }
}

// ==============================================================================
// 3. USER MANAGEMENT (ROLES & DIRECTORY)
// ==============================================================================

export function getAdminUsers(): AdminUserItem[] {
  if (typeof window === "undefined") return DEFAULT_ADMIN_USERS;
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_ADMIN_USERS_KEY, JSON.stringify(DEFAULT_ADMIN_USERS));
      return DEFAULT_ADMIN_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ADMIN_USERS;
  }
}

export function saveAdminUsers(users: AdminUserItem[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_ADMIN_USERS_KEY, JSON.stringify(users));
    } catch {
      // ignore
    }
  }
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  const users = getAdminUsers();
  const updated = users.map((u) => {
    if (u.id === userId) {
      return { ...u, role: newRole };
    }
    return u;
  });
  saveAdminUsers(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
    } catch (e: any) {
      console.warn("Supabase profile role update warning:", e);
    }
  }

  return { success: true };
}

export async function updateOwnerApprovalStatus(
  userId: string,
  newStatus: OwnerApprovalStatus,
  newRole: UserRole = "owner"
): Promise<{ success: boolean; error?: string }> {
  const users = getAdminUsers();
  const updated = users.map((u) => {
    if (u.id === userId) {
      return {
        ...u,
        approval_status: newStatus,
        role: newStatus === "approved" ? "owner" : u.role,
      };
    }
    return u;
  });
  saveAdminUsers(updated);

  // Sync with active local profile if currently signed in on this device
  if (typeof window !== "undefined") {
    try {
      const activeRaw = localStorage.getItem("bhramo_user_profile");
      if (activeRaw) {
        const activeProfile = JSON.parse(activeRaw);
        if (activeProfile.id === userId || activeProfile.email === users.find(u => u.id === userId)?.email) {
          activeProfile.approval_status = newStatus;
          if (newStatus === "approved") activeProfile.role = "owner";
          localStorage.setItem("bhramo_user_profile", JSON.stringify(activeProfile));
        }
      }
    } catch {
      // ignore
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("profiles")
        .update({
          approval_status: newStatus,
          role: newStatus === "approved" ? "owner" : undefined,
        })
        .eq("id", userId);
    } catch (e: any) {
      console.warn("Supabase profile approval status update warning:", e);
    }
  }

  return { success: true };
}

export function registerOwnerApplication(application: {
  id?: string;
  name: string;
  email: string;
  phone: string;
  hotel_name: string;
  hotel_area: string;
}): AdminUserItem {
  const users = getAdminUsers();
  const existingIdx = users.findIndex((u) => u.email === application.email);

  const newUser: AdminUserItem = {
    id: application.id || `owner-app-${Date.now()}`,
    name: application.name,
    email: application.email,
    phone: application.phone,
    role: "owner",
    approval_status: "pending",
    hotel_name: application.hotel_name,
    hotel_area: application.hotel_area,
    created_at: new Date().toISOString(),
    bookingsCount: 0,
    hotelsCount: 1,
  };

  let updated: AdminUserItem[];
  if (existingIdx >= 0) {
    updated = [...users];
    updated[existingIdx] = {
      ...updated[existingIdx],
      ...newUser,
      approval_status: "pending",
    };
  } else {
    updated = [newUser, ...users];
  }

  saveAdminUsers(updated);
  return newUser;
}

// ==============================================================================
// 4. ADMIN PLATFORM STATS COMPUTATION
// ==============================================================================

export function computeAdminStats(): AdminPlatformStats {
  const bookings = getAdminBookings();
  const hotels = getAdminHotels();
  const users = getAdminUsers();

  const totalBookings = bookings.length;
  const nonCancelledBookings = bookings.filter((b) => b.status !== "cancelled");
  const confirmedBookingsCount = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "completed"
  ).length;

  const totalGrossRevenue = nonCancelledBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalCommissionEarned = nonCancelledBookings.reduce((sum, b) => sum + b.commissionEarned, 0);

  // Bookings by Area Breakdown
  const dapoliBookings = nonCancelledBookings.filter((b) => b.area === "Dapoli");
  const harnaiBookings = nonCancelledBookings.filter((b) => b.area === "Harnai");

  const dapoliCount = dapoliBookings.length;
  const harnaiCount = harnaiBookings.length;
  const areaTotal = dapoliCount + harnaiCount || 1;

  const dapoliRevenue = dapoliBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const harnaiRevenue = harnaiBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  const dapoliPercentage = Math.round((dapoliCount / areaTotal) * 100);
  const harnaiPercentage = Math.round((harnaiCount / areaTotal) * 100);

  return {
    totalBookings,
    confirmedBookingsCount,
    totalGrossRevenue,
    totalCommissionEarned,
    areaBreakdown: {
      dapoliCount,
      dapoliRevenue,
      dapoliPercentage,
      harnaiCount,
      harnaiRevenue,
      harnaiPercentage,
    },
    hotelStats: {
      total: hotels.length,
      approved: hotels.filter((h) => h.status === "approved").length,
      pending: hotels.filter((h) => h.status === "pending").length,
      rejected: hotels.filter((h) => h.status === "rejected").length,
    },
    userStats: {
      total: users.length,
      guests: users.filter((u) => u.role === "guest").length,
      owners: users.filter((u) => u.role === "owner").length,
      admins: users.filter((u) => u.role === "admin").length,
    },
  };
}
