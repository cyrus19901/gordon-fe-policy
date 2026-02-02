import type React from "react"
import { DealProvider } from "@/lib/deal-context"

export default function DealPageLayout({ children }: { children: React.ReactNode }) {
  return <DealProvider>{children}</DealProvider>
}
