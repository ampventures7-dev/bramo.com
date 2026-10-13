import { Suspense } from "react";
import type { Metadata } from "next";
import { fetchAllHotels } from "@/lib/hotels-service";
import { HotelsExplorer } from "@/components/HotelsExplorer";
import HotelsLoading from "./loading";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Explore Coastal Hotels & Beach Resorts in Dapoli & Harnai",
  description:
    "Browse verified beachfront resorts, rustic cottages, and authentic homestays in Dapoli and Harnai, Maharashtra. Direct UPI payments with 0% gateway fees.",
  keywords: [
    "Hotels in Dapoli",
    "Hotels in Harnai",
    "Dapoli resorts",
    "Harnai homestays",
    "Murud beach stays",
    "Ladghar beach cottages",
    "Konkan hotel booking",
  ],
  alternates: {
    canonical: "https://bhramo.com/hotels",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://bhramo.com/hotels",
    title: "Explore Coastal Hotels & Beach Resorts in Dapoli & Harnai | bhramo.com",
    description:
      "Browse verified beachfront resorts, rustic cottages, and authentic homestays in Dapoli and Harnai, Maharashtra.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&h=630&q=80",
        width: 1200,
        height: 630,
        alt: "bhramo.com - Dapoli & Harnai Hotels Catalog",
      },
    ],
  },
};

export default async function HotelsPage() {
  const hotels = await fetchAllHotels();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Suspense fallback={<HotelsLoading />}>
        <HotelsExplorer initialHotels={hotels} />
      </Suspense>
    </div>
  );
}
