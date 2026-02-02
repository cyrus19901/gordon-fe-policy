import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { emailContent, tone } = await req.json()

    if (!emailContent || !tone) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const toneInstructions = {
      formal:
        "Rewrite this email in a highly formal, professional tone. Use sophisticated language, proper business etiquette, and maintain a respectful distance. Avoid contractions and casual phrases.",
      personal:
        "Rewrite this email in a warm, personal tone. Make it feel like it's coming from a real person who genuinely cares. Use conversational language while remaining professional. Include personal touches and empathy.",
      casual:
        "Rewrite this email in a casual, friendly tone. Use conversational language, contractions, and a relaxed style. Keep it professional but approachable and easy-going.",
      professional:
        "Rewrite this email in a balanced professional tone. Clear, direct, and business-appropriate without being overly formal or casual. Maintain professionalism while being personable.",
    }

    const instruction = toneInstructions[tone as keyof typeof toneInstructions]

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `${instruction}

Original email:
${emailContent}

Rewritten email:`,
    })

    return Response.json({ rewrittenContent: text.trim() })
  } catch (error) {
    console.error("[v0] Error rewriting email:", error)
    return Response.json({ error: "Failed to rewrite email" }, { status: 500 })
  }
}
