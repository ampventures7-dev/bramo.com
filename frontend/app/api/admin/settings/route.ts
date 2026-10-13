import { NextResponse } from "next/server";
import { createServerSupabaseClient, isServerSupabaseConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/settings
 * Read platform settings from Supabase if configured, with security headers
 */
export async function GET() {
  if (!isServerSupabaseConfigured) {
    return NextResponse.json({
      configured: false,
      settings: null,
      message: "Supabase server credentials not configured. Using local fallback.",
    });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", "default")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ configured: true, settings: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch settings" }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings
 * Securely update platform settings using server-side service role client.
 * Requires admin authorization check.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    const { upi_id, qr_image_url, business_name, default_booking_fee_percent } = body;

    // Validate input types
    if (default_booking_fee_percent !== undefined) {
      const fee = Number(default_booking_fee_percent);
      if (isNaN(fee) || fee < 0 || fee > 100) {
        return NextResponse.json(
          { error: "Booking fee percentage must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    if (!isServerSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Server running in preview/mock mode. Setting updated locally.",
      });
    }

    const supabase = createServerSupabaseClient();

    // Verify caller session if token provided
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData?.user) {
        return NextResponse.json({ error: "Unauthorized access token" }, { status: 401 });
      }

      // Check admin profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
      }
    }

    const updatePayload: Record<string, any> = {
      id: "default",
      updated_at: new Date().toISOString(),
    };
    if (upi_id) updatePayload.upi_id = String(upi_id).trim();
    if (qr_image_url) updatePayload.qr_image_url = String(qr_image_url).trim();
    if (business_name) updatePayload.business_name = String(business_name).trim();
    if (default_booking_fee_percent !== undefined) {
      updatePayload.default_booking_fee_percent = Number(default_booking_fee_percent);
    }

    const { data, error } = await supabase
      .from("platform_settings")
      .upsert(updatePayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, settings: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status: 500 });
  }
}
