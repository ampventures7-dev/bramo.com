import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.bhramo.com"),
  title: {
    default: "bhramo.com — Coastal Hotels, Beach Resorts & Homestays in Dapoli & Harnai",
    template: "%s | bhramo.com",
  },
  description:
    "Discover authentic beachfront cottages, luxury sea-facing resorts, and rustic Konkani homestays across Dapoli, Murud, Ladghar, Karde, and Harnai in Maharashtra. Direct UPI verification with 0% extra gateway fees.",
  keywords: [
    "Hotels in Dapoli",
    "Hotels in Harnai",
    "Dapoli beach resorts",
    "Murud beach hotels Dapoli",
    "Ladghar beach cottages",
    "Karde beach resort",
    "Suvarnadurg sea fort stay",
    "Konkan homestays",
    "Konkan coastal tourism",
    "Dolphin safari Dapoli",
    "Tamas Teertha Ladghar stay",
    "bhramo.com",
  ],
  authors: [{ name: "bhramo.com Coastal Team" }],
  creator: "bhramo.com",
  publisher: "bhramo.com",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo-icon.png", type: "image/png" },
    ],
    apple: "/logo-icon.png",
  },
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: "https://www.bhramo.com",
  },
  other: {
    "geo.region": "IN-MH",
    "geo.placename": "Dapoli, Harnai, Ratnagiri, Maharashtra, India",
    "geo.position": "17.7562;73.1895",
    "ICBM": "17.7562, 73.1895",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.bhramo.com",
    siteName: "bhramo.com",
    title: "bhramo.com — Coastal Hotels, Beach Resorts & Homestays in Dapoli & Harnai",
    description:
      "Handpicked beachfront resorts and authentic Konkani cottages in Dapoli and Harnai, Maharashtra. Direct booking with 0% gateway commission.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&h=630&q=80",
        width: 1200,
        height: 630,
        alt: "bhramo.com - Coastal Hotels in Dapoli and Harnai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "bhramo.com — Coastal Hotels & Resorts in Dapoli & Harnai",
    description:
      "Handpicked beachfront resorts and authentic Konkani cottages in Dapoli and Harnai, Maharashtra.",
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&h=630&q=80",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TravelAgency", "Organization"],
        "@id": "https://www.bhramo.com/#organization",
        "name": "bhramo.com",
        "url": "https://www.bhramo.com",
        "logo": "https://www.bhramo.com/logo.png",
        "description": "Authentic coastal hospitality, beach resorts, dolphin safari stays, and homestays platform for Dapoli and Harnai, Konkan, Maharashtra.",
        "areaServed": [
          {
            "@type": "AdministrativeArea",
            "name": "Dapoli, Ratnagiri, Maharashtra, India",
          },
          {
            "@type": "AdministrativeArea",
            "name": "Harnai, Ratnagiri, Maharashtra, India",
          },
          {
            "@type": "AdministrativeArea",
            "name": "Konkan Coastline, Maharashtra, India",
          },
        ],
        "knowsAbout": [
          "Hotels in Dapoli",
          "Beach Resorts in Harnai",
          "Konkan Coastal Tourism",
          "Dolphin Safari in Dapoli",
          "Suvarnadurg Sea Fort Boat Rides",
          "Ladghar Beach Resorts",
          "Karde Beach Homestays",
          "Murud Beach Water Sports",
          "Konkani Cuisine and Seafood",
        ],
        "sameAs": [
          "https://en.wikipedia.org/wiki/Dapoli",
          "https://en.wikipedia.org/wiki/Harnai",
          "https://en.wikipedia.org/wiki/Suvarnadurg",
        ],
        "priceRange": "₹1500 - ₹9000 INR",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91-7447568595",
          "contactType": "customer service",
          "availableLanguage": ["English", "Marathi", "Hindi"],
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://www.bhramo.com/#website",
        "url": "https://www.bhramo.com",
        "name": "bhramo.com",
        "publisher": { "@id": "https://www.bhramo.com/#organization" },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://www.bhramo.com/hotels?area={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className={`${jakarta.variable} ${jakarta.className} min-h-screen flex flex-col bg-[#faf8f5] text-slate-800 antialiased overflow-x-hidden w-full selection:bg-konkan-teal-100 selection:text-konkan-teal-900`}>
        <AuthProvider>
          <LanguageProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
