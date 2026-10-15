import { HotelWithDetails } from "@/lib/hotels-service";

export type TripDuration = "2_days" | "3_days" | "4_days";
export type TravelerType = "couple" | "family" | "friends" | "solo";
export type BudgetTier = "budget" | "mid" | "luxury";

export interface TripPlannerInput {
  duration: TripDuration;
  travelerType: TravelerType;
  interests: string[];
  budget: BudgetTier;
  transport?: "car" | "train_khed" | "bus";
}

export interface ActivitySlot {
  time: string; // e.g. "07:30 AM"
  period: "morning" | "afternoon" | "sunset" | "night";
  title: string;
  tagline: string;
  location: string;
  category: "safari" | "beach" | "food" | "heritage" | "adventure" | "nature" | "sunset";
  estimatedCost?: string;
  insiderTip: string;
}

export interface DayItinerary {
  dayNumber: number;
  theme: string;
  focusArea: "Murud & Karde" | "Harnai & Suvarnadurg" | "Ladghar & Burondi" | "Dapoli Heritage";
  summary: string;
  activities: ActivitySlot[];
  recommendedStay?: {
    id: string;
    name: string;
    area: string;
    price: number;
    rating: number;
    image: string;
    highlights: string[];
  };
}

export interface GeneratedTripPlan {
  title: string;
  tagline: string;
  durationLabel: string;
  travelerLabel: string;
  estimatedBudget: {
    totalMin: number;
    totalMax: number;
    stayCost: number;
    foodCost: number;
    activityCost: number;
  };
  bestSeasonNote: string;
  tideAndRouteAdvisory: string;
  days: DayItinerary[];
}

/**
 * Verified Konkan Travel Points of Interest (Clustered to prevent travel fatigue)
 */
export interface KonkanSpot {
  id: string;
  title: string;
  tagline: string;
  cluster: "harnai" | "murud_karde" | "ladghar" | "dapoli_town";
  category: "safari" | "beach" | "food" | "heritage" | "adventure" | "nature" | "sunset";
  idealPeriod: "morning" | "afternoon" | "sunset" | "night";
  personaWeights: {
    couple: number;
    family: number;
    friends: number;
    solo: number;
  };
  durationMins: number;
  costText: string;
  insiderTip: string;
}

export const KONKAN_SPOTS: KonkanSpot[] = [
  // Cluster 1: Murud & Karde (Central)
  {
    id: "murud-dolphin-safari",
    title: "Murud Beach Early Morning Dolphin Boat Safari",
    tagline: "Watch wild Indo-Pacific humpback dolphins jumping in the calm sunrise waters",
    cluster: "murud_karde",
    category: "safari",
    idealPeriod: "morning",
    personaWeights: { couple: 5, family: 5, friends: 4, solo: 4 },
    durationMins: 60,
    costText: "₹350 per seat",
    insiderTip: "Board before 07:30 AM. The sea is glassy smooth and dolphins are most active right after daybreak.",
  },
  {
    id: "murud-watersports",
    title: "Murud Beach High-Speed Watersports",
    tagline: "Jet Ski rides, Banana tube boat, and ATV sand rides right on the shoreline",
    cluster: "murud_karde",
    category: "adventure",
    idealPeriod: "morning",
    personaWeights: { couple: 3, family: 4, friends: 5, solo: 3 },
    durationMins: 90,
    costText: "₹600 - ₹1,200 combo",
    insiderTip: "Lifejackets are mandatory and provided. Negotiate combo packages if traveling in a group.",
  },
  {
    id: "asud-keshavraj-trek",
    title: "Keshavraj Temple Ancient Betel-Nut Jungle Trail",
    tagline: "A mystical 1000-year-old Vishnu temple nestled in a dense canopy of coconut palms",
    cluster: "murud_karde",
    category: "heritage",
    idealPeriod: "morning",
    personaWeights: { couple: 5, family: 4, friends: 3, solo: 5 },
    durationMins: 90,
    costText: "Free Entry",
    insiderTip: "Cross the wooden suspension bridge across the gurgling natural spring. Wear slip-resistant footwear.",
  },
  {
    id: "karde-sunset-stroll",
    title: "Karde Beach Serene White Sand Stroll",
    tagline: "Uncrowded, wide white sand beach lined with casuarina groves and crashing waves",
    cluster: "murud_karde",
    category: "beach",
    idealPeriod: "sunset",
    personaWeights: { couple: 5, family: 4, friends: 4, solo: 5 },
    durationMins: 60,
    costText: "Free",
    insiderTip: "One of the safest beaches for barefoot sunset walking. Look for tiny red ghost crabs along the tide line.",
  },

  // Cluster 2: Harnai & Suvarnadurg (North)
  {
    id: "suvarnadurg-sea-fort",
    title: "Suvarnadurg Sea Fort Wooden Boat Crossing",
    tagline: "Chhatrapati Shivaji Maharaj's impregnable naval island fortress standing inside the Arabian Sea",
    cluster: "harnai",
    category: "heritage",
    idealPeriod: "morning",
    personaWeights: { couple: 4, family: 5, friends: 5, solo: 5 },
    durationMins: 120,
    costText: "₹150 - ₹200 ferry boat roundtrip",
    insiderTip: "Carry cash. Boats operate from Harnai Bunder based on tide heights. Look for the carved tiger reliefs at the main gate.",
  },
  {
    id: "harnai-fish-auction",
    title: "Famous Harnai Beach Daily Trawler Fish Auction",
    tagline: "Hundreds of colorful wooden trawlers beach at 4 PM for Maharashtra's oldest live beach auction",
    cluster: "harnai",
    category: "food",
    idealPeriod: "afternoon",
    personaWeights: { couple: 4, family: 4, friends: 5, solo: 5 },
    durationMins: 75,
    costText: "Free to witness (Fish purchase optional)",
    insiderTip: "The auction strictly starts at 3:45 PM. You can buy fresh Pomfret or Surmai and have nearby homestays fry it for dinner!",
  },
  {
    id: "anjarle-kadyawarcha-ganpati",
    title: "Anjarle Kadyawarcha Ganpati Cliffside Temple",
    tagline: "Historic Ganesha shrine perched atop a steep cliff overlooking the Jog river estuary",
    cluster: "harnai",
    category: "heritage",
    idealPeriod: "morning",
    personaWeights: { couple: 4, family: 5, friends: 3, solo: 4 },
    durationMins: 60,
    costText: "Free entry",
    insiderTip: "Climb up to the stone balcony for a panoramic view of the Jog river meeting the Arabian Sea at Harnai bay.",
  },
  {
    id: "harnai-lighthouse",
    title: "Harnai Lighthouse & Kanakdurg Sunset Point",
    tagline: "Panoramic 360-degree clifftop views of the fishing fleet and the vast Konkan sea",
    cluster: "harnai",
    category: "nature",
    idealPeriod: "sunset",
    personaWeights: { couple: 5, family: 4, friends: 4, solo: 5 },
    durationMins: 45,
    costText: "Free",
    insiderTip: "The sun sinks straight into the sea directly behind the silhouette of Suvarnadurg fort. Bring your camera.",
  },

  // Cluster 3: Ladghar & Burondi (South)
  {
    id: "ladghar-red-sand",
    title: "Ladghar 'Tamas Tirtha' Red Sand Beach",
    tagline: "Unique terracotta-tinted coastline renowned for reddish sand and religious spiritual heritage",
    cluster: "ladghar",
    category: "beach",
    idealPeriod: "sunset",
    personaWeights: { couple: 5, family: 4, friends: 4, solo: 4 },
    durationMins: 75,
    costText: "Free",
    insiderTip: "In late afternoon, the sea water takes on a mystical reddish glow due to mineral reflections and sunset rays.",
  },
  {
    id: "parshuram-bhumi",
    title: "Parshuram Bhumi 60-Foot Bronze Statue (Burondi)",
    tagline: "Monumental statue of Lord Parshuram standing atop a massive globe over sea cliffs",
    cluster: "ladghar",
    category: "heritage",
    idealPeriod: "afternoon",
    personaWeights: { couple: 4, family: 5, friends: 4, solo: 4 },
    durationMins: 60,
    costText: "Free Entry (₹20 parking)",
    insiderTip: "The ocean breeze here is incredible. Climb into the meditation hall inside the globe structure beneath the statue.",
  },
  {
    id: "kolthare-hidden-beach",
    title: "Kolthare Secluded Coconut Grove Beach",
    tagline: "Pristine, untouched silver-sand bay flanked by betel-nut orchards and an ancient Shiva temple",
    cluster: "ladghar",
    category: "nature",
    idealPeriod: "morning",
    personaWeights: { couple: 5, family: 3, friends: 4, solo: 5 },
    durationMins: 90,
    costText: "Free",
    insiderTip: "Zero commercial crowd. Ideal for travelers seeking complete peace, sea shells, and calm waves.",
  },

  // Food Experiences
  {
    id: "konkani-seafood-thali",
    title: "Authentic Coastal Malvani & Konkani Dining",
    tagline: "Fresh Surmai Rava Fry, Prawns Sukka, and tangy coconut Solkadhi prepared by local hostesses",
    cluster: "dapoli_town",
    category: "food",
    idealPeriod: "afternoon",
    personaWeights: { couple: 5, family: 5, friends: 5, solo: 5 },
    durationMins: 60,
    costText: "₹350 - ₹500 per thali",
    insiderTip: "Always ask for hot Ukadiche Modak (steamed rice dumplings stuffed with jaggery and freshly grated coconut).",
  },
];

/**
 * Deterministic Engine that crafts a rich itinerary without needing an external LLM
 */
export function generateLocalItinerary(
  input: TripPlannerInput,
  hotels: HotelWithDetails[]
): GeneratedTripPlan {
  const numDays = input.duration === "4_days" ? 4 : input.duration === "3_days" ? 3 : 2;

  // 1. Pick ideal hotels based on budget
  const sortedHotels = [...hotels].sort((a, b) => {
    if (input.budget === "budget") return a.starting_price - b.starting_price;
    if (input.budget === "luxury") return b.starting_price - a.starting_price;
    return Math.abs(a.starting_price - 3000) - Math.abs(b.starting_price - 3000);
  });

  const bestHotel = sortedHotels[0] || hotels[0];
  const secondHotel = sortedHotels[1] || bestHotel;

  // 2. Persona descriptors
  const personaMap = {
    couple: "Romantic Coastal Escape for Couples",
    family: "Wholesome Family Holiday in the Konkan",
    friends: "Adventure & Seafood Roadtrip for Friends",
    solo: "Serene Soulful Journey for Solo Travelers",
  };

  // 3. Cluster allocation per day (Strictly prevents road backtracking)
  // Day 1: Murud & Karde (Dolphin safaris, water sports, white sand)
  // Day 2: Harnai & Suvarnadurg (Fort crossing, cliff temple, 4 PM fish auction)
  // Day 3 (if applicable): Ladghar & Burondi (Red sand beach, 60-ft Parshuram statue)
  // Day 4 (if applicable): Hidden Kolthare & Dapoli forest heritage
  const days: DayItinerary[] = [];

  // --- DAY 1 ---
  days.push({
    dayNumber: 1,
    theme: "Dolphins, Golden Shores & Coastal Delights",
    focusArea: "Murud & Karde",
    summary: "Kick off your holiday in the heart of Dapoli's beach country with early morning dolphin spotting and authentic Konkani hospitality.",
    activities: [
      {
        time: "07:30 AM",
        period: "morning",
        title: "Murud Beach Dolphin Boat Safari",
        tagline: "Head out into the calm Arabian Sea to witness wild Indo-Pacific humpback dolphins playing in the sunrise waves.",
        location: "Murud Beach shoreline",
        category: "safari",
        estimatedCost: "₹350 / person",
        insiderTip: "Board early before 8:00 AM. The sea is at its calmest and sighting probability exceeds 90%.",
      },
      {
        time: "09:30 AM",
        period: "morning",
        title: "Konkani Breakfast & Village Stroll",
        tagline: "Savor steaming hot Ghavane (rice crepes) with sweet coconut milk or spicy Kala Vatana curry at a village tea house.",
        location: "Murud Beach Road",
        category: "food",
        estimatedCost: "₹120 / person",
        insiderTip: "Ask for freshly plucked tender coconut water (Shahaale) directly from the wadi plantations.",
      },
      {
        time: "11:30 AM",
        period: "afternoon",
        title: "Keshavraj Temple Betel-Nut Forest Hike",
        tagline: "A shaded 20-minute jungle walk through betel-nut groves, crossing a natural freshwater stream.",
        location: "Asud Village (7 km from Murud)",
        category: "nature",
        estimatedCost: "Free entry",
        insiderTip: "Drink from the natural stone gomukh spring fountain inside the temple courtyard—it flows year-round with sweet mineral water.",
      },
      {
        time: "01:30 PM",
        period: "afternoon",
        title: "Authentic Coastal Surmai Thali & Solkadhi Lunch",
        tagline: "Feast on crispy rava-fried Kingfish (Surmai), spicy Konkani fish curry, and digestive Solkadhi made with kokum.",
        location: "Murud village homestyle dining",
        category: "food",
        estimatedCost: "₹400 / person",
        insiderTip: "Always request a side of Ukadiche Modak (warm steamed jaggery-coconut dumplings drenched in pure ghee).",
      },
      {
        time: "05:15 PM",
        period: "sunset",
        title: "Karde Beach Peaceful White Sand Sunset",
        tagline: "A tranquil wide beach lined with casuarina pine trees, ideal for peaceful walking as the sun meets the horizon.",
        location: "Karde Beach (3 km south of Murud)",
        category: "beach",
        estimatedCost: "Free",
        insiderTip: "Walk towards the southern rocky point. The waves are very gentle here and sunset colors reflect across the flat wet sand.",
      },
    ],
    recommendedStay: bestHotel
      ? {
          id: bestHotel.id,
          name: bestHotel.name,
          area: bestHotel.area,
          price: bestHotel.starting_price,
          rating: bestHotel.average_rating || 4.8,
          image: bestHotel.images[0] || "",
          highlights: bestHotel.amenities.slice(0, 3),
        }
      : undefined,
  });

  // --- DAY 2 ---
  days.push({
    dayNumber: 2,
    theme: "Historic Sea Forts, Cliff Temples & 4 PM Fish Auction",
    focusArea: "Harnai & Suvarnadurg",
    summary: "Explore the northern coastal frontier: Shivaji Maharaj's legendary naval sea fort and Maharashtra's most exciting daily beach fish market.",
    activities: [
      {
        time: "09:00 AM",
        period: "morning",
        title: "Wooden Boat Crossing to Suvarnadurg Sea Fort",
        tagline: "Board a traditional local fishing boat across the waves to explore the 8-acre fort standing entirely within the Arabian Sea.",
        location: "Harnai Bunder harbor (14 km from Murud)",
        category: "heritage",
        estimatedCost: "₹180 / boat ticket",
        insiderTip: "Wear water-friendly footwear as you may need to step into ankle-deep water when landing on the sea rocks.",
      },
      {
        time: "11:45 AM",
        period: "afternoon",
        title: "Anjarle Kadyawarcha Ganpati Cliffside Shrine",
        tagline: "Cross the scenic Jog River bridge to visit the cliff-perched Ganesha temple with a stunning birds-eye view of the estuary.",
        location: "Anjarle Village (6 km north of Harnai)",
        category: "heritage",
        estimatedCost: "Free entry",
        insiderTip: "Walk to the temple's sea-facing viewing gallery. On clear days you can see the entire Harnai coastline stretching south.",
      },
      {
        time: "01:30 PM",
        period: "afternoon",
        title: "Fresh Catch Lunch at Harnai Port Eatery",
        tagline: "Sample fresh butter garlic prawns, Paplet (Pomfret) fry, and crab masala with steamed bhakri.",
        location: "Harnai Port Road",
        category: "food",
        estimatedCost: "₹450 / person",
        insiderTip: "Pair your meal with fresh Kokum Sharbat to stay cool during the afternoon coastal breeze.",
      },
      {
        time: "03:45 PM",
        period: "afternoon",
        title: "The Famous Harnai Beach Daily Fish Auction",
        tagline: "Watch hundreds of brightly painted fishing trawlers return with the day's catch as sea eagles soar overhead.",
        location: "Harnai Beach shore",
        category: "food",
        estimatedCost: "Free to witness",
        insiderTip: "The auction strictly begins around 3:45 PM and concludes by 5:00 PM. Carry a bag if you want to buy fresh fish to take to your hotel kitchen!",
      },
      {
        time: "06:00 PM",
        period: "sunset",
        title: "Harnai Lighthouse & Kanakdurg Sunset Point",
        tagline: "Climb the rocky promontory overlooking the harbor to watch the sunset directly behind the silhouette of Suvarnadurg fort.",
        location: "Harnai Headland",
        category: "sunset",
        estimatedCost: "Free",
        insiderTip: "One of the best photography vantage points in the entire Konkan belt.",
      },
    ],
    recommendedStay: secondHotel
      ? {
          id: secondHotel.id,
          name: secondHotel.name,
          area: secondHotel.area,
          price: secondHotel.starting_price,
          rating: secondHotel.average_rating || 4.7,
          image: secondHotel.images[0] || "",
          highlights: secondHotel.amenities.slice(0, 3),
        }
      : undefined,
  });

  // --- DAY 3 (If 3 or 4 days) ---
  if (numDays >= 3) {
    days.push({
      dayNumber: 3,
      theme: "The Mystical Red Sands of Ladghar & Giant Ocean Clifftops",
      focusArea: "Ladghar & Burondi",
      summary: "Head south to Ladghar, famed as 'Tamas Tirtha' for its unique red sands, thrilling water sports, and panoramic ocean vistas.",
      activities: [
        {
          time: "08:30 AM",
          period: "morning",
          title: "Parshuram Bhumi 60-Foot Bronze Monument",
          tagline: "Gaze at the magnificent 60-ft statue of Lord Parshuram standing atop a half-globe over a breathtaking sea cliff.",
          location: "Burondi Clifftop (12 km south of Dapoli)",
          category: "heritage",
          estimatedCost: "Free Entry",
          insiderTip: "Step into the meditation dome beneath the globe. The sea breeze and echo create a calming, soulful ambiance.",
        },
        {
          time: "11:00 AM",
          period: "morning",
          title: "Ladghar Beach Jet Ski & Parasailing",
          tagline: "Take to the skies with sea parasailing overlooking the red cliffs or glide across the waves on high-speed water scooters.",
          location: "Ladghar Beach Watersports Zone",
          category: "adventure",
          estimatedCost: "₹800 - ₹1,400 combo",
          insiderTip: "Parasailing is best before noon when winds are predictable. Instructors accompany beginners.",
        },
        {
          time: "01:30 PM",
          period: "afternoon",
          title: "Traditional Chulivarcha (Clay Stove) Konkani Lunch",
          tagline: "Experience rural wood-fire cooked meals: Jowar Bhakri, fresh Pitla, local fish curry, and Kande Pohe.",
          location: "Ladghar coastal homestay",
          category: "food",
          estimatedCost: "₹350 / person",
          insiderTip: "Wood-fired cooking gives Konkani gravies a unique rustic smoky flavor.",
        },
        {
          time: "05:30 PM",
          period: "sunset",
          title: "Sunset at Tamas Tirtha Red Sand Shoreline",
          tagline: "Watch the golden sun dip over the terracotta sands of Ladghar as the evening prayer bells ring from Shiva shrines.",
          location: "Ladghar Beach",
          category: "beach",
          estimatedCost: "Free",
          insiderTip: "The red sand gets its shade from natural iron-rich laterite soils. Dip your feet in the warm evening surf.",
        },
      ],
      recommendedStay: bestHotel
        ? {
            id: bestHotel.id,
            name: bestHotel.name,
            area: bestHotel.area,
            price: bestHotel.starting_price,
            rating: bestHotel.average_rating || 4.8,
            image: bestHotel.images[0] || "",
            highlights: bestHotel.amenities.slice(0, 3),
          }
        : undefined,
    });
  }

  // --- DAY 4 (If 4 days) ---
  if (numDays >= 4) {
    days.push({
      dayNumber: 4,
      theme: "Hidden Bays, Spice Gardens & Farewell Shopping",
      focusArea: "Dapoli Heritage",
      summary: "Discover secluded silver-sand bays, visit local cashew and Alphonso mango orchards, and pick up authentic Konkan spices before departure.",
      activities: [
        {
          time: "08:30 AM",
          period: "morning",
          title: "Kolthare Silver Sand Hidden Bay",
          tagline: "A completely untouched beach flanked by dense coconut groves and an ancient Kolba Devi temple.",
          location: "Kolthare (20 km south of Dapoli)",
          category: "nature",
          estimatedCost: "Free",
          insiderTip: "Zero commercial stalls—bring your own drinking water and enjoy total serenity with gentle waves.",
        },
        {
          time: "11:30 AM",
          period: "afternoon",
          title: "Dapoli Agriculture University & Konkan Spice Garden",
          tagline: "Explore botanical gardens, spice plantations (cinnamon, nutmeg, black pepper), and local nursery trails.",
          location: "Dr. BSKKV Campus, Dapoli",
          category: "nature",
          estimatedCost: "Free Entry",
          insiderTip: "Visit the sales counter to buy pure coconut oil, kokum agal, amba vadi, and organic cashews at government-subsidized rates.",
        },
        {
          time: "01:30 PM",
          period: "afternoon",
          title: "Farewell Konkani Lunch & Alphonso Delicacies",
          tagline: "Final culinary celebration with Ukadiche Modak, seasonal Aamras (mango puree), and Malvani curry.",
          location: "Dapoli Market town",
          category: "food",
          estimatedCost: "₹350 / person",
          insiderTip: "Stock up on Cashew nuts (Kaju) and Fanas Poli (Jackfruit rolls) from Dapoli bazaar before hitting the highway.",
        },
        {
          time: "04:00 PM",
          period: "sunset",
          title: "Departure via Khed / NH66",
          tagline: "Begin your return drive through the scenic Khed ghats or board your express train at Khed railway station.",
          location: "Khed / NH66 Highway",
          category: "nature",
          estimatedCost: "N/A",
          insiderTip: "The Khed ghat road offers stunning valley views in late afternoon sunlight. Drive cautiously on hairpin turns.",
        },
      ],
    });
  }

  // Budget computations
  const avgNightCost = bestHotel.starting_price || 2800;
  const stayTotal = avgNightCost * (numDays - 1);
  const foodTotal = 800 * numDays * 2; // For 2 people approx
  const activityTotal = 1200 * numDays;
  const grandTotal = stayTotal + foodTotal + activityTotal;

  return {
    title: `${numDays}-Day ${personaMap[input.travelerType]} in Dapoli & Harnai`,
    tagline: `Handcrafted coastal itinerary clustering activities across Murud, Harnai & Ladghar to eliminate travel fatigue.`,
    durationLabel: `${numDays} Days / ${numDays - 1} Nights`,
    travelerLabel: input.travelerType.charAt(0).toUpperCase() + input.travelerType.slice(1),
    estimatedBudget: {
      totalMin: Math.round(grandTotal * 0.9),
      totalMax: Math.round(grandTotal * 1.15),
      stayCost: stayTotal,
      foodCost: foodTotal,
      activityCost: activityTotal,
    },
    bestSeasonNote: "Peak season is October to May for clear blue seas, dolphin boat trips, and dry roads. Monsoon (June-Sept) offers lush green valleys.",
    tideAndRouteAdvisory: "Dolphin safaris strictly operate before 9:00 AM. The Harnai fish auction begins at 3:45 PM. Nearest railway station is Khed (28 km away).",
    days,
  };
}
