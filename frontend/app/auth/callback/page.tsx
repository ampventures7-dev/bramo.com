"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Waves, Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      const roleParam = searchParams.get("role") || "guest";
      const redirectParam = searchParams.get("redirect") || "/my-bookings";

      if (isSupabaseConfigured) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            setErrorMsg(error.message);
            return;
          }

          if (session?.user) {
            // Check if profile exists, otherwise create it
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (!existingProfile) {
              await supabase.from("profiles").insert({
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Google Traveler",
                phone: session.user.phone || null,
                role: roleParam,
              });
            }

            const targetRole = existingProfile?.role || roleParam;
            if (targetRole === "owner") {
              router.push("/owner/dashboard");
            } else if (targetRole === "admin") {
              router.push("/admin/payments");
            } else {
              router.push(redirectParam.startsWith("/") ? redirectParam : "/my-bookings");
            }
            return;
          }
        } catch (err: any) {
          setErrorMsg(err.message || "Failed to complete authentication.");
          return;
        }
      }

      // Default redirect
      router.push("/my-bookings");
    }

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 space-y-4">
      <div className="w-12 h-12 bg-konkan-teal-700 text-white rounded-2xl flex items-center justify-center shadow-md animate-pulse">
        <Waves className="w-6 h-6 text-konkan-teal-200" />
      </div>
      {errorMsg ? (
        <div className="text-center space-y-2">
          <p className="text-rose-600 font-bold text-sm">{errorMsg}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-xs font-bold text-konkan-teal-700 hover:underline"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-konkan-teal-700" />
          <span>Completing your Google sign in...</span>
        </div>
      )}
    </div>
  );
}
