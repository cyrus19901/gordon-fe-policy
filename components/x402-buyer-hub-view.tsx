"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { CheckCircle2, Circle, Copy, ExternalLink, Filter, Key, Wallet, Zap } from "lucide-react"

type AnyObj = Record<string, any>

function isPureX402Provider(provider: AnyObj): boolean {
  const isX402 = provider?.type === "x402" || provider?.metadata?.x402Native === true
  if (!isX402) return false
  // Firecrawl's current path still expects vendor auth token; exclude from pure x402 showcase.
  if (String(provider?.id || "").toLowerCase() === "firecrawl") return false
  if (provider?.metadata?.requiresApiKey === true) return false
  return true
}

function getExplorerBaseUrl(network: string): string {
  const n = String(network || "").toLowerCase()
  if (n.includes("84532") || n.includes("base sepolia")) return "https://sepolia.basescan.org/tx/"
  if (n.includes("8453") || n.includes("base")) return "https://basescan.org/tx/"
  if (n.includes("137") || n.includes("polygon")) return "https://polygonscan.com/tx/"
  if (n.includes("42161") || n.includes("arbitrum")) return "https://arbiscan.io/tx/"
  return ""
}

function tokenExplorerUrl(caip2: string, tokenAddress: string): string {
  const c = String(caip2 || "").toLowerCase()
  const t = String(tokenAddress || "").trim()
  if (!t || !t.startsWith("0x")) return ""
  if (c.includes("84532")) return `https://sepolia.basescan.org/token/${t}`
  if (c.includes("8453")) return `https://basescan.org/token/${t}`
  if (c.includes("137")) return `https://polygonscan.com/token/${t}`
  if (c.includes("42161")) return `https://arbiscan.io/token/${t}`
  return ""
}

function shortAddr(addr: string, left = 6, right = 4): string {
  const a = String(addr || "")
  if (a.length <= left + right + 2) return a
  return `${a.slice(0, left)}…${a.slice(-right)}`
}

/** Hide testnets / devnets from buyer demo surfaces. */
function isNonProductionChain(ch: AnyObj): boolean {
  const caip = String(ch.network || ch.caip2 || "").toLowerCase()
  const name = String(ch.name || "").toLowerCase()
  const blob = `${caip} ${name}`
  if (/\bsepolia\b|\bgoerli\b|\bholesky\b|\bmumbai\b|\bamoy\b|\bfuji\b|\balfajores\b|\bkovan\b|\brinkeby\b|\bropsten\b|\bdevnet\b|\btestnet\b|\bstaging\b/.test(blob)) {
    return true
  }
  const id = Number(ch.chainId)
  if (Number.isFinite(id)) {
    const nonProdIds = new Set([
      84532, 11155111, 17000, 80001, 80002, 43113, 97, 420, 1337, 31337, 12345, 11155420,
    ])
    if (nonProdIds.has(id)) return true
  }
  if (caip.includes("84532")) return true
  return false
}

function sortProductionChains(chains: AnyObj[]): AnyObj[] {
  const order = [8453, 1, 137, 42161, 10]
  const rank = (id: number) => {
    const i = order.indexOf(id)
    return i === -1 ? 999 : i
  }
  return [...chains].sort((a, b) => {
    const ra = rank(Number(a.chainId))
    const rb = rank(Number(b.chainId))
    if (ra !== rb) return ra - rb
    return String(a.name || "").localeCompare(String(b.name || ""))
  })
}

function formatPrimaryNetworkLabel(raw: string): string {
  const s = String(raw || "").trim()
  if (!s) return "Base"
  const beforeParen = s.match(/^([^(]+)\(/)?.[1]?.trim()
  if (beforeParen) return beforeParen
  return s.replace(/\s*\(eip155:\d+\)\s*/i, "").trim() || "Base"
}

function chainAvatarLetter(name: string): string {
  const n = String(name || "").trim()
  if (!n) return "?"
  const alnum = n.replace(/[^a-zA-Z0-9]/g, "")
  return (alnum[0] || n[0] || "?").toUpperCase()
}

function deriveServiceInputGuide(provider?: AnyObj): {
  title: string
  required: string[]
  optional: string[]
  exampleInput: string
} {
  if (!provider) {
    return {
      title: "Select a service to see expected input",
      required: [],
      optional: [],
      exampleInput: "https://example.com",
    }
  }

  const accept = provider?.metadata?.probeSnapshot?.rawAccepts?.[0] || {}
  const inputSchema = accept?.outputSchema?.input || {}
  const bodySchema = inputSchema?.body || {}
  const bodyProps = bodySchema?.properties || {}
  const required = new Set<string>()
  const optional = new Set<string>()

  const bodyFields = inputSchema?.bodyFields || {}
  for (const [k, v] of Object.entries(bodyFields as Record<string, any>)) {
    if (v?.required) required.add(k)
    else optional.add(k)
  }

  for (const key of Object.keys(bodyProps)) {
    if (Array.isArray(bodySchema?.required) && bodySchema.required.includes(key)) required.add(key)
    else optional.add(key)
  }

  const queryParams = inputSchema?.queryParams || {}
  for (const [k, v] of Object.entries(queryParams as Record<string, any>)) {
    if (v?.required) required.add(k)
    else optional.add(k)
  }

  const req = [...required]
  const opt = [...optional].filter((k) => !required.has(k))
  const exampleInput = req.includes("url") ? "https://en.wikipedia.org/wiki/Gordon" : "gordon"

  return {
    title: `${provider.name || provider.id} expects ${inputSchema?.method || provider?.metadata?.method || "request"} input`,
    required: req,
    optional: opt,
    exampleInput,
  }
}

function toSummaryBullets(text: string): string[] {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  const bulletLines = lines
    .filter((l) => l.startsWith("- ") || l.startsWith("* "))
    .map((l) => l.replace(/^[-*]\s+/, ""))
  if (bulletLines.length) return bulletLines.slice(0, 6)
  return lines.slice(0, 6)
}

function cleanResponseText(text: string): string {
  return String(text || "")
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function X402BuyerHubView() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [latestIssuedKey, setLatestIssuedKey] = useState("")
  const [walletInfo, setWalletInfo] = useState<AnyObj>({})
  const [settlementWallet, setSettlementWallet] = useState<AnyObj>({})
  const [settlementChains, setSettlementChains] = useState<AnyObj[]>([])
  const [treasury, setTreasury] = useState<AnyObj>({})
  const [keys, setKeys] = useState<AnyObj[]>([])
  const [providers, setProviders] = useState<AnyObj[]>([])
  const [mkQuery, setMkQuery] = useState("firecrawl")
  /** Discovery filters — passed to GET /v1/marketplace/browse */
  const [mkSourceFilter, setMkSourceFilter] = useState<"" | "x402.direct" | "x402scout" | "orthogonal">("")
  const [mkCategory, setMkCategory] = useState("")
  const [mkMinTrust, setMkMinTrust] = useState("")
  const [mkHasPrice, setMkHasPrice] = useState(false)
  const [marketRows, setMarketRows] = useState<AnyObj[]>([])
  const [marketSources, setMarketSources] = useState<AnyObj>({})
  const [selectedProvider, setSelectedProvider] = useState("")
  const [selectedAction, setSelectedAction] = useState("request")
  const [requestInput, setRequestInput] = useState("https://example.com")
  const [execResult, setExecResult] = useState<AnyObj | null>(null)
  const [execTrace, setExecTrace] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [currentUser, setCurrentUser] = useState<AnyObj | null>(null)
  const [checkingUser, setCheckingUser] = useState(true)
  const [showRawOutput, setShowRawOutput] = useState(false)
  const [responseTab, setResponseTab] = useState<"summary" | "content" | "raw">("summary")
  const [policyModalOpen, setPolicyModalOpen] = useState(false)
  const [policyMode, setPolicyMode] = useState<"provider" | "user">("provider")
  const [policyProviderId, setPolicyProviderId] = useState("")
  const [policyUserEmail, setPolicyUserEmail] = useState("")
  const [policyCap, setPolicyCap] = useState("0.05")
  const [policyFallback, setPolicyFallback] = useState<"deny" | "require_approval" | "flag_review" | "approve">("deny")

  const selectedProviderObj = useMemo(
    () => providers.find((p) => p.id === selectedProvider),
    [providers, selectedProvider],
  )
  const inputGuide = useMemo(() => deriveServiceInputGuide(selectedProviderObj), [selectedProviderObj])

  const chainShowcase = useMemo(() => {
    let raw: AnyObj[] = []
    if (Array.isArray(settlementChains) && settlementChains.length) raw = settlementChains
    else {
      const sup = walletInfo?.supportedNetworks
      if (Array.isArray(sup) && sup.length) {
        raw = sup.map((x: AnyObj) => ({
          network: x.network,
          name: x.name || x.network,
          usdcAddress: "",
        }))
      }
    }
    const prod = raw.filter((ch) => !isNonProductionChain(ch))
    return sortProductionChains(prod)
  }, [settlementChains, walletInfo])

  function copyText(text: string, label: string) {
    const t = String(text || "").trim()
    if (!t) return
    void navigator.clipboard.writeText(t).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    )
  }

  async function proxyFetch(path: string, opts: RequestInit = {}) {
    if (!apiKey) throw new Error("Backend API key is required")
    const headers = new Headers(opts.headers)
    headers.set("Content-Type", "application/json")
    headers.set("X-API-Key", apiKey)
    const res = await fetch(`/api/proxy${path}`, {
      ...opts,
      headers,
      credentials: "include",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data?.error?.message || data?.error || `HTTP ${res.status}`)
    }
    return data
  }

  async function loadAll() {
    if (!apiKey) return
    try {
      const [wallet, chainsJson, treasuryRes, providersRes, keysRes] = await Promise.all([
        fetch("/api/proxy/demo/wallet", {
          headers: { "X-API-Key": apiKey },
          credentials: "include",
        }).then((r) => r.json()),
        fetch("/api/proxy/demo/chains", {
          headers: { "X-API-Key": apiKey },
          credentials: "include",
        }).then((r) => r.json().catch(() => ({}))),
        proxyFetch("/v1/treasury"),
        proxyFetch("/v1/providers"),
        proxyFetch("/v1/orgs/me/api-keys"),
      ])
      setWalletInfo(wallet || {})
      if (Array.isArray(chainsJson?.chains) && chainsJson.chains.length) {
        setSettlementChains(chainsJson.chains)
      }
      setTreasury(treasuryRes || {})
      const pureProviders = (providersRes?.providers || []).filter(isPureX402Provider)
      setProviders(pureProviders)
      setKeys(keysRes?.keys || [])
      if (!selectedProvider && pureProviders.length) {
        const first = pureProviders[0]
        setSelectedProvider(first.id)
        setSelectedAction(first.actions?.[0] || "request")
      }
    } catch (err: any) {
      toast.error(`Failed to load hub data: ${err.message}`)
    }
  }

  async function browseMarketplace(overrides?: {
    query?: string
    source?: "" | "x402.direct" | "x402scout" | "orthogonal"
    category?: string
    minTrust?: string
    hasPrice?: boolean
  }) {
    try {
      const qText = (overrides?.query ?? mkQuery).trim()
      const source = overrides?.source !== undefined ? overrides.source : mkSourceFilter
      const category = overrides?.category !== undefined ? overrides.category : mkCategory
      const minTrustStr = overrides?.minTrust !== undefined ? overrides.minTrust : mkMinTrust
      const hasPrice = overrides?.hasPrice !== undefined ? overrides.hasPrice : mkHasPrice

      const params = new URLSearchParams()
      params.set("q", qText)
      params.set("limit", "24")
      if (source) params.set("source", source)
      if (category.trim()) params.set("category", category.trim().toLowerCase())
      const mt = Number(minTrustStr)
      if (String(minTrustStr).trim() && Number.isFinite(mt)) params.set("minTrust", String(mt))
      if (hasPrice) params.set("hasPrice", "true")
      const data = await proxyFetch(`/v1/marketplace/browse?${params.toString()}`)
      setMarketRows(data?.services || [])
      setMarketSources(data?.sources || {})
    } catch (err: any) {
      toast.error(`Browse failed: ${err.message}`)
    }
  }

  async function registerService(url: string, name: string, category = "utility", source = "marketplace", description = "") {
    try {
      await proxyFetch("/v1/marketplace/register", {
        method: "POST",
        body: JSON.stringify({ url, name, category, source, description }),
      })
      toast.success("Service registered")
      await loadAll()
      if (mkQuery.trim()) await browseMarketplace()
    } catch (err: any) {
      toast.error(`Register failed: ${err.message}`)
    }
  }

  async function issueApiKey() {
    try {
      const data = apiKey
        ? await proxyFetch("/v1/orgs/me/api-keys", {
            method: "POST",
            body: JSON.stringify({
              name: `Buyer Key ${new Date().toISOString().slice(0, 10)}`,
              scopes: ["*"],
            }),
          })
        : await fetch("/api/buyer/issue-key", {
            method: "POST",
            credentials: "include",
          }).then(async (r) => {
            const j = await r.json().catch(() => ({}))
            if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
            return j
          })
      setLatestIssuedKey(data?.key || "")
      if (data?.key) setApiKey(data.key)
      toast.success("Backend API key issued")
      await loadAll()
    } catch (err: any) {
      toast.error(`Issue key failed: ${err.message}`)
    }
  }

  async function createManagedWallet() {
    try {
      const data = await fetch("/api/buyer/create-wallet", {
        method: "POST",
        credentials: "include",
      }).then(async (r) => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
        return j
      })
      setSettlementWallet(data?.settlementWallet || {})
      if (Array.isArray(data?.settlementChains) && data.settlementChains.length) {
        setSettlementChains(data.settlementChains)
      }
      toast.success("Settlement wallet & supported chains refreshed")
    } catch (err: any) {
      toast.error(`Create wallet failed: ${err.message}`)
    }
  }

  async function syncManagedWallet(silent = true) {
    try {
      const data = await fetch("/api/buyer/create-wallet", {
        method: "POST",
        credentials: "include",
      }).then(async (r) => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
        return j
      })
      if (data?.settlementWallet) setSettlementWallet(data.settlementWallet)
      if (Array.isArray(data?.settlementChains) && data.settlementChains.length) {
        setSettlementChains(data.settlementChains)
      }
    } catch (err: any) {
      if (!silent) {
        toast.error(`Wallet sync failed: ${err.message}`)
      }
    }
  }

  async function createQuickPolicy() {
    try {
      await proxyFetch("/v1/policies", {
        method: "POST",
        body: JSON.stringify({
          name: "Buyer Tx Cap (Demo)",
          type: "transaction",
          enabled: true,
          priority: 92,
          conditions: { transactionType: ["agent-to-agent"] },
          rules: { maxTransactionAmount: 0.05, fallbackAction: "deny" },
        }),
      })
      toast.success("Policy created")
    } catch (err: any) {
      toast.error(`Policy creation failed: ${err.message}`)
    }
  }

  async function createScopedPolicyFromModal() {
    try {
      const cap = Number(policyCap || 0)
      if (!Number.isFinite(cap) || cap <= 0) throw new Error("Policy cap must be > 0")
      if (policyMode === "provider" && !policyProviderId) throw new Error("Select a provider")
      if (policyMode === "user" && !policyUserEmail.trim()) throw new Error("Enter user email")

      const timestamp = new Date().toISOString().slice(0, 10)
      const isProvider = policyMode === "provider"
      const policyBody = isProvider
        ? {
            name: `Provider Guard: ${policyProviderId} (${timestamp})`,
            type: "merchant",
            enabled: true,
            priority: 96,
            conditions: { transactionType: ["agent-to-agent"], serviceType: [selectedAction || "request"] },
            rules: {
              allowedMerchants: [policyProviderId],
              maxTransactionAmount: cap,
              fallbackAction: policyFallback,
            },
          }
        : {
            name: `User Guard: ${policyUserEmail.trim()} (${timestamp})`,
            type: "transaction",
            enabled: true,
            priority: 95,
            conditions: {
              transactionType: ["agent-to-agent"],
              // kept for traceability in policy payload until strict per-user execution context is wired
              targetUserEmail: policyUserEmail.trim().toLowerCase(),
            },
            rules: {
              maxTransactionAmount: cap,
              fallbackAction: policyFallback,
            },
          }

      await proxyFetch("/v1/policies", {
        method: "POST",
        body: JSON.stringify(policyBody),
      })
      toast.success(`${isProvider ? "Provider" : "User"} policy created`)
      setPolicyModalOpen(false)
      await loadAll()
    } catch (err: any) {
      toast.error(`Policy modal create failed: ${err.message}`)
    }
  }

  async function runExecution() {
    if (!selectedProvider) {
      toast.error("Select provider")
      return
    }
    setBusy(true)
    setExecResult(null)
    setExecTrace([])
    try {
      const trace = (line: string) => {
        setExecTrace((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`])
      }
      const body = {
        provider: selectedProvider,
        action: selectedAction,
        params: { url: requestInput, query: requestInput, domain: requestInput, input: requestInput },
        max_payment_usdc: 0.5,
      }
      trace(`POST /api/proxy/v1/payments/execute (quote) provider=${selectedProvider} action=${selectedAction}`)
      const quote = await fetch("/api/proxy/v1/payments/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        credentials: "include",
        body: JSON.stringify(body),
      })
      const quoteData = await quote.json().catch(() => ({}))
      trace(`Quote response status=${quote.status}`)
      if (quote.status !== 402) {
        trace("No 402 challenge returned — execution ended in direct mode")
        setExecResult({ phase: "direct", data: quoteData, status: quote.status })
        return
      }
      const amount = quoteData?.accepts?.[0]?.maxAmountRequired
      const payTo = quoteData?.accepts?.[0]?.payTo
      trace(`402 PAYMENT-REQUIRED amountAtomic=${amount || "n/a"} payTo=${payTo || "n/a"}`)

      trace("POST /api/proxy/demo/sign-x402")
      const signRes = await fetch("/api/proxy/demo/sign-x402", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        credentials: "include",
        body: JSON.stringify(quoteData),
      })
      const signData = await signRes.json().catch(() => ({}))
      trace(`Signer response status=${signRes.status}`)
      if (!signRes.ok || !signData.paymentHeader) {
        trace(`Signing failed: ${signData?.error || "missing paymentHeader"}`)
        throw new Error(signData?.error || "Signing failed")
      }
      trace(`Signed payment buyer=${signData?.buyerAddress || "n/a"} amount=${signData?.amountUsdc || "n/a"} ${signData?.chainName || ""}`.trim())

      trace("POST /api/proxy/v1/payments/execute (paid retry with PAYMENT-SIGNATURE)")
      const paid = await fetch("/api/proxy/v1/payments/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "PAYMENT-SIGNATURE": signData.paymentHeader,
        },
        credentials: "include",
        body: JSON.stringify(body),
      })
      const paidData = await paid.json().catch(() => ({}))
      trace(`Paid response status=${paid.status} paymentId=${paidData?.paymentId || "n/a"} outcome=${paidData?.status || "n/a"}`)
      setExecResult({
        phase: "paid",
        quote: quoteData,
        sign: { buyerAddress: signData.buyerAddress, amountUsdc: signData.amountUsdc, chainName: signData.chainName },
        paidStatus: paid.status,
        data: paidData,
      })
    } catch (err: any) {
      setExecTrace((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err.message}`])
      setExecResult({ phase: "error", error: err.message })
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("gordon_backend_api_key") || ""
    if (saved) setApiKey(saved)
  }, [])

  useEffect(() => {
    if (!policyProviderId && providers.length > 0) {
      setPolicyProviderId(providers[0].id)
    }
  }, [providers, policyProviderId])

  useEffect(() => {
    if (!policyUserEmail && currentUser?.email) {
      setPolicyUserEmail(String(currentUser.email))
    }
  }, [currentUser, policyUserEmail])

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch("/api/auth/me", { credentials: "include" })
        if (r.ok) {
          const data = await r.json()
          setCurrentUser(data || null)
          await syncManagedWallet(true)
        } else {
          setCurrentUser(null)
        }
      } catch {
        setCurrentUser(null)
      } finally {
        setCheckingUser(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!apiKey) return
    localStorage.setItem("gordon_backend_api_key", apiKey)
    loadAll()
    syncManagedWallet(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  useEffect(() => {
    if (!selectedProviderObj) return
    const nextInput = inputGuide.exampleInput
    if (nextInput && (!requestInput || requestInput === "https://example.com")) {
      setRequestInput(nextInput)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider])

  const walletReady = Boolean(walletInfo?.address)
  const onboardingReady = Boolean(currentUser?.email) && Boolean(apiKey) && walletReady
  const readinessCount = [Boolean(currentUser?.email), Boolean(apiKey), walletReady].filter(Boolean).length
  const readinessPct = Math.round((readinessCount / 3) * 100)
  const paidData = execResult?.data || {}
  const settlement = paidData?.x402Settlement || {}
  const price = paidData?.priceBreakdown || execResult?.quote?.priceBreakdown || {}
  const processedContent =
    paidData?.data?.result?.data?.processed_content ||
    paidData?.serviceResult?.raw?.result?.data?.processed_content ||
    paidData?.serviceResult?.content ||
    ""
  const cleanedContent = cleanResponseText(processedContent)
  const summaryBullets = toSummaryBullets(cleanedContent)
  const sourceUrl = paidData?.data?.result?.data?.url || paidData?.serviceResult?.raw?.result?.data?.url || ""
  const txHash = settlement?.txHash
  const txUrl = txHash ? `${getExplorerBaseUrl(settlement?.network || execResult?.sign?.chainName)}${txHash}` : ""

  const signerAddress = String(walletInfo?.address || settlementWallet?.address || "")

  return (
    <div className="space-y-4">

      {/* ── Hero header ── */}
      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">x402 · Buyer</p>
              <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Buyer Hub</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate API keys and wallets, discover services, and run policy-gated x402 payments.
              </p>
            </div>
            <span className={`inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium ${
              onboardingReady
                ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "border-border bg-muted text-muted-foreground"
            }`}>
              {onboardingReady ? "Ready for execution" : "Setup required"}
            </span>
          </div>

          <div className="border-t border-border/50">
            <div className="grid grid-cols-3 divide-x divide-border/50">
              {([
                { ok: Boolean(currentUser?.email), label: checkingUser ? "Checking…" : currentUser?.email ? `${currentUser.email}` : "Not signed in", icon: Circle },
                { ok: Boolean(apiKey), label: apiKey ? "API key active" : "No API key", icon: Key },
                { ok: walletReady, label: walletReady ? "Signer loaded" : "No signer", icon: Wallet },
              ] as const).map(({ ok, label, icon: Icon }, i) => (
                <div key={i} className="flex items-center gap-2.5 px-4 py-3">
                  {ok
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    : <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  }
                  <span className="truncate text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {!currentUser?.email ? (
            <div className="border-t border-border/50 px-5 py-3">
              <Button variant="outline" size="sm" onClick={() => router.push("/auth/login")}>
                Sign in to continue
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Backend setup ── */}
      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="p-0">
          {/* Section: API key */}
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Backend API Key</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                className="h-9 font-mono text-xs sm:flex-1"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="ak_..."
              />
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="outline" size="sm" className="h-9" onClick={loadAll}>
                  Refresh
                </Button>
                <Button type="button" size="sm" className="h-9" onClick={issueApiKey}>
                  {apiKey ? "Create Additional Key" : "Create API Key"}
                </Button>
              </div>
            </div>
            {latestIssuedKey ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Issued: <span className="font-mono">{latestIssuedKey}</span>
              </p>
            ) : null}
            {!latestIssuedKey && !apiKey ? (
              <p className="mt-2 text-xs text-muted-foreground">Uses server bootstrap key for first-time onboarding.</p>
            ) : null}
          </div>

          {/* Section: Signer + Treasury */}
          <div className="border-t border-border/50">
            <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_auto]">
              <div className="p-5 md:border-r md:border-border/50">
                <div className="mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Demo Signer (EVM)</p>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <p className="break-all font-mono text-xs text-foreground">{signerAddress || "—"}</p>
                  {signerAddress ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      title="Copy address"
                      onClick={() => copyText(signerAddress, "Signer address")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-5 text-xs">
                  <div>
                    <p className="text-muted-foreground">USDC</p>
                    <p className="font-medium tabular-nums">{walletInfo?.usdcBalance ?? "—"}</p>
                  </div>
                  {walletInfo?.ethBalance != null ? (
                    <div>
                      <p className="text-muted-foreground">ETH (gas)</p>
                      <p className="font-medium tabular-nums">{walletInfo.ethBalance}</p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-muted-foreground">Network</p>
                    <p className="font-medium">{formatPrimaryNetworkLabel(settlementWallet?.network || walletInfo?.network || "Base")}</p>
                  </div>
                  {walletInfo?.explorerUrl ? (
                    <div>
                      <p className="text-muted-foreground">Explorer</p>
                      <a href={walletInfo.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline underline-offset-2">
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="border-t border-border/50 p-5 md:border-t-0 md:min-w-44">
                <p className="text-sm font-medium text-muted-foreground">Treasury</p>
                <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight">
                  ${Number(treasury?.balanceAvailable || treasury?.balance_available || 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">USDC available</p>
                <p className="mt-3 text-xs text-muted-foreground">API keys: <span className="font-medium text-foreground">{keys.length}</span></p>
              </div>
            </div>
          </div>

          {/* Section: Settlement chains */}
          {chainShowcase.length > 0 ? (
            <div className="border-t border-border/50">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium">Settlement coverage</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Same EOA signer on each production network · native USDC per chain</p>
                </div>
              </div>
              <div className="border-t border-border/50 px-5 py-3 bg-muted/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Signer</p>
                    <p className="mt-0.5 truncate font-mono text-xs">{signerAddress || "—"}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 gap-1.5"
                    disabled={!signerAddress}
                    onClick={() => copyText(signerAddress, "Signer address")}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-border/40">
                {chainShowcase.map((ch: AnyObj, idx: number) => {
                  const caip = String(ch.network || "")
                  const tokenUrl = tokenExplorerUrl(caip, ch.usdcAddress)
                  return (
                    <div key={caip || `${ch.name}-${idx}`} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-sm font-bold">
                        {chainAvatarLetter(ch.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{ch.name}</span>
                          <span className="text-[10px] text-muted-foreground">· {ch.chainId}</span>
                        </div>
                        {ch.usdcAddress ? (
                          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{ch.usdcAddress}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {ch.explorerUrl ? (
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={String(ch.explorerUrl)} target="_blank" rel="noreferrer" title="Network explorer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        ) : null}
                        {tokenUrl ? (
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={tokenUrl} target="_blank" rel="noreferrer" title="USDC contract">
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          </Button>
                        ) : null}
                        {ch.usdcAddress ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Copy USDC contract"
                            onClick={() => copyText(String(ch.usdcAddress), "USDC contract")}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* Section: Actions */}
          <div className="flex flex-wrap gap-2 border-t border-border/50 p-5">
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={createManagedWallet}>
              Sync settlement preview
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={createQuickPolicy}>
              Create Demo Policy
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setPolicyModalOpen(true)}>
              Assign Policy
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={policyModalOpen} onOpenChange={setPolicyModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Assign Policy Scope</DialogTitle>
            <DialogDescription>
              Create a policy scoped to a provider (enforced now) or user (template scope for buyer demo narrative).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <Button type="button" variant={policyMode === "provider" ? "default" : "outline"} onClick={() => setPolicyMode("provider")}>
                Provider-based
              </Button>
              <Button type="button" variant={policyMode === "user" ? "default" : "outline"} onClick={() => setPolicyMode("user")}>
                User-based
              </Button>
            </div>

            {policyMode === "provider" ? (
              <div className="space-y-2">
                <Label>Provider</Label>
                <select
                  className="w-full border rounded-md bg-background p-2 text-sm"
                  value={policyProviderId}
                  onChange={(e) => setPolicyProviderId(e.target.value)}
                >
                  <option value="">Select provider</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>User email</Label>
                <Input value={policyUserEmail} onChange={(e) => setPolicyUserEmail(e.target.value)} placeholder="user@company.com" />
                <p className="text-xs text-muted-foreground">
                  User-based scope is created in policy metadata for demo assignment context.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Max transaction amount (USDC)</Label>
                <Input value={policyCap} onChange={(e) => setPolicyCap(e.target.value)} type="number" min="0.001" step="0.001" />
              </div>
              <div className="space-y-2">
                <Label>Fallback action</Label>
                <select
                  className="w-full border rounded-md bg-background p-2 text-sm"
                  value={policyFallback}
                  onChange={(e) => setPolicyFallback(e.target.value as any)}
                >
                  <option value="deny">deny</option>
                  <option value="require_approval">require_approval</option>
                  <option value="flag_review">flag_review</option>
                  <option value="approve">approve</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPolicyModalOpen(false)}>Cancel</Button>
            <Button onClick={createScopedPolicyFromModal}>Create Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Discover & Register ── */}
      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b border-border/50 px-5 py-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Discover & Register Services</p>
          </div>

          {!onboardingReady ? (
            <div className="px-5 pt-4">
              <p className="text-xs text-muted-foreground">Complete setup above to enable execution; discovery remains available.</p>
            </div>
          ) : null}

          {/* Search row */}
          <div className="flex gap-2 px-5 pt-5 pb-0">
            <Input
              className="h-9 flex-1 text-sm"
              value={mkQuery}
              onChange={(e) => setMkQuery(e.target.value)}
              placeholder="Search services (e.g. firecrawl, scrape, orthogonal)"
              onKeyDown={(e) => { if (e.key === "Enter") void browseMarketplace() }}
            />
            <Button type="button" size="sm" className="h-9 shrink-0 px-4" onClick={() => void browseMarketplace()}>
              Search
            </Button>
          </div>

          {/* Filters */}
          <div className="px-5 pt-4">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Filters</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Catalog source</Label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                    value={mkSourceFilter}
                    onChange={(e) => setMkSourceFilter(e.target.value as any)}
                  >
                    <option value="">All sources</option>
                    <option value="x402.direct">x402.direct</option>
                    <option value="x402scout">x402scout</option>
                    <option value="orthogonal">Orthogonal</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Category</Label>
                  <Input className="h-9 text-xs" value={mkCategory} onChange={(e) => setMkCategory(e.target.value)} placeholder="e.g. utility" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Min trust score</Label>
                  <Input className="h-9 text-xs" value={mkMinTrust} onChange={(e) => setMkMinTrust(e.target.value)} placeholder="e.g. 0.7" inputMode="decimal" />
                </div>
                <div className="flex flex-col justify-between gap-2">
                  <label className="mt-5 flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border border-input"
                      checked={mkHasPrice}
                      onChange={(e) => setMkHasPrice(e.target.checked)}
                    />
                    Listed price only
                  </label>
                  <Button type="button" variant="outline" size="sm" className="h-9"
                    onClick={() => { setMkSourceFilter(""); setMkCategory(""); setMkMinTrust(""); setMkHasPrice(false) }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 px-5 pt-3 pb-0">
            <span className="flex items-center text-[11px] text-muted-foreground">Quick:</span>
            {([
              { label: "Orthogonal", query: "orthogonal web scraper", src: "orthogonal" as const },
              { label: "Heurist Firecrawl", query: "heurist firecrawl", src: "" as const },
              { label: "Priced data services", query: "x402 data scrape", hp: true },
            ]).map((s) => (
              <Button key={s.label} type="button" variant="outline" size="sm" className="h-7 text-xs px-3"
                onClick={() => {
                  setMkQuery(s.query)
                  if ("src" in s) setMkSourceFilter(s.src as any)
                  if ("hp" in s) setMkHasPrice(true)
                  void browseMarketplace({ query: s.query, ...(("src" in s) ? { source: s.src as any } : {}), ...(("hp" in s) ? { hasPrice: true } : {}) })
                }}>
                {s.label}
              </Button>
            ))}
          </div>

          {/* Source counts */}
          {(marketSources?.x402direct || marketSources?.x402scout || marketSources?.orthogonal) ? (
            <p className="px-5 pt-2 text-[11px] text-muted-foreground">
              x402.direct {marketSources?.x402direct || 0} · x402scout {marketSources?.x402scout || 0} · orthogonal {marketSources?.orthogonal || 0}
            </p>
          ) : null}

          {/* Results */}
          <div className="mt-4 border-t border-border/50">
            {marketRows.length === 0 ? (
              <div className="flex min-h-36 flex-col items-center justify-center gap-1 px-5 py-8 text-center text-sm text-muted-foreground">
                <p>No results yet.</p>
                <p className="text-xs">Run a search or tap a quick-suggestion above.</p>
              </div>
            ) : marketRows.map((svc, idx) => (
              <div
                key={`${svc.url}-${idx}`}
                className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-3.5 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{svc.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{svc.registerUrl || svc.url}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-sm border border-border/60 bg-muted px-1.5 py-0.5 text-[10px]">{svc.source || "marketplace"}</span>
                    {svc.category ? <span>{svc.category}</span> : null}
                    {svc.priceUsd != null ? <span className="text-foreground/80">${Number(svc.priceUsd).toFixed(4)}</span> : null}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0"
                  onClick={() => registerService(svc.registerUrl || svc.url, svc.name, svc.category, svc.source, svc.description)}
                >
                  Register
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Execute ── */}
      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b border-border/50 px-5 py-4">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Execute x402 Service Flow</p>
          </div>

          {!onboardingReady ? (
            <div className="px-5 pt-4 pb-2">
              <p className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                Complete login, API key, and wallet setup to enable execution.
              </p>
            </div>
          ) : null}

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={selectedProvider}
                onChange={(e) => {
                  const pid = e.target.value
                  setSelectedProvider(pid)
                  const p = providers.find((x) => x.id === pid)
                  setSelectedAction(p?.actions?.[0] || "request")
                }}
              >
                <option value="">Select provider</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
              </select>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
              >
                {(selectedProviderObj?.actions || ["request"]).map((a: string) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <Input
              className="h-9 text-sm"
              value={requestInput}
              onChange={(e) => setRequestInput(e.target.value)}
              placeholder={inputGuide.exampleInput}
            />
            <div className="rounded-md border border-border/50 bg-muted/20 px-4 py-3 text-xs space-y-1 text-muted-foreground">
              <p>{inputGuide.title}</p>
              <p><span className="font-medium text-foreground">Required:</span> {inputGuide.required.length ? inputGuide.required.join(", ") : "—"}</p>
              <p><span className="font-medium text-foreground">Optional:</span> {inputGuide.optional.length ? inputGuide.optional.join(", ") : "—"}</p>
            </div>
            <Button
              type="button"
              className="h-9 px-6"
              onClick={runExecution}
              disabled={busy || !onboardingReady}
            >
              {busy ? "Running…" : "Run policy + x402 payment flow"}
            </Button>
          </div>
          {execTrace.length ? (
            <div className="border-t border-border/50 px-5 py-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Request trace</p>
              <pre className="max-h-52 overflow-auto rounded-md border border-border/60 bg-muted/30 p-3 font-mono text-[11px] leading-relaxed">{execTrace.join("\n")}</pre>
            </div>
          ) : null}

          {execResult ? (
            <div className="border-t border-border/50">
              <div className="px-5 pt-4 pb-2">
                <p className="text-xs font-medium text-muted-foreground">Execution summary</p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-border/40 border-t border-border/40 sm:grid-cols-3">
                {[
                  ["Outcome", paidData?.status || execResult?.phase || "—"],
                  ["Provider", paidData?.provider || selectedProvider || "—"],
                  ["Cost", `$${Number(price?.providerCost || 0).toFixed(4)} USDC`],
                  ["Total", `$${Number(price?.total || 0).toFixed(4)} USDC`],
                  ["Network", settlement?.network || execResult?.sign?.chainName || "—"],
                  ["Payment ID", paidData?.paymentId || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-card px-4 py-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{k}</p>
                    <p className="mt-0.5 truncate text-xs font-medium">{v}</p>
                  </div>
                ))}
              </div>

              {txHash ? (
                <div className="border-t border-border/40 px-5 py-3 text-xs">
                  <span className="text-muted-foreground">Settlement TX: </span>
                  {txUrl
                    ? <a href={txUrl} target="_blank" rel="noreferrer" className="font-mono underline underline-offset-2">{txHash}</a>
                    : <span className="font-mono">{txHash}</span>}
                </div>
              ) : null}

              {processedContent ? (
                <div className="border-t border-border/40 px-5 py-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium">Service response</p>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigator.clipboard.writeText(summaryBullets.join("\n"))}>
                        Copy summary
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigator.clipboard.writeText(cleanedContent)}>
                        Copy full
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {(["summary", "content", "raw"] as const).map((tab) => (
                      <Button key={tab} type="button" variant={responseTab === tab ? "default" : "outline"} size="sm" className="h-7 text-xs capitalize" onClick={() => setResponseTab(tab)}>
                        {tab}
                      </Button>
                    ))}
                  </div>
                  {responseTab === "summary" ? (
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs overflow-auto max-h-80">
                      <ul className="list-disc pl-4 space-y-1">
                        {summaryBullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                      {sourceUrl ? <p className="mt-3 text-muted-foreground">Source: <a className="underline underline-offset-2" href={sourceUrl} target="_blank" rel="noreferrer">{sourceUrl}</a></p> : null}
                    </div>
                  ) : responseTab === "content" ? (
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs overflow-auto max-h-80 whitespace-pre-wrap">{cleanedContent}</div>
                  ) : (
                    <pre className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs overflow-auto max-h-80">{JSON.stringify(paidData?.serviceResult?.raw || paidData?.data || {}, null, 2)}</pre>
                  )}
                </div>
              ) : null}

              <div className="border-t border-border/40 px-5 py-3">
                <button type="button" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground" onClick={() => setShowRawOutput((v) => !v)}>
                  {showRawOutput ? "Hide raw JSON" : "Show raw JSON"}
                </button>
                {showRawOutput ? (
                  <pre className="mt-2 rounded-md border border-border/60 bg-muted/20 p-3 text-xs overflow-auto max-h-80">{JSON.stringify(execResult, null, 2)}</pre>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

