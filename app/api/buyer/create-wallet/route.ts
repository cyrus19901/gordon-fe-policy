import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

function getBackendCandidates(): string[] {
  return Array.from(
    new Set(
      [BACKEND_URL, process.env.BACKEND_FALLBACK_URL, "http://localhost:3001"]
        .filter(Boolean)
        .map((u) => String(u).replace(/\/+$/, "")),
    ),
  )
}

export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionRaw = cookieStore.get("session")?.value
    if (!sessionRaw) {
      return NextResponse.json({ error: "No login session found" }, { status: 401 })
    }

    let email = ""
    try {
      const session = JSON.parse(sessionRaw)
      email = String(session?.email || "").trim().toLowerCase()
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }
    if (!email) {
      return NextResponse.json({ error: "Session email missing" }, { status: 401 })
    }

    const name = email.split("@")[0]
    const walletNetwork = (process.env.BUYER_WALLET_NETWORK || "eip155:8453").trim()

    let data: any = null
    let selectedBackend = ""
    let lastError: any = null
    for (const baseUrl of getBackendCandidates()) {
      const resp = await fetch(`${baseUrl}/api/auth/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      }).catch((err: any) => ({ ok: false, status: 0, _err: err } as any))

      if ((resp as any)._err) {
        lastError = { error: (resp as any)._err?.message || "Network error", backendUrl: baseUrl, status: 0 }
        continue
      }

      const body = await (resp as Response).json().catch(() => ({}))
      if ((resp as Response).ok) {
        data = body
        selectedBackend = baseUrl
        break
      }

      lastError = {
        error: body?.error || body?.details || "Failed to create user wallet",
        backendUrl: baseUrl,
        status: (resp as Response).status,
      }
      if ((resp as Response).status !== 404) break
    }

    if (!data || !selectedBackend) {
      return NextResponse.json(
        {
          error: lastError?.error || "Failed to create user wallet",
          backendUrl: lastError?.backendUrl || BACKEND_URL,
          backendStatus: lastError?.status || 500,
        },
        { status: lastError?.status || 500 },
      )
    }

    // Add x402 settlement wallet context (Base/EVM multi-network) for buyer flow.
    const [x402WalletResp, chainsResp] = await Promise.all([
      fetch(`${selectedBackend}/api/demo/wallet?network=${encodeURIComponent(walletNetwork)}`).catch(() => null),
      fetch(`${selectedBackend}/api/demo/chains`).catch(() => null),
    ])
    const x402Wallet = x402WalletResp && x402WalletResp.ok ? await x402WalletResp.json().catch(() => null) : null
    const x402Chains = chainsResp && chainsResp.ok ? await chainsResp.json().catch(() => null) : null

    return NextResponse.json({
      success: true,
      wallet: data?.user?.wallet || null,
      user: data?.user || null,
      settlementWallet: x402Wallet,
      settlementChains: x402Chains?.chains || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Wallet creation failed" }, { status: 500 })
  }
}

