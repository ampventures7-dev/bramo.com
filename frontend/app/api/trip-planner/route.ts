import { NextResponse } from "next/server";
import { fetchAllHotels } from "@/lib/hotels-service";
import {
  TripPlannerInput,
  generateLocalItinerary,
  GeneratedTripPlan,
} from "@/lib/trip-planner-data";

export const dynamic = "force-dynamic";

/**
 * POST /api/trip-planner
 * Body: TripPlannerInput
 * Returns customized itinerary powered by Google Gemini (with local engine fallback)
 */
export async function POST(request: Request) {
  try {
    const input: TripPlannerInput = await request.json();
    const hotels = await fetchAllHotels();
    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API Key is available, attempt AI-powered generation
    if (apiKey && apiKey.trim() !== "" && apiKey !== "your-gemini-api-key") {
      try {
        const hotelContext = hotels.map((h) => ({
          id: h.id,
          name: h.name,
          area: h.area,
          price: h.starting_price,
          rating: h.average_rating || 4.8,
          image: h.images[0] || "",
          amenities: h.amenities.slice(0, 4),
        }));

        const numDays = input.duration === "4_days" ? 4 : input.duration === "3_days" ? 3 : 2;

        const systemPrompt = `You are the lead Konkan Coastal Travel Architect for bhramo.com, an authentic local booking platform for Dapoli and Harnai in Maharashtra, India.
Generate a realistic, hour-by-hour day plan for a ${numDays}-day coastal trip for a ${input.travelerType} with interests in [${input.interests.join(", ")}] and a ${input.budget} budget.

IMPORTANT GEOGRAPHIC & TIMING RULES:
1. Murud & Karde is Central Dapoli (best for 7:30 AM dolphin safaris, water sports, white sand).
2. Harnai & Suvarnadurg is North Dapoli (best for wooden boat sea fort crossing, cliff temples, and the famous daily beach fish auction strictly at 3:45 PM - 5:00 PM).
3. Ladghar & Burondi is South Dapoli (famous for red sand Tamas Tirtha sunsets, 60-ft Parshuram statue).
4. Strictly allocate ONE geographic cluster per day to eliminate fatigue on winding ghat roads.
5. You MUST select and recommend one matching hotel from this live bhramo.com hotel list for the stay:
${JSON.stringify(hotelContext)}

OUTPUT FORMAT:
Respond with ONLY valid JSON strictly adhering to this structure:
{
  "title": "string (Creative trip title)",
  "tagline": "string (Catchy subtitle)",
  "durationLabel": "${numDays} Days / ${numDays - 1} Nights",
  "travelerLabel": "string",
  "estimatedBudget": {
    "totalMin": number,
    "totalMax": number,
    "stayCost": number,
    "foodCost": number,
    "activityCost": number
  },
  "bestSeasonNote": "string",
  "tideAndRouteAdvisory": "string",
  "days": [
    {
      "dayNumber": 1,
      "theme": "string",
      "focusArea": "Murud & Karde" | "Harnai & Suvarnadurg" | "Ladghar & Burondi" | "Dapoli Heritage",
      "summary": "string",
      "activities": [
        {
          "time": "07:30 AM",
          "period": "morning" | "afternoon" | "sunset" | "night",
          "title": "string",
          "tagline": "string",
          "location": "string",
          "category": "safari" | "beach" | "food" | "heritage" | "adventure" | "nature",
          "estimatedCost": "string",
          "insiderTip": "string"
        }
      ],
      "recommendedStay": {
        "id": "hotel_id_from_provided_list",
        "name": "hotel_name",
        "area": "hotel_area",
        "price": number,
        "rating": number,
        "image": "image_url_from_list",
        "highlights": ["string"]
      }
    }
  ]
}`;

        // Call Gemini 1.5 Flash endpoint
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

        const geminiRes = await fetch(geminiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
            },
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsedPlan: GeneratedTripPlan = JSON.parse(rawText);
            return NextResponse.json({
              success: true,
              plan: parsedPlan,
              source: "gemini_ai",
            });
          }
        } else {
          console.warn("Gemini API returned error, falling back to local engine:", await geminiRes.text());
        }
      } catch (geminiErr) {
        console.warn("Gemini execution error, falling back to local engine:", geminiErr);
      }
    }

    // High-quality local Konkan Travel Engine fallback
    const localPlan = generateLocalItinerary(input, hotels);
    return NextResponse.json({
      success: true,
      plan: localPlan,
      source: "local_engine",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate itinerary" },
      { status: 500 }
    );
  }
}
