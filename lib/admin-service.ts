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

// Default seed hotel listings for Admin review (including pending & rejected)
const DEFAULT_ADMIN_HOTELS: AdminHotelItem[] = [
  {
    id: "b1111111-1111-1111-1111-111111111111",
    owner_id: "a1111111-1111-1111-1111-111111111111",
    owner_name: "Suresh Kadam",
    owner_phone: "+91 94223 88200",
    name: "Murud Beach Palms Resort",
    area: "Dapoli",
    address: "Murud Beach Road, Murud, Taluka Dapoli 415712",
    lat: 17.7733,
    lng: 73.1189,
    description: "Beachfront coconut grove resort with authentic Konkani dining and dolphin safari access.",
    amenities: ["Beach Access (150m)", "AC Rooms", "Konkani Ukadiche Modak", "Free Wi-Fi", "Power Backup"],
    checkin_time: "12:00 PM",
    checkout_time: "10:00 AM",
    status: "approved",
    commission_rate: 15.00,
    starting_price: 2600,
    average_rating: 4.9,
    review_count: 138,
    has_ac: true,
    has_non_ac: false,
    whatsapp_number: "919422388200",
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    ],
    room_types: [],
  },
  {
    id: "b4444444-4444-4444-4444-444444444444",
    owner_id: "a2222222-2222-2222-2222-222222222222",
    owner_name: "Vasant Chogle",
    owner_phone: "+91 98234 11001",
    name: "Suvarnadurg Coastal Haven",
    area: "Harnai",
    address: "Bunder Road, Near Fish Market, Harnai Port 415713",
    lat: 17.8136,
    lng: 73.0911,
    description: "Directly facing historic Suvarnadurg sea fort with panoramic harbor view suites.",
    amenities: ["Sea View Balconies", "Beach Access (150m)", "Fresh Fish Market Access", "Free Wi-Fi"],
    checkin_time: "12:30 PM",
    checkout_time: "10:00 AM",
    status: "approved",
    commission_rate: 14.00,
    starting_price: 2400,
    average_rating: 4.9,
    review_count: 94,
    has_ac: true,
    has_non_ac: false,
    whatsapp_number: "919823411001",
    images: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
    ],
    room_types: [],
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    owner_id: "a3333333-3333-3333-3333-333333333333",
    owner_name: "Anand Joshi",
    owner_phone: "+91 98221 44556",
    name: "Ladghar Tamas Beach Cottages",
    area: "Dapoli",
    address: "Ladghar Red Sand Beach, Taluka Dapoli 415712",
    lat: 17.742,
    lng: 73.136,
    description: "Red sand sunset facing coastal eco-cottages surrounded by suru trees and water sports.",
    amenities: ["Red Sand Beach Access", "Sunset View Patio", "Traditional Sol Kadhi Meals", "Free Parking"],
    checkin_time: "12:00 PM",
    checkout_time: "10:00 AM",
    status: "approved",
    commission_rate: 15.00,
    starting_price: 3200,
    average_rating: 4.7,
    review_count: 85,
    has_ac: true,
    has_non_ac: true,
    whatsapp_number: "919822144556",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    ],
    room_types: [],
  },
  {
    id: "b-pending-101",
    owner_id: "a4444444-4444-4444-4444-444444444444",
    owner_name: "Mahesh Bapat",
    owner_phone: "+91 98229 33110",
    name: "Harnai Lighthouse View Homestay",
    area: "Harnai",
    address: "Lighthouse Road, Harnai Point, Taluka Dapoli 415713",
    lat: 17.808,
    lng: 73.085,
    description: "Newly constructed traditional Konkani red laterite home with 3 guest suites overlooking Harnai lighthouse and rocky coastline. Pure vegetarian Konkani kitchen available.",
    amenities: ["Panoramic Lighthouse View", "Home Cooked Veg Meals", "AC Rooms", "Private Sit-out", "Inverter Backup"],
    checkin_time: "12:00 PM",
    checkout_time: "10:30 AM",
    status: "pending",
    commission_rate: 15.00,
    starting_price: 2200,
    average_rating: 5.0,
    review_count: 0,
    has_ac: true,
    has_non_ac: true,
    whatsapp_number: "919822933110",
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    ],
    room_types: [],
  },
  {
    id: "b-pending-102",
    owner_id: "a5555555-5555-5555-5555-555555555555",
    owner_name: "Ramesh Shirke",
    owner_phone: "+91 94211 77654",
    name: "Dapoli Betelnut Heritage Wada",
    area: "Dapoli",
    address: "Burondi Road, Dapoli Inland Forest Zone 415712",
    lat: 17.761,
    lng: 73.185,
    description: "Authentic 90-year-old restored Konkani wooden wada surrounded by a 4-acre betel nut and Alphonso mango wadi. Peaceful retreat for birdwatchers and nature lovers.",
    amenities: ["Fruit Orchard Walks", "Heritage Wooden Interiors", "Organic Farm Food", "Free Wi-Fi", "Pet Friendly"],
    checkin_time: "01:00 PM",
    checkout_time: "11:00 AM",
    status: "pending",
    commission_rate: 12.50,
    starting_price: 2800,
    average_rating: 5.0,
    review_count: 0,
    has_ac: true,
    has_non_ac: false,
    whatsapp_number: "919421177654",
    images: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    ],
    room_types: [],
  },
  {
    id: "b-rejected-101",
    owner_id: "a6666666-6666-6666-6666-666666666666",
    owner_name: "Kishor Raut",
    owner_phone: "+91 98900 12345",
    name: "Karde Hillside Dormitory",
    area: "Dapoli",
    address: "Karde Bypass Hill, Dapoli",
    lat: 17.751,
    lng: 73.13,
    description: "Budget dormitory rooms without independent access or verified fire safety certificates.",
    amenities: ["Ceiling Fans", "Shared Bathrooms"],
    checkin_time: "12:00 PM",
    checkout_time: "10:00 AM",
    status: "rejected",
    commission_rate: 15.00,
    starting_price: 800,
    average_rating: 3.2,
    review_count: 2,
    has_ac: false,
    has_non_ac: true,
    whatsapp_number: "919890012345",
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
    ],
    room_types: [],
  },
];

// Default seed users for Admin management
const DEFAULT_ADMIN_USERS: AdminUserItem[] = [
  {
    id: "u-admin-1",
    name: "Bhramo System Admin",
    phone: "+91 98765 43210",
    email: "admin@bhramo.com",
    role: "admin",
    approval_status: "approved",
    created_at: "2026-01-01T00:00:00Z",
    bookingsCount: 0,
    hotelsCount: 0,
  },
  {
    id: "a1111111-1111-1111-1111-111111111111",
    name: "Suresh Kadam (Dapoli Host)",
    phone: "+91 94223 88200",
    email: "suresh.kadam@murudpalms.com",
    role: "owner",
    approval_status: "approved",
    hotel_name: "Murud Beach Palms Resort",
    hotel_area: "Dapoli",
    created_at: "2026-02-15T10:00:00Z",
    bookingsCount: 1,
    hotelsCount: 2,
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    name: "Vasant Chogle (Harnai Host)",
    phone: "+91 98234 11001",
    email: "vasant.chogle@suvarnadurg.com",
    role: "owner",
    approval_status: "approved",
    hotel_name: "Suvarnadurg Coastal Haven",
    hotel_area: "Harnai",
    created_at: "2026-03-01T12:00:00Z",
    bookingsCount: 0,
    hotelsCount: 1,
  },
  {
    id: "u-guest-1",
    name: "Pooja Patil (Guest)",
    phone: "+91 98233 44556",
    email: "pooja.patil@gmail.com",
    role: "guest",
    approval_status: "approved",
    created_at: "2026-05-10T14:30:00Z",
    bookingsCount: 3,
    hotelsCount: 0,
  },
  {
    id: "u-guest-2",
    name: "Amit Deshmukh (Guest)",
    phone: "+91 94200 88991",
    email: "amit.deshmukh@yahoo.co.in",
    role: "guest",
    approval_status: "approved",
    created_at: "2026-06-22T09:15:00Z",
    bookingsCount: 2,
    hotelsCount: 0,
  },
  {
    id: "a4444444-4444-4444-4444-444444444444",
    name: "Mahesh Bapat (New Host)",
    phone: "+91 98229 33110",
    email: "mahesh.bapat@harnai.net",
    role: "owner",
    approval_status: "pending",
    hotel_name: "Bapat Sea Breeze Homestay",
    hotel_area: "Harnai",
    created_at: "2026-09-18T16:00:00Z",
    bookingsCount: 0,
    hotelsCount: 1,
  },
];

// Default master list of platform bookings for Admin view
const DEFAULT_ADMIN_BOOKINGS: AdminBookingItem[] = [
  {
    id: "BK-DAP-901",
    hotelId: "b1111111-1111-1111-1111-111111111111",
    hotelName: "Murud Beach Palms Resort",
    area: "Dapoli",
    guestName: "Pooja Patil",
    guestPhone: "+91 98233 44556",
    checkIn: "2026-10-18",
    checkOut: "2026-10-20",
    nights: 2,
    guests: 2,
    totalAmount: 5200,
    advancePaid: 780,
    balanceAmount: 4420,
    commissionRate: 15.00,
    commissionEarned: 780,
    status: "confirmed",
    utr: "429184719283",
    createdAt: "2026-10-09T14:30:00Z",
  },
  {
    id: "BK-HAR-902",
    hotelId: "b4444444-4444-4444-4444-444444444444",
    hotelName: "Suvarnadurg Coastal Haven",
    area: "Harnai",
    guestName: "Amit Deshmukh",
    guestPhone: "+91 94200 88991",
    checkIn: "2026-11-02",
    checkOut: "2026-11-04",
    nights: 2,
    guests: 2,
    totalAmount: 4800,
    advancePaid: 720,
    balanceAmount: 4080,
    commissionRate: 14.00,
    commissionEarned: 672,
    status: "pending_verification",
    utr: "419827361829",
    createdAt: "2026-10-10T11:00:00Z",
  },
  {
    id: "BK-DAP-898",
    hotelId: "b1111111-1111-1111-1111-111111111111",
    hotelName: "Murud Beach Palms Resort",
    area: "Dapoli",
    guestName: "Rohan Sawant",
    guestPhone: "+91 98212 99887",
    checkIn: "2026-09-25",
    checkOut: "2026-09-27",
    nights: 2,
    guests: 3,
    totalAmount: 6400,
    advancePaid: 960,
    balanceAmount: 5440,
    commissionRate: 15.00,
    commissionEarned: 960,
    status: "completed",
    utr: "389102847291",
    createdAt: "2026-09-20T10:00:00Z",
  },
  {
    id: "BK-HAR-894",
    hotelId: "b4444444-4444-4444-4444-444444444444",
    hotelName: "Suvarnadurg Coastal Haven",
    area: "Harnai",
    guestName: "Deepak Gaikwad",
    guestPhone: "+91 94220 55667",
    checkIn: "2026-09-12",
    checkOut: "2026-09-14",
    nights: 2,
    guests: 2,
    totalAmount: 4800,
    advancePaid: 720,
    balanceAmount: 4080,
    commissionRate: 14.00,
    commissionEarned: 672,
    status: "completed",
    utr: "318291039482",
    createdAt: "2026-09-08T09:00:00Z",
  },
  {
    id: "BK-DAP-890",
    hotelId: "b2222222-2222-2222-2222-222222222222",
    hotelName: "Ladghar Tamas Beach Cottages",
    area: "Dapoli",
    guestName: "Sunil Shinde",
    guestPhone: "+91 98201 33445",
    checkIn: "2026-09-02",
    checkOut: "2026-09-04",
    nights: 2,
    guests: 4,
    totalAmount: 7200,
    advancePaid: 1080,
    balanceAmount: 6120,
    commissionRate: 15.00,
    commissionEarned: 1080,
    status: "completed",
    utr: "289102837192",
    createdAt: "2026-08-28T15:00:00Z",
  },
  {
    id: "BK-DAP-885",
    hotelId: "b1111111-1111-1111-1111-111111111111",
    hotelName: "Murud Beach Palms Resort",
    area: "Dapoli",
    guestName: "Nilesh Vartak",
    guestPhone: "+91 98199 44332",
    checkIn: "2026-08-20",
    checkOut: "2026-08-22",
    nights: 2,
    guests: 2,
    totalAmount: 5200,
    advancePaid: 780,
    balanceAmount: 4420,
    commissionRate: 15.00,
    commissionEarned: 0,
    status: "cancelled",
    utr: "219847192837",
    createdAt: "2026-08-15T12:00:00Z",
  },
];

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
