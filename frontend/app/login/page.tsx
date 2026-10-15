"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Waves,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  KeyRound,
  RotateCcw,
  Clock,
} from "lucide-react";

type AuthMode = "phone_otp" | "email_otp" | "password";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const {
    signInWithEmail,
    signInWithPhoneOtp,
    verifyPhoneOtp,
    signInWithEmailOtp,
    verifyEmailOtp,
    signInWithGoogle,
    demoLogin,
    isFirebaseConfigured,
    isSupabaseConfigured,
  } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>("phone_otp");

  // Phone OTP States (Option 1 - Firebase 10,000 Free SMS)
  const [phone, setPhone] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpToken, setPhoneOtpToken] = useState("");
  const [phoneTimer, setPhoneTimer] = useState(0);

  // Email OTP States (Option 4 - Supabase Free Email OTP)
  const [emailForOtp, setEmailForOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpToken, setEmailOtpToken] = useState("");
  const [emailTimer, setEmailTimer] = useState(0);

  // Standard Password States
  const [passwordEmail, setPasswordEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendingApprovalNotice, setPendingApprovalNotice] = useState(false);

  // Lockout States for Rate Limiting (3 attempts for owners, 5 attempts for guests)
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Countdown timer for Phone OTP resend
  useEffect(() => {
    if (phoneTimer <= 0) return;
    const interval = setInterval(() => {
      setPhoneTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phoneTimer]);

  // Countdown timer for Email OTP resend
  useEffect(() => {
    if (emailTimer <= 0) return;
    const interval = setInterval(() => {
      setEmailTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [emailTimer]);

  // Countdown timer for Security Lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  // Check rate limit before an attempt
  const checkRateLimitBeforeAttempt = async (identifier: string): Promise<boolean> => {
    if (!identifier) return true;
    try {
      const res = await fetch("/api/auth/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_login", identifier }),
      });
      const data = await res.json();
      if (!res.ok && data.isLocked) {
        setLockoutSeconds(data.resetSeconds || 3600);
        setErrorMsg(data.error || "Account locked. Please wait 1 hour before trying again.");
        return false;
      }
    } catch {
      // Non-blocking fallback
    }
    return true;
  };

  // Record an authentication failure and check remaining attempts
  const recordAuthFailure = async (identifier: string) => {
    if (!identifier) return;
    try {
      const res = await fetch("/api/auth/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "record_failure", identifier }),
      });
      const data = await res.json();
      if (data.isLocked) {
        setLockoutSeconds(data.resetSeconds || 3600);
        setErrorMsg(data.error);
      } else if (data.message) {
        setErrorMsg(data.message);
      }
    } catch {
      // Non-blocking fallback
    }
  };

  // Reset rate limit on successful authentication
  const resetAuthRateLimit = async (identifier: string) => {
    if (!identifier) return;
    try {
      await fetch("/api/auth/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", identifier }),
      });
    } catch {
      // Non-blocking
    }
  };

  const redirectByRole = (role?: string) => {
    if (role === "admin") {
      router.push("/admin/payments");
    } else if (role === "owner") {
      router.push("/owner/dashboard");
    } else if (redirectParam && redirectParam.startsWith("/")) {
      router.push(redirectParam);
    } else {
      router.push("/my-bookings");
    }
  };

  // -------------------------------------------------------------
  // 1-CLICK GOOGLE SIGN IN (100% Free Social Auth)
  // -------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await signInWithGoogle("guest");
      setLoading(false);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        redirectByRole(res.role || "guest");
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || "Failed to sign in with Google.");
    }
  };

  // -------------------------------------------------------------
  // 1. OPTION 1: PHONE OTP (Firebase Free SMS)
  // -------------------------------------------------------------
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const clean = phone.replace(/\D/g, "");
    if (clean.length < 10) {
      setErrorMsg("Please enter a valid 10-digit Indian phone number.");
      setLoading(false);
      return;
    }

    try {
      const res = await signInWithPhoneOtp(clean, "recaptcha-container");
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setPhoneOtpSent(true);
        setPhoneTimer(45);
        if (res.isMock) {
          setSuccessMsg(
            `Preview Mode: SMS OTP simulated for +91 ${clean.slice(-10)}. Enter any 6-digit code (e.g. 123456) to sign in.`
          );
        } else {
          setSuccessMsg(
            `SMS OTP sent via Firebase Free SMS Gateway to +91 ${clean.slice(-10)}.`
          );
        }
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || "Failed to send Phone OTP");
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (lockoutSeconds > 0) {
      setErrorMsg(`Security lockout active: maximum failed attempts reached. Please wait ${formatLockoutTime(lockoutSeconds)} before retrying.`);
      return;
    }

    if (phoneOtpToken.length !== 6) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }

    const clean = phone.replace(/\D/g, "");
    const isAllowed = await checkRateLimitBeforeAttempt(clean);
    if (!isAllowed) return;

    setLoading(true);
    const res = await verifyPhoneOtp(phone, phoneOtpToken);
    setLoading(false);

    if (res.error) {
      await recordAuthFailure(clean);
    } else {
      await resetAuthRateLimit(clean);
      redirectByRole(res.role);
    }
  };

  // -------------------------------------------------------------
  // 2. OPTION 4: EMAIL OTP (Supabase Free Email OTP)
  // -------------------------------------------------------------
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (lockoutSeconds > 0) {
      setErrorMsg(`Security lockout active: maximum failed attempts reached. Please wait ${formatLockoutTime(lockoutSeconds)}.`);
      return;
    }

    if (!emailForOtp || !emailForOtp.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await signInWithEmailOtp(emailForOtp);
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setEmailOtpSent(true);
        setEmailTimer(45);
        if (res.isMock) {
          setSuccessMsg(
            `Preview Mode: Email OTP simulated for ${emailForOtp}. Enter any 6-digit code (e.g. 123456) to sign in.`
          );
        } else {
          setSuccessMsg(
            `6-digit sign-in code sent to ${emailForOtp}. Please check your inbox & spam folder.`
          );
        }
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || "Failed to send Email OTP");
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (lockoutSeconds > 0) {
      setErrorMsg(`Security lockout active: maximum failed attempts reached. Please wait ${formatLockoutTime(lockoutSeconds)}.`);
      return;
    }

    if (emailOtpToken.length !== 6) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }

    const isAllowed = await checkRateLimitBeforeAttempt(emailForOtp);
    if (!isAllowed) return;

    setLoading(true);
    const res = await verifyEmailOtp(emailForOtp, emailOtpToken);
    setLoading(false);

    if (res.error) {
      await recordAuthFailure(emailForOtp);
    } else {
      await resetAuthRateLimit(emailForOtp);
      redirectByRole(res.role);
    }
  };

  // -------------------------------------------------------------
  // 3. PASSWORD LOGIN
  // -------------------------------------------------------------
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPendingApprovalNotice(false);

    if (lockoutSeconds > 0) {
      setErrorMsg(`Security lockout active: maximum failed attempts reached. Please wait ${formatLockoutTime(lockoutSeconds)}.`);
      return;
    }

    const isAllowed = await checkRateLimitBeforeAttempt(passwordEmail);
    if (!isAllowed) return;

    setLoading(true);
    const res = await signInWithEmail(passwordEmail, password);
    setLoading(false);

    if (res.approvalStatus === "pending") {
      setPendingApprovalNotice(true);
      setErrorMsg(res.error || "Your hotel owner application is pending approval by the Admin.");
    } else if (res.error) {
      await recordAuthFailure(passwordEmail);
    } else {
      await resetAuthRateLimit(passwordEmail);
      redirectByRole(res.role);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-7 sm:p-8 rounded-3xl border border-konkan-sand-200 shadow-xl space-y-6">
        {/* Invisible container required for Firebase reCAPTCHA */}
        <div id="recaptcha-container" />

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-konkan-teal-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Waves className="w-6 h-6 text-konkan-teal-200" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Log in to bhramo<span className="text-konkan-teal-600">.com</span>
          </h1>
          <p className="text-xs text-slate-500">
            Dapoli & Harnai Coastal Booking & Host Portal
          </p>
        </div>

        {/* Notice if redirected from Booking attempt */}
        {redirectParam && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center gap-2.5 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <strong className="block font-bold">Sign In Required to Book</strong>
              <span className="text-[11px] text-amber-800">
                You can freely inspect hotel details and rates, but you must be signed in to confirm reservations.
              </span>
            </div>
          </div>
        )}

        {/* 1-Click Google Sign In (100% Free Social Auth) */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-xs transition-all shadow-xs hover:shadow flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-slate-800">Continue with Google</span>
            <span className="ml-auto text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              1-Click
            </span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
              Or continue with OTP / Password
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>
        </div>

        {/* Authentication Mode Tabs: Phone OTP (1), Email OTP (4), Password */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-konkan-sand-100 rounded-2xl border border-konkan-sand-200">
          <button
            type="button"
            onClick={() => {
              setAuthMode("phone_otp");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              authMode === "phone_otp"
                ? "bg-white text-konkan-teal-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-konkan-teal-600 shrink-0" />
            <span className="truncate">Phone OTP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode("email_otp");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              authMode === "email_otp"
                ? "bg-white text-konkan-teal-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-konkan-teal-600 shrink-0" />
            <span className="truncate">Email OTP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode("password");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              authMode === "password"
                ? "bg-white text-konkan-teal-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-konkan-teal-600 shrink-0" />
            <span className="truncate">Password</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {pendingApprovalNotice && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2 text-xs shadow-sm">
            <div className="flex items-center gap-2 font-black text-amber-900">
              <Clock className="w-4 h-4 text-amber-700 animate-pulse shrink-0" />
              <span>Owner Account Verification In Progress</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              Your hotel owner application is currently awaiting administrator review. Once verified, you will be authorized to log in to the Owner Console and access all bookings, guest contacts, and revenue details.
            </p>
            <div className="pt-1.5 flex items-center justify-between border-t border-amber-200 text-[11px]">
              <span className="text-amber-800">Need expedited approval?</span>
              <a
                href="https://wa.me/919422388200?text=Hello%20Bhramo%20Admin%2C%20please%20check%20my%20pending%20hotel%20owner%20application."
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-amber-900 underline hover:text-amber-950"
              >
                WhatsApp Admin Desk &rarr;
              </a>
            </div>
          </div>
        )}

        {/* Security Lockout Banner with Live Countdown */}
        {lockoutSeconds > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-2 text-xs shadow-md">
            <div className="flex items-center justify-between font-black text-rose-900">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />
                <span>Security Lockout Active</span>
              </div>
              <span className="font-mono bg-rose-200 text-rose-900 px-2.5 py-1 rounded-lg text-xs font-bold">
                {formatLockoutTime(lockoutSeconds)}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-800">
              Maximum failed attempts reached (3 for Hotel Owners, 5 for Guests). Authentication is locked for 1 hour to prevent brute-force attacks.
            </p>
          </div>
        )}

        {errorMsg && !pendingApprovalNotice && lockoutSeconds <= 0 && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* OPTION 1: PHONE OTP (Firebase 10,000 Free SMS Gateway) */}
        {/* ========================================================= */}
        {authMode === "phone_otp" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-konkan-teal-600" />
                SMS Route: {isFirebaseConfigured ? "Firebase Free SMS Active" : "Instant OTP Enabled"}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded">
                100% Free
              </span>
            </div>

            {!phoneOtpSent ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="98220 12345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-16 pr-3 py-2.5 border border-konkan-sand-300 rounded-xl text-sm font-medium bg-konkan-sand-50/50 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter your 10-digit number. We will send an SMS OTP for login.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? "Sending SMS OTP..." : "Get SMS Verification Code"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Enter 6-Digit SMS Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={phoneOtpToken}
                    onChange={(e) => setPhoneOtpToken(e.target.value)}
                    className="w-full text-center py-2.5 tracking-widest text-lg font-mono font-bold border border-konkan-sand-300 rounded-xl bg-konkan-sand-50/50 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                    <span>Sent to +91 {phone.replace(/\D/g, "").slice(-10)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneOtpSent(false);
                        setPhoneOtpToken("");
                      }}
                      className="text-konkan-teal-700 font-semibold hover:underline"
                    >
                      Change number
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? "Verifying Code..." : "Verify & Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-1">
                  {phoneTimer > 0 ? (
                    <span className="text-[11px] text-slate-400">
                      Resend SMS in {phoneTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      className="text-[11px] text-konkan-teal-700 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Resend SMS Code
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* OPTION 4: EMAIL OTP (Supabase Free Email OTP / Magic Code) */}
        {/* ========================================================= */}
        {authMode === "email_otp" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-konkan-teal-600" />
                No password needed — Instant 6-digit Email code
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded">
                100% Free
              </span>
            </div>

            {!emailOtpSent ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="guest@example.com"
                      value={emailForOtp}
                      onChange={(e) => setEmailForOtp(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-konkan-sand-300 rounded-xl text-sm bg-konkan-sand-50/50 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    We will send a 6-digit login code directly to your email inbox.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? "Sending Email Code..." : "Send Login Code to Email"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Enter 6-Digit Email Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={emailOtpToken}
                    onChange={(e) => setEmailOtpToken(e.target.value)}
                    className="w-full text-center py-2.5 tracking-widest text-lg font-mono font-bold border border-konkan-sand-300 rounded-xl bg-konkan-sand-50/50 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                    <span className="truncate max-w-[200px]">Sent to {emailForOtp}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailOtpSent(false);
                        setEmailOtpToken("");
                      }}
                      className="text-konkan-teal-700 font-semibold hover:underline"
                    >
                      Change email
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? "Verifying Code..." : "Verify & Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-1">
                  {emailTimer > 0 ? (
                    <span className="text-[11px] text-slate-400">
                      Resend email in {emailTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      className="text-[11px] text-konkan-teal-700 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Resend Email Code
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* OPTION 3: PASSWORD LOGIN */}
        {/* ========================================================= */}
        {authMode === "password" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={passwordEmail}
                  onChange={(e) => setPasswordEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-konkan-sand-300 rounded-xl text-sm bg-konkan-sand-50/50 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-konkan-sand-300 rounded-xl text-sm bg-konkan-sand-50/50 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : "Sign In with Password"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Demo Fast Login Buttons (Quick Evaluation) */}
        <div className="pt-2 border-t border-konkan-sand-200 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant Demo / Test Roles:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                demoLogin("guest");
                if (redirectParam && redirectParam.startsWith("/")) {
                  router.push(redirectParam);
                }
              }}
              className="p-2 text-xs font-semibold rounded-xl border border-konkan-teal-300 bg-konkan-teal-50 text-konkan-teal-900 hover:bg-konkan-teal-100 transition-colors text-left"
            >
              <div className="font-bold">Guest</div>
              <div className="text-[10px] text-slate-500">&rarr; Bookings</div>
            </button>

            <button
              type="button"
              onClick={() => demoLogin("owner")}
              className="p-2 text-xs font-semibold rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors text-left"
            >
              <div className="font-bold">Owner</div>
              <div className="text-[10px] text-slate-500">&rarr; Host Panel</div>
            </button>

            <button
              type="button"
              onClick={() => demoLogin("admin")}
              className="p-2 text-xs font-semibold rounded-xl border border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-100 transition-colors text-left"
            >
              <div className="font-bold">Admin</div>
              <div className="text-[10px] text-slate-500">&rarr; /admin/payments</div>
            </button>
          </div>
        </div>

        {/* Link to Signup */}
        <div className="text-center pt-1 text-xs text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href={redirectParam ? `/signup?redirect=${encodeURIComponent(redirectParam)}` : "/signup"}
            className="font-bold text-konkan-teal-700 hover:underline"
          >
            Create an Account &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
