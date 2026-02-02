"use client"
import { useSavedDeals } from "@/lib/saved-deals-context"
import { DealsPortfolioView } from "./deals-portfolio-view"

export function WatchlistView() {
  const { state } = useSavedDeals()

  return <DealsPortfolioView viewMode="watchlist" />
}
