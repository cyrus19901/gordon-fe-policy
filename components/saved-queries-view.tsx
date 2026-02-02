"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Trash2, Filter, Sparkles, Play } from "lucide-react"
import { useSavedDeals } from "@/lib/saved-deals-context"
import { cn } from "@/lib/utils"

interface SavedQueriesViewProps {
  onApplyQuery?: (query: any) => void
}

export function SavedQueriesView({ onApplyQuery }: SavedQueriesViewProps) {
  const { state, dispatch } = useSavedDeals()

  const handleDeleteQuery = (queryId: string) => {
    dispatch({ type: "DELETE_QUERY", payload: queryId })
  }

  const handleApplyQuery = (query: any) => {
    onApplyQuery?.(query)
  }

  const formatFilters = (filters: any) => {
    const filterSummary = []

    if (filters.industry?.length) {
      filterSummary.push(`${filters.industry.length} industries`)
    }
    if (filters.location?.length) {
      filterSummary.push(`${filters.location.length} locations`)
    }
    if (filters.revenue) {
      filterSummary.push(`Revenue: $${filters.revenue.min || 0}M-$${filters.revenue.max || "∞"}M`)
    }
    if (filters.health) {
      filterSummary.push(`Health: ${filters.health.min || 0}-${filters.health.max || 100}%`)
    }

    return filterSummary.join(", ") || "No filters"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Saved Searches</h2>
            <p className="text-sm text-muted-foreground">Your saved search queries and smart lists</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {state.savedQueries.length} saved
        </Badge>
      </div>

      {/* Saved Queries Grid */}
      <div className="grid gap-4">
        {state.savedQueries.map((query, index) => (
          <motion.div
            key={query.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.1,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <Card className="hover:shadow-md transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={cn("w-3 h-3 rounded-full", `bg-${query.color}-500`)} />
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {query.name}
                      </h3>
                      {query.resultCount !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {query.resultCount} results
                        </Badge>
                      )}
                    </div>

                    {query.description && (
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{query.description}</p>
                    )}

                    <div className="space-y-2 mb-3">
                      {query.searchQuery && (
                        <div className="flex items-center space-x-2">
                          <Search className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Search: "{query.searchQuery}"</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Filter className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatFilters(query.filters)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Created {new Date(query.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleApplyQuery(query)}>
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteQuery(query.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {state.savedQueries.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No saved searches yet</h3>
          <p className="text-muted-foreground text-sm">
            Start searching for deals and save your queries for quick access later
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
