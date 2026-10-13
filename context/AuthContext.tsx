"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  isFirebaseConfigured,
  sendFirebasePhoneOtp,
  setupRecaptchaVerifier,
} from "@/lib/firebase";
import { UserRole, Profile, OwnerApprovalStatus } from "@/types/supabase";
import { getAdminUsers, registerOwnerApplication } from "@/lib/admin-service";

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  isLoading: boolean;
  isFirebaseConfigured: boolean;
  isSupabaseConfigured: boolean;
  // 1. Password-based Email Sign In & Sign Up
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string; role?: UserRole; approvalStatus?: OwnerApprovalStatus }>;
  signUpWithEmail: (data: {
    name: string;
    phone: string;
    email: string;
    password: string;
    role: UserRole;
    hotelName?: string;
    hotelArea?: string;
  }) => Promise<{ error?: string; role?: UserRole; approvalStatus?: OwnerApprovalStatus }>;
  // 2. Firebase / SMS Phone OTP (Option 1)
  signInWithPhoneOtp: (phone: string, containerId?: string) => Promise<{ error?: string; success?: boolean; isMock?: boolean }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error?: string; role?: UserRole }>;
  // 3. Supabase Email OTP / Magic Code (Option 4)
  signInWithEmailOtp: (email: string) => Promise<{ error?: string; success?: boolean; isMock?: boolean }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error?: string; role?: UserRole }>;
  // Session & Demo controls
  signOut: () => Promise<void>;
  demoLogin: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_PROFILE_KEY = "bhramo_user_profile";
const LOCAL_STORAGE_SESSION_KEY = "bhramo_mock_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Firebase phone confirmation result
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<any | null>(null);

  // Initialize auth session
  useEffect(() => {
    async function loadSession() {
      setIsLoading(true);

      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            // Fetch profile
            const { data: userProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (userProfile) {
              setProfile(userProfile);
            } else {
              // Fallback profile from user metadata
              const fallbackRole: UserRole = session.user.user_metadata?.role || "guest";
              setProfile({
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
                phone: session.user.phone || session.user.user_metadata?.phone || null,
                role: fallbackRole,
              });
            }
          }
        } catch (err) {
          console.warn("Supabase getSession error:", err);
        }
      } else {
        // Local preview/mock session recovery
        try {
          const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
          if (storedProfile) {
            const parsed = JSON.parse(storedProfile);
            // Sync with admin user directory to detect admin approvals in real time
            const adminUsers = getAdminUsers();
            const matched = adminUsers.find(
              (u) => u.id === parsed.id || (parsed.email && u.email.toLowerCase() === parsed.email.toLowerCase())
            );
            if (matched) {
              parsed.approval_status = matched.approval_status || parsed.approval_status;
              parsed.role = matched.role || parsed.role;
              parsed.hotel_name = matched.hotel_name || parsed.hotel_name;
              parsed.hotel_area = matched.hotel_area || parsed.hotel_area;
              localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(parsed));
            }
            setProfile(parsed);
            setUser({ id: parsed.id, email: parsed.email || `${parsed.role}@example.com` });
          }
        } catch (e) {
          // ignore
        }
      }

      setIsLoading(false);
    }

    loadSession();

    // Listen to Supabase auth state changes if configured
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (userProfile) {
            setProfile(userProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // 1. Email & Password Login
  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }

        const userId = data.user.id;
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        const role: UserRole = userProfile?.role || data.user.user_metadata?.role || "guest";
        const approvalStatus: OwnerApprovalStatus =
          userProfile?.approval_status || data.user.user_metadata?.approval_status || "approved";

        // Enforce owner approval requirement: unapproved owners cannot log in
        if (role === "owner" && approvalStatus !== "approved") {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          if (approvalStatus === "pending") {
            return {
              error: "Your hotel owner application is pending approval by the Admin. You cannot access the Owner Portal until an administrator verifies and approves your hotel ownership.",
              approvalStatus: "pending",
            };
          } else {
            return {
              error: "Your hotel owner application was declined by the administrator. Please contact support@bhramo.com for assistance.",
              approvalStatus: "rejected",
            };
          }
        }

        setUser(data.user);
        setProfile(userProfile || { id: userId, name: data.user.email || "User", phone: null, role, approval_status: approvalStatus });
        setIsLoading(false);
        return { role, approvalStatus };
      } catch (err: any) {
        setIsLoading(false);
        return { error: err.message || "Failed to log in" };
      }
    } else {
      // Offline / Local Mock login
      const cleanEmail = email.trim().toLowerCase();
      const adminUsers = getAdminUsers();
      const existingUser = adminUsers.find((u) => u.email.toLowerCase() === cleanEmail);

      let determinedRole: UserRole = "guest";
      let approvalStatus: OwnerApprovalStatus = "approved";
      let userName = cleanEmail.split("@")[0];
      let userPhone: string | null = "+91 98765 43210";
      let hotelName: string | undefined = undefined;
      let hotelArea: string | undefined = undefined;
      let userId = `mock-user-${Date.now()}`;

      if (existingUser) {
        determinedRole = existingUser.role;
        approvalStatus = existingUser.approval_status || "approved";
        userName = existingUser.name;
        userPhone = existingUser.phone;
        hotelName = existingUser.hotel_name;
        hotelArea = existingUser.hotel_area;
        userId = existingUser.id;
      } else {
        determinedRole = cleanEmail.includes("owner")
          ? "owner"
          : cleanEmail.includes("admin")
          ? "admin"
          : "guest";

        // Unregistered owner accounts default to pending verification
        if (determinedRole === "owner") {
          approvalStatus = "pending";
        }
      }

      // Enforce owner approval requirement: pending or rejected owners cannot log in
      if (determinedRole === "owner" && approvalStatus !== "approved") {
        setIsLoading(false);
        if (approvalStatus === "pending") {
          return {
            error: "Your hotel owner application is pending approval by the Admin. You cannot access the Owner Portal until an administrator verifies and approves your hotel ownership.",
            approvalStatus: "pending",
          };
        } else {
          return {
            error: "Your hotel owner application was declined by the administrator. Please contact support@bhramo.com for assistance.",
            approvalStatus: "rejected",
          };
        }
      }

      const mockProfile: Profile = {
        id: userId,
        name: userName,
        phone: userPhone,
        role: determinedRole,
        approval_status: approvalStatus,
        hotel_name: hotelName,
        hotel_area: hotelArea,
      };

      setUser({ id: mockProfile.id, email: cleanEmail });
      setProfile(mockProfile);
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(mockProfile));
      setIsLoading(false);
      return { role: determinedRole, approvalStatus };
    }
  };

  // 2. Email Sign Up
  const signUpWithEmail = async ({
    name,
    phone,
    email,
    password,
    role,
    hotelName,
    hotelArea,
  }: {
    name: string;
    phone: string;
    email: string;
    password: string;
    role: UserRole;
    hotelName?: string;
    hotelArea?: string;
  }) => {
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const isOwner = role === "owner";
    const approvalStatus: OwnerApprovalStatus = isOwner ? "pending" : "approved";

    // Register into the admin directory queue so admin can inspect and approve
    if (isOwner) {
      registerOwnerApplication({
        name,
        email: cleanEmail,
        phone,
        hotel_name: hotelName || "Konkan Coast Homestay",
        hotel_area: hotelArea || "Dapoli",
      });
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name,
              phone,
              role,
              approval_status: approvalStatus,
              hotel_name: hotelName,
              hotel_area: hotelArea,
            },
          },
        });

        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }

        // If it's a hotel owner, DO NOT establish an active session. Admin must approve first.
        if (isOwner) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          return { role, approvalStatus: "pending" };
        }

        if (data.user) {
          const newProfile: Profile = {
            id: data.user.id,
            name,
            phone,
            role,
            approval_status: "approved",
          };
          setUser(data.user);
          setProfile(newProfile);
        }

        setIsLoading(false);
        return { role, approvalStatus: "approved" };
      } catch (err: any) {
        setIsLoading(false);
        return { error: err.message || "Failed to sign up" };
      }
    } else {
      // Offline mock signup
      if (isOwner) {
        // Owner application submitted — do NOT establish active session
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return { role: "owner", approvalStatus: "pending" };
      }

      const mockProfile: Profile = {
        id: `mock-${role}-${Date.now()}`,
        name,
        phone,
        role,
        approval_status: "approved",
      };
      setUser({ id: mockProfile.id, email: cleanEmail });
      setProfile(mockProfile);
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(mockProfile));
      setIsLoading(false);
      return { role, approvalStatus: "approved" };
    }
  };

  // 3. Option 1: Phone OTP Request (Firebase 10,000 Free SMS Gateway or Supabase fallback)
  const signInWithPhoneOtp = async (phone: string, containerId: string = "recaptcha-container") => {
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? `+${cleanPhone}` : `+91${cleanPhone}`;

    // A. Priority 1: Firebase Phone Auth (10,000 Free SMS/mo)
    if (isFirebaseConfigured) {
      try {
        const fbRes = await sendFirebasePhoneOtp(formattedPhone, containerId);
        if (!fbRes.success) {
          return { error: fbRes.error || "Failed to send Firebase SMS OTP" };
        }
        if (fbRes.confirmationResult) {
          setFirebaseConfirmation(fbRes.confirmationResult);
        }
        return { success: true, isMock: fbRes.isMock };
      } catch (err: any) {
        return { error: err.message || "Failed to send SMS OTP" };
      }
    }

    // B. Priority 2: Supabase SMS Auth (if configured)
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });
        if (error) return { error: error.message };
        return { success: true, isMock: false };
      } catch (err: any) {
        return { error: err.message || "Failed to send SMS OTP" };
      }
    }

    // C. Priority 3: Local Dev Preview / Mock Simulation
    return { success: true, isMock: true };
  };

  // Option 1: Phone OTP Verification
  const verifyPhoneOtp = async (phone: string, token: string): Promise<{ error?: string; role?: UserRole }> => {
    setIsLoading(true);
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? `+${cleanPhone}` : `+91${cleanPhone}`;

    // A. Verify with Firebase Confirmation Result
    if (firebaseConfirmation) {
      try {
        const userCred = await firebaseConfirmation.confirm(token);
        const fbUser = userCred.user;
        const verifiedPhone = fbUser.phoneNumber || formattedPhone;

        let role: UserRole = "guest";
        let userProfile: Profile = {
          id: fbUser.uid,
          name: `Guest (${verifiedPhone.slice(-4)})`,
          phone: verifiedPhone,
          role: "guest",
        };

        // If Supabase is connected, sync or fetch profile
        if (isSupabaseConfigured) {
          try {
            const { data: dbProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("phone", verifiedPhone)
              .maybeSingle();

            if (dbProfile) {
              userProfile = dbProfile;
              role = dbProfile.role;
            } else {
              // Create guest profile
              await supabase.from("profiles").upsert({
                id: fbUser.uid,
                name: `Guest (${verifiedPhone.slice(-4)})`,
                phone: verifiedPhone,
                role: "guest",
              });
            }
          } catch {
            // non-fatal
          }
        }

        setUser({ id: fbUser.uid, phone: verifiedPhone });
        setProfile(userProfile);
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(userProfile));
        setIsLoading(false);
        return { role };
      } catch (err: any) {
        setIsLoading(false);
        return { error: err.message || "Invalid OTP code. Please check and retry." };
      }
    }

    // B. Verify with Supabase SMS Auth
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token,
          type: "sms",
        });

        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }

        const userId = data.user?.id || "";
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        const role: UserRole = userProfile?.role || "guest";
        setUser(data.user);
        setProfile(userProfile || { id: userId, name: formattedPhone, phone: formattedPhone, role });
        setIsLoading(false);
        return { role };
      } catch (err: any) {
        setIsLoading(false);
        return { error: err.message || "Failed to verify SMS OTP" };
      }
    }

    // C. Mock OTP Simulation (Accept any 6-digit number or 123456)
    const mockProfile: Profile = {
      id: `mock-phone-${Date.now()}`,
      name: `Guest (${formattedPhone.slice(-4)})`,
      phone: formattedPhone,
      role: "guest",
    };
    setUser({ id: mockProfile.id, phone: formattedPhone });
    setProfile(mockProfile);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(mockProfile));
    setIsLoading(false);
    return { role: "guest" };
  };

  // 4. Option 4: Supabase Email OTP / Magic Code (100% Free - No password needed)
  const signInWithEmailOtp = async (email: string): Promise<{ error?: string; success?: boolean; isMock?: boolean }> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
          },
        });
        if (error) return { error: error.message };
        return { success: true, isMock: false };
      } catch (err: any) {
        return { error: err.message || "Failed to send Email OTP" };
      }
    }

    // Offline / Preview mock
    return { success: true, isMock: true };
  };

  // Option 4: Verify Email OTP Code
  const verifyEmailOtp = async (email: string, token: string): Promise<{ error?: string; role?: UserRole }> => {
    setIsLoading(true);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: "email",
        });

        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }

        const userId = data.user?.id || "";
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        const role: UserRole = userProfile?.role || data.user?.user_metadata?.role || "guest";
        setUser(data.user);
        setProfile(
          userProfile || {
            id: userId,
            name: data.user?.user_metadata?.name || email.split("@")[0],
            phone: null,
            role,
          }
        );
        setIsLoading(false);
        return { role };
      } catch (err: any) {
        setIsLoading(false);
        return { error: err.message || "Invalid or expired email OTP" };
      }
    }

    // Mock Email OTP success
    const determinedRole: UserRole = email.includes("owner")
      ? "owner"
      : email.includes("admin")
      ? "admin"
      : "guest";

    const mockProfile: Profile = {
      id: `mock-email-${Date.now()}`,
      name: email.split("@")[0],
      phone: null,
      role: determinedRole,
    };

    setUser({ id: mockProfile.id, email });
    setProfile(mockProfile);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(mockProfile));
    setIsLoading(false);
    return { role: determinedRole };
  };

  // 5. Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
    setProfile(null);
    setFirebaseConfirmation(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    } catch (e) {
      // ignore
    }
    router.push("/");
  };

  // 6. Demo fast-login (for instantaneous evaluation)
  const demoLogin = (role: UserRole) => {
    const demoProfile: Profile = {
      id: role === "owner" ? "a1111111-1111-1111-1111-111111111111" : `demo-${role}-123`,
      name: role === "owner" ? "Suresh Kadam (Dapoli Host)" : role === "admin" ? "Bhramo Admin" : "Pooja Patil (Guest)",
      phone: "+91 94223 88200",
      role,
      approval_status: "approved",
      hotel_name: role === "owner" ? "Murud Beach Palms Resort" : undefined,
      hotel_area: role === "owner" ? "Dapoli" : undefined,
    };
    setUser({ id: demoProfile.id, email: `${role}@bhramo.com` });
    setProfile(demoProfile);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(demoProfile));

    if (role === "guest") {
      router.push("/my-bookings");
    } else if (role === "admin") {
      router.push("/admin/payments");
    } else {
      router.push("/owner/dashboard");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isFirebaseConfigured,
        isSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithPhoneOtp,
        verifyPhoneOtp,
        signInWithEmailOtp,
        verifyEmailOtp,
        signOut,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
