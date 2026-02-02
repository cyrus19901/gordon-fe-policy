import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { filterCompanySchema, VALID_FILTERS } from "@/lib/schemas/filter-schema"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API route called")
    const { query } = await request.json()
    console.log("[v0] Query received:", query)

    if (!query || typeof query !== "string") {
      console.log("[v0] Invalid query provided")
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    console.log("[v0] Starting AI processing with OpenAI")

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("AI request timeout")), 15000) // 15 second timeout
    })

    const aiPromise = generateObject({
      model: openai("gpt-4o-mini"),
      system: `You are a helpful assistant that generates company filters for a given prompt.

Current date is: ${new Date().toISOString().split("T")[0]}

Instructions:
- Extract relevant filter criteria from the user's natural language query
- Only include filters that are explicitly mentioned or strongly implied
- For industries, use exact matches from the provided enum values
- For locations, extract city and state combinations (e.g., "Austin, TX", "New York, NY")
- For revenue, employees, health score, and founded year, extract numeric ranges
- Revenue should be in millions (M), so "$10M" becomes 10
- Employee counts should be whole numbers
- Health scores should be percentages (0-100)
- Founded years should be 4-digit years (1990-2024)
- If a query mentions "Midwest", include these locations: ["Chicago, IL", "Detroit, MI", "Cleveland, OH", "Milwaukee, WI", "Indianapolis, IN", "Kansas City, MO", "St. Louis, MO", "Minneapolis, MN"]
- If a query mentions "West Coast", include: ["Los Angeles, CA", "San Francisco, CA", "Seattle, WA", "Portland, OR", "San Diego, CA"]
- If a query mentions "East Coast", include: ["New York, NY", "Boston, MA", "Philadelphia, PA", "Washington, DC", "Miami, FL", "Atlanta, GA"]

Examples:
- "Tech companies in the Midwest with more than 10 employees" → industry: ["Technology"], location: ["Chicago, IL", "Detroit, MI", "Cleveland, OH", "Milwaukee, WI", "Indianapolis, IN", "Kansas City, MO", "St. Louis, MO", "Minneapolis, MN"], employees: {min: 10}
- "SaaS companies with revenue over $5M" → industry: ["SaaS"], revenue: {min: 5}
- "Healthcare startups founded after 2015" → industry: ["Healthcare"], founded: {min: 2015}
- "Manufacturing companies in Austin with 50-200 employees" → industry: ["Manufacturing"], location: ["Austin, TX"], employees: {min: 50, max: 200}`,
      schema: filterCompanySchema.pick(
        VALID_FILTERS.reduce((acc, filter) => {
          acc[filter] = true
          return acc
        }, {} as any),
      ),
      prompt: query,
      temperature: 0.3,
    })

    console.log("[v0] Waiting for AI response...")
    const result = (await Promise.race([aiPromise, timeoutPromise])) as any
    console.log("[v0] AI processing completed, result:", result.object)

    return NextResponse.json({ filters: result.object })
  } catch (error) {
    console.error("[v0] Error parsing natural language:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "Failed to parse query",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
