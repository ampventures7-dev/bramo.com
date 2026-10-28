import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Review } from "@/types/supabase";

export interface BookingReviewItem extends Review {
  guest_name?: string;
  hotel_name?: string;
}

const LOCAL_REVIEWS_KEY = "bhramo_reviews";

// Default initial reviews for completed bookings (empty)
const DEFAULT_LOCAL_REVIEWS: BookingReviewItem[] = [];


export function getLocalReviews(): BookingReviewItem[] {
  if (typeof window === "undefined") return DEFAULT_LOCAL_REVIEWS;
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(DEFAULT_LOCAL_REVIEWS));
      return DEFAULT_LOCAL_REVIEWS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_LOCAL_REVIEWS;
  }
}

export function saveLocalReviews(reviews: BookingReviewItem[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }
}

/**
 * Get review for a specific booking ID
 */
export async function getReviewForBooking(bookingId: string): Promise<BookingReviewItem | null> {
  const local = getLocalReviews();
  const existingLocal = local.find((r) => r.booking_id === bookingId);
  if (existingLocal) return existingLocal;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (data && !error) {
        return data as BookingReviewItem;
      }
    } catch (e) {
      console.warn("Error fetching booking review from Supabase:", e);
    }
  }

  return null;
}

/**
 * Submit review for completed booking
 */
export async function submitBookingReview(params: {
  bookingId: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  hotelName?: string;
  rating: number; // 1 to 5
  comment: string;
}): Promise<{ success: boolean; review?: BookingReviewItem; error?: string }> {
  // 1. Validation
  if (params.rating < 1 || params.rating > 5) {
    return { success: false, error: "Please select a star rating from 1 to 5." };
  }

  const cleanComment = params.comment.trim();
  if (cleanComment.length < 5) {
    return { success: false, error: "Please write at least a brief comment (minimum 5 characters) describing your experience." };
  }
  if (cleanComment.length > 1000) {
    return { success: false, error: "Review comment cannot exceed 1,000 characters." };
  }

  // 2. Prevent duplicate reviews for the same booking
  const existing = await getReviewForBooking(params.bookingId);
  if (existing) {
    return { success: false, error: "You have already submitted a review for this completed booking." };
  }

  const newReview: BookingReviewItem = {
    id: `rev-${Date.now()}`,
    booking_id: params.bookingId,
    hotel_id: params.hotelId,
    guest_id: params.guestId,
    guest_name: params.guestName,
    hotel_name: params.hotelName,
    rating: params.rating,
    comment: cleanComment,
    created_at: new Date().toISOString(),
  };

  // 3. Save to local storage
  const currentReviews = getLocalReviews();
  const updatedReviews = [newReview, ...currentReviews];
  saveLocalReviews(updatedReviews);

  // 4. Save to Supabase if configured and IDs are valid UUIDs
  if (isSupabaseConfigured) {
    const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    if (isUuid(params.hotelId) && isUuid(params.bookingId) && isUuid(params.guestId)) {
      try {
        await supabase.from("reviews").insert({
          booking_id: params.bookingId,
          hotel_id: params.hotelId,
          guest_id: params.guestId,
          rating: params.rating,
          comment: cleanComment,
        });
      } catch (e: any) {
        console.warn("Supabase review insert warning:", e);
      }
    }
  }

  return { success: true, review: newReview };
}
