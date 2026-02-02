import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Note: Uses the OPENAI_API_KEY environment variable automatically.
// See AI SDK docs for usage patterns. [^1]

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name: string
      type: "file" | "folder"
      size?: string
      lastModified?: string
      items?: number
      url?: string
      tags?: string[]
    }

    const hints: string[] = []
    if (body.type === "file" && body.size) hints.push(`Size: ${body.size}`)
    if (body.lastModified) hints.push(`Last modified: ${body.lastModified}`)
    if (body.type === "folder" && typeof body.items === "number") hints.push(`Contains ${body.items} items`)
    if (body.tags?.length) hints.push(`Tags: ${body.tags.join(", ")}`)

    const prompt = `
Summarize the document below for an M&A diligence reader. Be concise and neutral.

Document:
- Name: ${body.name}
- Type: ${body.type}
${hints.map((h) => `- ${h}`).join("\n")}

Write:
- 2 to 3 short paragraphs (<= 140 words total).
- A brief "Key points:" list with 2-3 bullets if applicable.
Avoid filler. If it's a folder, clarify expected contents and suggested next steps briefly.
`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system:
        "You are a succinct analyst. You write compact, scannable summaries for diligence. Use plain language and keep output brief.",
      prompt,
    })

    const summary = text.trim()
    const sources = body.url ? [{ label: "Source document", href: body.url }] : []

    return NextResponse.json({ summary, sources })
  } catch (err) {
    return NextResponse.json(
      {
        summary:
          "AI summary is temporarily unavailable. Try again shortly or open the source document to review the file directly.",
        sources: [],
      },
      { status: 200 },
    )
  }
}
