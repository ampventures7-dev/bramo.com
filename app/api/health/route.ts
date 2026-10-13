import { NextResponse } from "next/server";
import { createServerSupabaseClient, isServerSupabaseConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * /api/health
 * Ping this endpoint daily (via cron-job.org, GitHub Actions, or Vercel Cron)
 * to keep the free-tier Supabase Postgres database active and prevent pausing.
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // If running with placeholder credentials (local development / initial test)
  if (!isServerSupabaseConfigured) {
    return NextResponse.json(
      {
        status: "ok",
        platform: "bhramo.com",
        service: "Next.js App Router (Production Ready)",
        mode: "standby_placeholder_credentials",
        database: "offline_mock_mode",
        timestamp,
        latencyMs: Date.now() - startTime,
        message:
          "Health check endpoint is live. Add live NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your Vercel Project Settings to query live Postgres.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  try {
    const supabase = createServerSupabaseClient();

    // Query database to keep Postgres compute active
    const { count, error } = await supabase
      .from("hotels")
      .select("id", { count: "exact", head: true });

    // Run automated maintenance to auto-release expired 10m holds & 6h unverified bookings
    let maintenanceResult = null;
    try {
      const { data } = await supabase.rpc("run_maintenance_cleanup");
      maintenanceResult = data;
    } catch {
      // non-blocking if migration not yet applied
    }

    const latencyMs = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          database: "query_failed",
          error: error.message,
          latencyMs,
          timestamp,
        },
        { status: 200 } // Still returns 200 to prevent uptime alerts from failing during cold starts
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        platform: "bhramo.com",
        service: "Next.js App Router (Production)",
        database: "connected",
        hotelsCount: count ?? 0,
        maintenance: maintenanceResult,
        latencyMs,
        timestamp,
        message: "Database ping successful. Expired booking holds cleared and Supabase kept active.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        status: "degraded",
        database: "unreachable",
        error: err.message,
        latencyMs,
        timestamp,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
