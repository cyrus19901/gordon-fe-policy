import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

const suggestionSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe("Array of 3-4 relevant search suggestions based on the user's partial input"),
})

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string" || query.trim().length < 3) {
      // Return empty suggestions for very short queries
      return NextResponse.json({ suggestions: [] })
    }

    console.log("[v0] Generating suggestions for:", query)

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Suggestion request timeout")), 5000)
    })

    const aiPromise = generateObject({
      model: openai("gpt-4o-mini"),
      system: `You are a helpful assistant that generates search suggestions for a deal sourcing platform.

Based on the user's partial input, generate 3-4 relevant and specific search suggestions that they might want to complete.

Guidelines:
- Make suggestions specific and actionable
- Include relevant filters like industry, location, revenue, employees, etc.
- Use realistic business metrics (revenue in millions, employee counts, etc.)
- Suggest popular industries: SaaS, Technology, Healthcare, Manufacturing, Retail, Financial Services
- Suggest popular locations: Austin TX, San Francisco CA, New York NY, Chicago IL, Boston MA, etc.
- Include regional suggestions: Midwest, West Coast, East Coast
- Make suggestions progressively more specific based on what the user has typed
- Keep suggestions concise and natural sounding

Examples:
- If user types "tech" → ["Tech companies in the Midwest", "Technology startups with revenue over $5M", "Tech companies with 50+ employees"]
- If user types "saas comp" → ["SaaS companies with recurring revenue", "SaaS companies in Austin TX", "SaaS companies founded after 2020"]
- If user types "healthcare" → ["Healthcare companies with strong margins", "Healthcare startups in Boston", "Healthcare deals with revenue over $10M"]`,
      schema: suggestionSchema,
      prompt: `Generate search suggestions based on this partial input: "${query}"`,
      temperature: 0.7,
    })

    const result = await Promise.race([aiPromise, timeoutPromise])

    const suggestions = result?.object?.suggestions || []
    console.log("[v0] Generated suggestions:", suggestions)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("[v0] Error generating suggestions:", error)
    return NextResponse.json({ suggestions: [] }, { status: 200 })
  }
}
