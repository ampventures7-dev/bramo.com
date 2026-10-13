"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "mr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const DICTIONARY: Record<string, Record<Language, string>> = {
  // Navigation
  "nav.home": { en: "Home", mr: "मुख्यपृष्ठ" },
  "nav.hotels": { en: "Hotels", mr: "हॉटेल्स व कॉटेज" },
  "nav.experiences": { en: "Experiences", mr: "स्थानिक अनुभव" },
  "nav.my_bookings": { en: "My Bookings", mr: "माझी बुकिंग्स" },
  "nav.owner_dashboard": { en: "Owner Dashboard", mr: "मालक डॅशबोर्ड" },
  "nav.admin_portal": { en: "Admin Portal", mr: "प्रशासक पोर्टल" },
  "nav.login": { en: "Host / Guest Login", mr: "लॉगिन करा" },
  "nav.logout": { en: "Sign Out", mr: "बाहेर पडा" },
  "nav.subtitle": { en: "Dapoli & Harnai Stays", mr: "दापोली आणि हर्णे निवास" },

  // Booking & Actions
  "action.book_now": { en: "Book Now", mr: "आता बुक करा" },
  "action.view_details": { en: "View Details", mr: "तपशील पहा" },
  "action.search": { en: "Search Stays", mr: "निवास शोधा" },
  "action.print_pass": { en: "Download Offline Pass", mr: "ऑफलाइन पास डाउनलोड करा" },
  "action.view_route": { en: "Driving Route Guide", mr: "प्रवास मार्ग व फेरी" },
  "action.contact_host": { en: "Contact Host on WhatsApp", mr: "व्हॉट्सअ‍ॅपवर संपर्क साधा" },

  // Statuses
  "status.confirmed": { en: "Confirmed", mr: "निश्चित" },
  "status.pending_verification": { en: "Pending Verification", mr: "UPI पडताळणी प्रलंबित" },
  "status.requested": { en: "10-Min Hold", mr: "१० मिनिटे राखीव" },
  "status.cancelled": { en: "Cancelled", mr: "रद्द केलेले" },
  "status.completed": { en: "Completed", mr: "पूर्ण झाले" },

  // Labels
  "label.check_in": { en: "Check-in", mr: "चेक-इन" },
  "label.check_out": { en: "Check-out", mr: "चेक-आउट" },
  "label.guests": { en: "Guests", mr: "पाहुणे" },
  "label.rooms": { en: "Rooms", mr: "खोल्या" },
  "label.per_night": { en: "/night", mr: "/रात्र" },
  "label.advance_fee": { en: "15% Advance Platform Fee", mr: "१५% अ‍ॅडव्हान्स बुकिंग शुल्क" },
  "label.balance_due": { en: "Balance to Pay at Hotel", mr: "हॉटेलवर देय शिल्लक रक्कम" },
  "label.total_amount": { en: "Total Amount", mr: "एकूण रक्कम" },
  "label.verified_stay": { en: "Verified Konkan Stay", mr: "प्रमाणित कोकणी निवास" },

  // Host Direct Contact Policy
  "policy.host_unlocked": {
    en: "Host direct phone and key instructions are unlocked upon booking verification.",
    mr: "बुकिंग निश्चित झाल्यावर मालकांचा थेट फोन नंबर आणि पत्ता उपलब्ध होतो."
  },
  "policy.zero_fees": {
    en: "0% Gateway Surcharge · Direct UPI QR Payment",
    mr: "०% गेटवे फी · थेट UPI QR पेमेंट"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_LANG_KEY = "bhramo_preferred_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY) as Language | null;
      if (saved === "en" || saved === "mr") {
        setLanguageState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // ignore
    }
  };

  const t = (key: string, fallback?: string): string => {
    const entry = DICTIONARY[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    return fallback || entry?.["en"] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "en" as Language,
      setLanguage: () => {},
      t: (key: string, fallback?: string) => fallback || key,
    };
  }
  return context;
}
