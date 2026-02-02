import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const workflowBlockSchema = z.object({
  step: z.number(),
  title: z.string(),
  description: z.string(),
  delay: z.string(),
  emailSubject: z.string(),
  emailBody: z.string(),
  status: z.enum(["pending", "active", "completed"]),
})

const workflowSchema = z.object({
  campaignName: z.string(),
  blocks: z.array(workflowBlockSchema),
})

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 })
    }

    console.log("[v0] Generating campaign workflow for prompt:", prompt)

    // Generate workflow using AI
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: workflowSchema,
      prompt: `You are an expert email campaign strategist. Based on the following campaign description, generate a complete email workflow with 3-5 steps.

Campaign Description: ${prompt}

Generate a campaign workflow that includes:
1. A descriptive campaign name
2. 3-5 workflow blocks with:
   - Step number (1, 2, 3, etc.)
   - Title (brief, descriptive)
   - Description (what this step achieves)
   - Delay (e.g., "Day 1", "Day 3", "Day 7")
   - Email subject line (use {{firstName}}, {{company}}, {{industry}} for personalization)
   - Email body (professional, personalized, use {{firstName}}, {{company}}, {{industry}} variables)
   - Status ("active" for first step, "pending" for others)

Make the workflow realistic, professional, and aligned with the campaign goals described.`,
    })

    console.log("[v0] Generated workflow:", result.object)

    // Add IDs to blocks
    const blocksWithIds = result.object.blocks.map((block, index) => ({
      ...block,
      id: `${Date.now()}-${index}`,
    }))

    return NextResponse.json({
      campaignName: result.object.campaignName,
      blocks: blocksWithIds,
    })
  } catch (error) {
    console.error("[v0] Error generating campaign workflow:", error)
    return NextResponse.json(
      {
        error: "Failed to generate workflow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
