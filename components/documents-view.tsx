"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { ContentLayout } from "./content-layout"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { FileText, Folder, MoreVertical, ExternalLink, Loader2, Search, Upload, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type DocType = "file" | "folder"

type DocumentItem = {
  name: string
  type: DocType
  size?: string
  lastModified?: string
  items?: number
  url?: string
  tags?: string[]
}

type SummaryResult = {
  summary: string
  sources: { label: string; href: string }[]
}

// Mock data for documents
const initialDocuments: DocumentItem[] = [
  {
    name: "Q4 2023 P&L Statement.xlsx",
    type: "file",
    size: "1.2 MB",
    lastModified: "2m ago",
    url: "/files/q4-2023-pl.xlsx",
    tags: ["Finance", "P&L"],
  },
  {
    name: "Cybersecurity Audit Report.pdf",
    type: "file",
    size: "5.4 MB",
    lastModified: "1h ago",
    url: "/files/cybersecurity-audit.pdf",
    tags: ["Security", "Audit"],
  },
  { name: "Customer Contracts", type: "folder", items: 12, url: "/files/customer-contracts", tags: ["Legal"] },
  { name: "Supplier Agreements", type: "folder", items: 5, url: "/files/supplier-agreements", tags: ["Legal"] },
  {
    name: "Financial Projections.xlsx",
    type: "file",
    size: "850 KB",
    lastModified: "Yesterday",
    url: "/files/financial-projections.xlsx",
    tags: ["Finance", "Forecast"],
  },
]

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const DocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [summary, setSummary] = useState<SummaryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(() => {
    const filteredDocs = getFiltered(documents, query)
    return filteredDocs[selectedIndex]
  }, [documents, query, selectedIndex])

  const headerActions = (
    <Button size="sm" onClick={() => fileInputRef.current?.click()} className="h-9" aria-label="Upload documents">
      <Upload className="h-4 w-4 mr-2" />
      Upload documents
    </Button>
  )

  const filtered = useMemo(() => getFiltered(documents, query), [documents, query])

  // Keep selection valid if filtering hides the previously selected item
  useEffect(() => {
    const current = filtered[selectedIndex]
    if (!current && filtered.length) {
      setSelectedIndex(0)
    }
    if (filtered.length === 0) {
      setSummary(null)
    }
  }, [filtered, selectedIndex])

  // Fetch AI summary for the selected document
  useEffect(() => {
    const doc = filtered[selectedIndex]
    if (!doc) {
      setSummary(null)
      return
    }
    let ignore = false
    const fetchSummary = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/documents/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        })
        if (!res.ok) throw new Error("Failed to fetch summary")
        const data = (await res.json()) as SummaryResult
        if (!ignore) setSummary(data)
      } catch {
        if (!ignore)
          setSummary({
            summary:
              "AI summary unavailable at the moment. You can still open the source document using the link on the right.",
            sources: doc.url ? [{ label: "Source document", href: doc.url }] : [],
          })
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchSummary()
    return () => {
      ignore = true
    }
  }, [selectedIndex, filtered])

  function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return
    const newDocs: DocumentItem[] = Array.from(files).map((f) => ({
      name: f.name,
      type: "file",
      size: formatBytes(f.size),
      lastModified: "Just now",
      url: URL.createObjectURL(f),
      tags: [],
    }))
    // Prepend uploaded files
    const updated = [...newDocs, ...documents]
    setDocuments(updated)
    setQuery("") // show the new items
    setSelectedIndex(0)
  }

  return (
    <ContentLayout
      title="Documents"
      description="Browse deal files on the left and read AI summaries with quick links."
      headerActions={headerActions}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => onFilesSelected(e.target.files)}
      />

      <div className="mx-auto max-w-screen-2xl">
        {/* Split layout: narrow list (Card) and detail (Card). Stacks on mobile */}
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          {/* Left: list as a standalone Card with its own search */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="pl-9 h-9"
                  aria-label="Search documents"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <nav aria-label="Documents">
                <ul className="max-h-[60vh] md:max-h-[calc(100vh-16rem)] overflow-auto">
                  {filtered.map((doc, idx) => {
                    const active = selected && doc.name === selected.name && doc.type === selected.type
                    return (
                      <li key={`${doc.name}-${idx}`} className="px-0">
                        <button
                          onClick={() => setSelectedIndex(idx)}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-md px-2.5 py-2 transition",
                            "hover:bg-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active ? "bg-accent" : "bg-transparent",
                          )}
                          aria-current={active ? "true" : undefined}
                        >
                          <div
                            className={cn(
                              "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0",
                              active ? "bg-secondary" : "bg-secondary/70",
                            )}
                          >
                            {doc.type === "file" ? (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Folder className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate leading-5 text-xs">{doc.name}</p>
                              {doc.type === "file" ? (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                  FILE
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                  FOLDER
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground truncate text-left">
                              {doc.type === "file"
                                ? [doc.size, doc.lastModified ? `• ${doc.lastModified}` : null]
                                    .filter(Boolean)
                                    .join(" ")
                                : `${doc.items ?? 0} items`}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              className="p-1 rounded hover:bg-muted"
                              aria-label="More options"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Placeholder for context menu
                              }}
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>
                      </li>
                    )
                  })}
                  {filtered.length === 0 && (
                    <li className="px-3 py-4 text-xs text-muted-foreground">No documents found</li>
                  )}
                </ul>
              </nav>
            </CardContent>
          </Card>

          {/* Right: detail container as its own Card */}
          <Card className="min-h-[24rem] md:min-h-[calc(100vh-16rem)]">
            <CardHeader className="border-b bg-background/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl">{selected?.name ?? "No selection"}</CardTitle>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    {selected
                      ? selected.type === "file"
                        ? [selected.size, selected.lastModified ? `• ${selected.lastModified}` : null]
                            .filter(Boolean)
                            .join(" ")
                        : `${selected.items ?? 0} items`
                      : "Select a document to see details"}
                  </p>
                </div>
                {selected?.url && (
                  <Button variant="secondary" size="sm" asChild>
                    <a href={selected.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Open
                    </a>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="grid lg:grid-cols-[1fr_180px] gap-6">
                <div>
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Generating AI summary…</span>
                    </div>
                  ) : summary?.summary ? (
                    <article className="prose prose-sm dark:prose-invert max-w-none">
                      {summary.summary.split("\n").map((p, i) =>
                        p.trim() ? (
                          <p key={i} className="leading-6">
                            {p}
                          </p>
                        ) : (
                          <br key={i} />
                        ),
                      )}
                    </article>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a document to see its summary.</p>
                  )}
                </div>

                <aside className="lg:border-l lg:pl-6">
                  <h3 className="text-sm font-medium">Sources</h3>
                  <div className="mt-3 space-y-2">
                    {summary?.sources?.length ? (
                      summary.sources.map((s, i) => (
                        <Button key={i} variant="ghost" className="h-8 px-2 justify-start w-full" asChild>
                          <a href={s.href} target="_blank" rel="noopener noreferrer" className="flex items-center">
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            <span className="text-xs">{s.label}</span>
                          </a>
                        </Button>
                      ))
                    ) : selected?.url ? (
                      <Button variant="ghost" className="h-8 px-2 justify-start w-full" asChild>
                        <a href={selected.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                          <span className="text-xs">Source document</span>
                        </a>
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">No sources.</p>
                    )}
                  </div>
                </aside>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ContentLayout>
  )
}

function getFiltered(documents: DocumentItem[], query: string) {
  if (!query.trim()) return documents
  const q = query.toLowerCase()
  return documents.filter((d) => d.name.toLowerCase().includes(q) || d.tags?.some((t) => t.toLowerCase().includes(q)))
}
