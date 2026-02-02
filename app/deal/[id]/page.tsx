"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { DealLayout } from "@/components/deal-layout"

// --- Mock Data ---
const dealsData: any = {
  hvac: {
    id: "hvac",
    name: "HVAC Co. Acquisition",
    owner: "John Smith",
    lastActivity: "3 min ago",
    stage: "Diligence",
    health: 85,
  },
  storage: {
    id: "storage",
    name: "Public Storage Investment",
    owner: "Sarah Johnson",
    lastActivity: "31 min ago",
    stage: "Initial Review",
    health: 92,
  },
  acme: {
    id: "acme",
    name: "Acme Air Conditioning",
    owner: "John Smith",
    lastActivity: "3h ago",
    stage: "Closing",
    health: 72,
  },
  lacy: {
    id: "lacy",
    name: "Lacy's Laundromat Merger",
    owner: "Mike Davis",
    lastActivity: "4 days ago",
    stage: "Sourcing",
    health: 65,
  },
}

// --- Main Page Component ---
export default function DealPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  let deal = dealsData[params.id as keyof typeof dealsData]

  if (!deal) {
    const dealName = searchParams.get("name")
    if (dealName) {
      deal = {
        id: params.id,
        name: dealName,
        owner: "Eduardo",
        lastActivity: "Just now",
        stage: "Sourcing",
        health: 75,
      }
    } else {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4">Deal not found.</p>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Deals
            </Link>
          </Button>
        </div>
      )
    }
  }

  return <DealLayout deal={deal} />
}
