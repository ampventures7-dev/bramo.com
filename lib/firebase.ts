/**
 * Firebase Client Integration for Free Phone SMS OTP (Option 1)
 *
 * Uses Google's official Firebase CDN to provide 10,000 Free Phone SMS OTPs
 * per month in India without heavy server bundle bloat or module resolution issues.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if actual Firebase credentials have been configured in .env.local
export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your-firebase-api-key" &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "your-firebase-project-id"
);

/**
 * Dynamically injects Google's Firebase SDK script into the browser on demand.
 */
async function ensureFirebaseLoaded(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if ((window as any).firebase?.auth) return true;

  return new Promise((resolve) => {
    const existingAppScript = document.getElementById("firebase-app-script");
    if (!existingAppScript) {
      const scriptApp = document.createElement("script");
      scriptApp.id = "firebase-app-script";
      scriptApp.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js";
      scriptApp.async = true;

      scriptApp.onload = () => {
        const scriptAuth = document.createElement("script");
        scriptAuth.id = "firebase-auth-script";
        scriptAuth.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js";
        scriptAuth.async = true;

        scriptAuth.onload = () => resolve(true);
        scriptAuth.onerror = () => {
          console.error("Failed to load Firebase Auth SDK from CDN");
          resolve(false);
        };
        document.head.appendChild(scriptAuth);
      };

      scriptApp.onerror = () => {
        console.error("Failed to load Firebase App SDK from CDN");
        resolve(false);
      };

      document.head.appendChild(scriptApp);
    } else {
      // Script already added, wait for global object
      const interval = setInterval(() => {
        if ((window as any).firebase?.auth) {
          clearInterval(interval);
          resolve(true);
        }
      }, 50);
      setTimeout(() => {
        clearInterval(interval);
        resolve(Boolean((window as any).firebase?.auth));
      }, 3000);
    }
  });
}

/**
 * Initializes Firebase App instance in browser
 */
export async function getFirebaseAuth(): Promise<any> {
  if (typeof window === "undefined" || !isFirebaseConfigured) return null;

  const loaded = await ensureFirebaseLoaded();
  if (!loaded) return null;

  const fb = (window as any).firebase;
  if (!fb) return null;

  if (!fb.apps || fb.apps.length === 0) {
    fb.initializeApp(firebaseConfig);
  }

  return fb.auth();
}

/**
 * Initializes or retrieves an invisible RecaptchaVerifier on the specified HTML container ID.
 */
export async function setupRecaptchaVerifier(
  containerId: string = "recaptcha-container"
): Promise<any> {
  if (typeof window === "undefined" || !isFirebaseConfigured) return null;

  const auth = await getFirebaseAuth();
  if (!auth) return null;

  const fb = (window as any).firebase;

  // Clear existing if any attached
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch {
      // ignore
    }
    (window as any).recaptchaVerifier = null;
  }

  try {
    const verifier = new fb.auth.RecaptchaVerifier(containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        console.warn("Recaptcha expired. Please retry.");
      },
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  } catch (err) {
    console.error("Failed to initialize RecaptchaVerifier:", err);
    return null;
  }
}

/**
 * Request SMS OTP via Firebase 10,000 Free SMS tier
 */
export async function sendFirebasePhoneOtp(
  phone: string,
  containerId: string = "recaptcha-container"
): Promise<{ success: boolean; confirmationResult?: any; error?: string; isMock?: boolean }> {
  // Format to E.164: +919876543210
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? `+${cleanPhone}` : `+91${cleanPhone}`;

  if (!isFirebaseConfigured) {
    // Graceful preview simulation
    return {
      success: true,
      isMock: true,
    };
  }

  const auth = await getFirebaseAuth();
  if (!auth) {
    return {
      success: false,
      error: "Firebase Auth SDK could not be loaded. Please check network connection.",
    };
  }

  let verifier = (window as any).recaptchaVerifier;
  if (!verifier) {
    verifier = await setupRecaptchaVerifier(containerId);
  }

  if (!verifier) {
    return { success: false, error: "Unable to initialize reCAPTCHA security verifier." };
  }

  try {
    const confirmationResult = await auth.signInWithPhoneNumber(formattedPhone, verifier);
    return { success: true, confirmationResult, isMock: false };
  } catch (err: any) {
    console.error("Firebase send OTP error:", err);
    // Reset recaptcha so user can retry
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch {
        // ignore
      }
      (window as any).recaptchaVerifier = null;
    }
    return {
      success: false,
      error: err.message || "Failed to send SMS OTP via Firebase.",
    };
  }
}
