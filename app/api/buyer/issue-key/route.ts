import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionRaw = cookieStore.get("session")?.value
    let email = "buyer"
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw)
        if (session?.email) email = String(session.email)
      } catch {
        // ignore invalid session cookie
      }
    }

    const bootstrapKeyCandidates = [
      process.env.BACKEND_BOOTSTRAP_API_KEY,
      process.env.NEXT_PUBLIC_BACKEND_BOOTSTRAP_API_KEY,
      process.env.NEXT_PUBLIC_API_TOKEN,
      "ak_demo_live_test_key_2024",
    ]
      .map((k) => String(k || "").trim())
      .filter(Boolean)
      .filter((k) => k.startsWith("ak_"))

    if (bootstrapKeyCandidates.length === 0) {
      return NextResponse.json(
        { error: "Missing valid bootstrap API key (must start with ak_)" },
        { status: 500 },
      )
    }

    const nameSafeEmail = email.replace(/[^a-zA-Z0-9@._-]/g, "")
    const candidates = Array.from(
      new Set(
        [BACKEND_URL, process.env.BACKEND_FALLBACK_URL, "http://localhost:3001"]
          .filter(Boolean)
          .map((u) => String(u).replace(/\/+$/, "")),
      ),
    )

    let lastError: any = null
    for (const bootstrapKey of bootstrapKeyCandidates) {
      for (const baseUrl of candidates) {
        const resp = await fetch(`${baseUrl}/api/v1/orgs/me/api-keys`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": bootstrapKey,
          },
          body: JSON.stringify({
            name: `Buyer Key (${nameSafeEmail})`,
            scopes: ["*"],
          }),
        }).catch((err: any) => ({ ok: false, status: 0, _err: err } as any))

        if ((resp as any)._err) {
          lastError = { message: (resp as any)._err?.message || "Network error", backendStatus: 0, backendUrl: baseUrl }
          continue
        }

        const data = await (resp as Response).json().catch(() => ({}))
        if ((resp as Response).ok) {
          return NextResponse.json(data, { status: 200 })
        }
        lastError = {
          message: data?.error?.message || data?.error || "Failed to issue key from backend",
          backendStatus: (resp as Response).status,
          backendUrl: baseUrl,
        }

        // 404 means wrong backend deployment target; continue trying candidates.
        if ((resp as Response).status === 404) continue
        // 401/403 can happen when key doesn't exist on a given backend; try next key or URL.
      }
    }

    return NextResponse.json(
      {
        error: lastError?.message || "Failed to issue key from backend",
        backendStatus: lastError?.backendStatus || 500,
        backendUrl: lastError?.backendUrl || BACKEND_URL,
      },
      { status: 500 },
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Issue key failed" }, { status: 500 })
  }
}

