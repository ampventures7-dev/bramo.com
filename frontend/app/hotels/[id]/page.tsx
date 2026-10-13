import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchHotelById, fetchAllHotels } from "@/lib/hotels-service";
import { HotelDetailClient } from "@/components/HotelDetailClient";

export const revalidate = 60;

// Generate static params for all seed hotels for super fast static rendering
export async function generateStaticParams() {
  const hotels = await fetchAllHotels();
  return hotels.map((h) => ({
    id: h.id,
  }));
}

// 1. Dynamic Metadata per Hotel Page (SEO, Open Graph & Twitter)
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const hotel = await fetchHotelById(params.id);

  if (!hotel) {
    return {
      title: "Hotel Not Found | bhramo.com",
      description: "The requested coastal stay could not be found.",
    };
  }

  const title = `${hotel.name} — Beachfront Stay in ${hotel.area}, Dapoli | from ₹${hotel.starting_price}`;
  const description =
    hotel.description?.slice(0, 155) ||
    `Book ${hotel.name} in ${hotel.area}, Maharashtra. Sea-facing cottages, authentic Konkani dining, and direct owner WhatsApp support.`;

  const heroImage =
    hotel.images && hotel.images[0]
      ? hotel.images[0]
      : "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&h=630&q=80";

  return {
    title,
    description,
    keywords: [
      hotel.name,
      `Hotels in ${hotel.area}`,
      `${hotel.name} Dapoli`,
      "Konkan beach resort",
      "Murud beach hotels",
      "Suvarnadurg sea fort stay",
      hotel.area === "Dapoli" ? "Dapoli homestay" : "Harnai hotel",
    ],
    alternates: {
      canonical: `https://bhramo.com/hotels/${hotel.id}`,
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: `https://bhramo.com/hotels/${hotel.id}`,
      title,
      description,
      siteName: "bhramo.com",
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: `${hotel.name} - ${hotel.area}, Dapoli`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [heroImage],
    },
  };
}

export default async function HotelPage({ params }: { params: { id: string } }) {
  const hotel = await fetchHotelById(params.id);

  if (!hotel) {
    notFound();
  }

  const highestPrice =
    hotel.room_types && hotel.room_types.length > 0
      ? Math.max(...hotel.room_types.map((r) => r.weekend_price || r.base_price))
      : hotel.starting_price + 1500;

  // 2. Comprehensive JSON-LD Schema (Hotel, LodgingBusiness, AggregateRating & Breadcrumbs)
  const hotelJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Hotel", "LodgingBusiness"],
        "@id": `https://bhramo.com/hotels/${hotel.id}#hotel`,
        "name": hotel.name,
        "description": hotel.description,
        "url": `https://bhramo.com/hotels/${hotel.id}`,
        "telephone": `+${hotel.whatsapp_number || "919422388200"}`,
        "priceRange": `₹${hotel.starting_price} - ₹${highestPrice}`,
        "image": hotel.images || [],
        "checkinTime": hotel.checkin_time || "12:00",
        "checkoutTime": hotel.checkout_time || "10:00",
        "starRating": {
          "@type": "Rating",
          "ratingValue": hotel.average_rating || 4.8,
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": hotel.average_rating || 4.8,
          "reviewCount": hotel.review_count || 45,
          "bestRating": "5",
          "worstRating": "1",
        },
        "address": {
          "@type": "PostalAddress",
          "streetAddress": hotel.address,
          "addressLocality": hotel.area,
          "addressRegion": "Maharashtra",
          "postalCode": "415712",
          "addressCountry": "IN",
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": hotel.lat,
          "longitude": hotel.lng,
        },
        "amenityFeature": (hotel.amenities || []).map((amenity) => ({
          "@type": "LocationFeatureSpecification",
          "name": amenity,
          "value": true,
        })),
        "containsPlace": (hotel.room_types || []).map((room) => ({
          "@type": "HotelRoom",
          "name": room.name,
          "occupancy": {
            "@type": "QuantitativeValue",
            "maxValue": room.capacity,
          },
          "offers": {
            "@type": "Offer",
            "price": room.base_price,
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock",
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://bhramo.com/hotels/${hotel.id}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://bhramo.com",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Hotels & Stays",
            "item": "https://bhramo.com/hotels",
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `Hotels in ${hotel.area}`,
            "item": `https://bhramo.com/hotels/${hotel.area.toLowerCase()}`,
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": hotel.name,
            "item": `https://bhramo.com/hotels/${hotel.id}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      {/* Schema.org Microdata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <HotelDetailClient hotel={hotel} />
      </div>
    </>
  );
}
