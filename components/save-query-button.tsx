"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BookmarkPlus, Save, Search, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSavedDeals } from "@/lib/saved-deals-context"

interface SaveQueryButtonProps {
  searchQuery: string
  filters: any
  resultCount?: number
  className?: string
}

export function SaveQueryButton({ searchQuery, filters, resultCount, className }: SaveQueryButtonProps) {
  const { dispatch } = useSavedDeals()
  const [isOpen, setIsOpen] = useState(false)
  const [queryName, setQueryName] = useState("")
  const [queryDescription, setQueryDescription] = useState("")
  const [selectedColor, setSelectedColor] = useState("blue")

  const colors = [
    { id: "blue", name: "Blue", class: "bg-blue-500" },
    { id: "green", name: "Green", class: "bg-green-500" },
    { id: "purple", name: "Purple", class: "bg-purple-500" },
    { id: "orange", name: "Orange", class: "bg-orange-500" },
    { id: "pink", name: "Pink", class: "bg-pink-500" },
    { id: "teal", name: "Teal", class: "bg-teal-500" },
  ]

  const hasActiveFilters = () => {
    if (searchQuery.trim()) return true
    return Object.keys(filters).some((key) => {
      const value = filters[key]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === "object" && value !== null) {
        return value.min !== undefined || value.max !== undefined
      }
      return Boolean(value)
    })
  }

  const handleSaveQuery = () => {
    if (queryName.trim()) {
      dispatch({
        type: "SAVE_QUERY",
        payload: {
          name: queryName.trim(),
          description: queryDescription.trim() || undefined,
          searchQuery,
          filters,
          color: selectedColor,
          resultCount,
        },
      })
      setQueryName("")
      setQueryDescription("")
      setIsOpen(false)
    }
  }

  if (!hasActiveFilters()) {
    return null
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 text-xs hover:bg-secondary border-border/60 hover:border-border"
      >
        <BookmarkPlus className="h-3 w-3 mr-1.5" />
        Save Search
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-full right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Save Search Query</h3>
                    <p className="text-xs text-muted-foreground">Create a smart list from your current search</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Query Name</label>
                    <Input
                      placeholder="e.g., High-Growth SaaS Companies"
                      value={queryName}
                      onChange={(e) => setQueryName(e.target.value)}
                      className="h-8 text-xs"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Description (optional)</label>
                    <Textarea
                      placeholder="Describe what this search is for..."
                      value={queryDescription}
                      onChange={(e) => setQueryDescription(e.target.value)}
                      className="text-xs resize-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground mb-2 block">Color</label>
                    <div className="flex items-center space-x-2">
                      {colors.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setSelectedColor(color.id)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 transition-all",
                            color.class,
                            selectedColor === color.id ? "border-foreground scale-110" : "border-transparent",
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Query Preview */}
                  <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Search className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium">Query Preview</span>
                    </div>
                    {searchQuery && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Search:</span> "{searchQuery}"
                      </div>
                    )}
                    {Object.keys(filters).length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Filters:</span> {Object.keys(filters).length} applied
                      </div>
                    )}
                    {resultCount !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Results:</span> {resultCount} companies
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 text-xs flex-1">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveQuery}
                    disabled={!queryName.trim()}
                    className="h-8 text-xs flex-1"
                  >
                    <Save className="h-3 w-3 mr-1.5" />
                    Save Query
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
