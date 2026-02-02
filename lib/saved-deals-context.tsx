"use client"

import type React from "react"
import { createContext, useContext, useReducer, type ReactNode } from "react"

interface SavedDeal {
  id: string
  name: string
  industry: string
  revenue: string
  multiple?: string
  location: string
  savedDate: string
  health: number
  tags: string[]
  description: string
  originalDeal: any
  campaignId?: string
  // Progress tracking fields
  pipelineStage:
    | "saved"
    | "contacted"
    | "interested"
    | "not_interested"
    | "negotiating"
    | "due_diligence"
    | "closed_won"
    | "closed_lost"
  lastContactDate?: string
  lastInteractionSummary?: string
  nextFollowUpDate?: string
  contactAttempts: number
  dealValue?: string
  probability: number
  assignedTo?: string
  notes: string[]
  interactions: DealInteraction[]
}

interface DealInteraction {
  id: string
  type: "email" | "call" | "meeting" | "note"
  date: string
  summary: string
  outcome?: "positive" | "neutral" | "negative"
  nextAction?: string
}

interface SavedQuery {
  id: string
  name: string
  description?: string
  searchQuery: string
  filters: any
  createdAt: string
  color: string
  resultCount?: number
}

interface Campaign {
  id: string
  name: string
  description: string
  createdAt: string
  status: "active" | "paused" | "completed"
  dealIds: string[]
  tags: string[]
  outreachStats: {
    sent: number
    received: number
    replied: number
    interested: number
  }
}

interface Communication {
  id: string
  dealId: string
  dealName: string
  type: "email" | "call" | "meeting" | "message"
  direction: "inbound" | "outbound"
  subject?: string
  preview: string
  fullContent?: string
  timestamp: string
  status: "unread" | "read" | "archived"
  from: string
  to: string
  sentiment?: "positive" | "neutral" | "negative"
}

interface SavedDealsState {
  savedDeals: SavedDeal[]
  savedQueries: SavedQuery[]
  campaigns: Campaign[]
  communications: Communication[]
  availableTags: string[]
}

type SavedDealsAction =
  | { type: "SAVE_DEAL"; payload: any }
  | { type: "UNSAVE_DEAL"; payload: string }
  | {
      type: "SAVE_QUERY"
      payload: {
        name: string
        description?: string
        searchQuery: string
        filters: any
        color: string
        resultCount?: number
      }
    }
  | { type: "DELETE_QUERY"; payload: string }
  | { type: "UPDATE_QUERY_RESULTS"; payload: { queryId: string; resultCount: number } }
  | { type: "CREATE_CAMPAIGN"; payload: { name: string; description: string; dealIds: string[]; tags: string[] } }
  | { type: "UPDATE_CAMPAIGN"; payload: { campaignId: string; updates: Partial<Campaign> } }
  | { type: "DELETE_CAMPAIGN"; payload: string }
  | { type: "ADD_COMMUNICATION"; payload: Communication }
  | { type: "MARK_COMMUNICATION_READ"; payload: string }
  | { type: "ARCHIVE_COMMUNICATION"; payload: string }
  | { type: "ADD_TAG_TO_DEAL"; payload: { dealId: string; tag: string } }
  | { type: "REMOVE_TAG_FROM_DEAL"; payload: { dealId: string; tag: string } }
  | { type: "ADD_GLOBAL_TAG"; payload: string }
  | { type: "REORDER_DEALS"; payload: SavedDeal[] }

const initialState: SavedDealsState = {
  savedDeals: [
    {
      id: "saved-1",
      name: "TechFlow Solutions",
      industry: "SaaS",
      revenue: "$12.5M",
      multiple: "4.2x",
      location: "Austin, TX",
      savedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      health: 88,
      tags: ["High Growth", "Profitable"],
      description: "Leading workflow automation platform for mid-market companies",
      originalDeal: {},
      campaignId: "campaign-1", // Ensure campaignId is set
      pipelineStage: "contacted",
      lastContactDate: "2024-01-25",
      lastInteractionSummary: "Initial outreach email sent to CEO. Positive response, scheduled follow-up call.",
      nextFollowUpDate: "2024-01-30",
      contactAttempts: 2,
      dealValue: "$45M",
      probability: 75,
      assignedTo: "John Smith",
      notes: ["Strong financials", "Founder interested in exit", "Competitive process expected"],
      interactions: [
        {
          id: "int-1",
          type: "email",
          date: "2024-01-23",
          summary: "Initial outreach to CEO via LinkedIn",
          outcome: "positive",
          nextAction: "Schedule intro call",
        },
        {
          id: "int-2",
          type: "call",
          date: "2024-01-25",
          summary: "30min intro call with CEO. Discussed strategic fit and timeline.",
          outcome: "positive",
          nextAction: "Send NDA and initial term sheet",
        },
      ],
    },
    {
      id: "saved-2",
      name: "GreenTech Manufacturing",
      industry: "Manufacturing",
      revenue: "$8.3M",
      multiple: "3.1x",
      location: "Denver, CO",
      savedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      health: 92,
      tags: ["ESG Focused", "Stable"],
      description: "Sustainable manufacturing solutions with strong margins",
      originalDeal: {},
      campaignId: "campaign-1", // Ensure campaignId is set
      pipelineStage: "saved",
      contactAttempts: 0,
      dealValue: "$25M",
      probability: 25,
      assignedTo: "Sarah Johnson",
      notes: ["Research phase", "Strong ESG credentials", "Family-owned business"],
      interactions: [],
    },
    {
      id: "saved-3",
      name: "DataViz Pro",
      industry: "Analytics",
      revenue: "$15.2M",
      multiple: "5.1x",
      location: "San Francisco, CA",
      savedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      health: 85,
      tags: ["High Growth"],
      description: "Data visualization platform",
      originalDeal: {},
      campaignId: "campaign-2",
      pipelineStage: "interested",
      contactAttempts: 3,
      dealValue: "$60M",
      probability: 60,
      assignedTo: "Mike Chen",
      notes: [],
      interactions: [],
    },
    {
      id: "saved-4",
      name: "CloudSync Systems",
      industry: "SaaS",
      revenue: "$9.2M",
      location: "Seattle, WA",
      savedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      health: 78,
      tags: ["Cloud"],
      description: "Cloud synchronization platform",
      originalDeal: {},
      campaignId: "campaign-1", // Ensure campaignId is set
      pipelineStage: "saved",
      contactAttempts: 0,
      dealValue: "$30M",
      probability: 20,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-5",
      name: "FinTech Innovations",
      industry: "FinTech",
      revenue: "$18.5M",
      location: "New York, NY",
      savedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      health: 91,
      tags: ["High Growth"],
      description: "Payment processing solutions",
      originalDeal: {},
      campaignId: "campaign-1", // Set campaignId for campaign-1
      pipelineStage: "contacted",
      contactAttempts: 1,
      dealValue: "$75M",
      probability: 45,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-6",
      name: "HealthCare Plus",
      industry: "Healthcare",
      revenue: "$22.1M",
      location: "Boston, MA",
      savedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      health: 88,
      tags: ["Healthcare"],
      description: "Healthcare management software",
      originalDeal: {},
      campaignId: "campaign-3", // Set campaignId for campaign-3
      pipelineStage: "interested",
      contactAttempts: 2,
      dealValue: "$85M",
      probability: 65,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-7",
      name: "EduTech Solutions",
      industry: "EdTech",
      revenue: "$7.8M",
      location: "Chicago, IL",
      savedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      health: 82,
      tags: ["Education"],
      description: "Online learning platform",
      originalDeal: {},
      campaignId: "campaign-2", // Set campaignId for campaign-2
      pipelineStage: "contacted",
      contactAttempts: 0,
      dealValue: "$28M",
      probability: 30,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-8",
      name: "RetailTech Pro",
      industry: "Retail",
      revenue: "$14.3M",
      location: "Los Angeles, CA",
      savedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      health: 79,
      tags: ["Retail"],
      description: "Retail management system",
      originalDeal: {},
      campaignId: "campaign-1", // Set campaignId for campaign-1
      pipelineStage: "contacted",
      contactAttempts: 1,
      dealValue: "$52M",
      probability: 40,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-9",
      name: "LogiChain Systems",
      industry: "Logistics",
      revenue: "$11.7M",
      location: "Atlanta, GA",
      savedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      health: 86,
      tags: ["Logistics"],
      description: "Supply chain optimization",
      originalDeal: {},
      campaignId: "campaign-7", // Set campaignId for campaign-7
      pipelineStage: "negotiating",
      contactAttempts: 4,
      dealValue: "$42M",
      probability: 70,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-10",
      name: "CyberShield Inc",
      industry: "Cybersecurity",
      revenue: "$16.9M",
      location: "Washington, DC",
      savedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      health: 93,
      tags: ["Security"],
      description: "Enterprise security solutions",
      originalDeal: {},
      campaignId: "campaign-8", // Set campaignId for campaign-8
      pipelineStage: "due_diligence",
      contactAttempts: 5,
      dealValue: "$68M",
      probability: 80,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-11",
      name: "MarketingAI Co",
      industry: "Marketing",
      revenue: "$10.2M",
      location: "Miami, FL",
      savedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      health: 81,
      tags: ["AI", "Marketing"],
      description: "AI-powered marketing automation",
      originalDeal: {},
      campaignId: "campaign-2", // Set campaignId for campaign-2
      pipelineStage: "contacted",
      contactAttempts: 0,
      dealValue: "$38M",
      probability: 25,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-12",
      name: "PropTech Ventures",
      industry: "Real Estate",
      revenue: "$13.5M",
      location: "San Diego, CA",
      savedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      health: 77,
      tags: ["PropTech"],
      description: "Real estate technology platform",
      originalDeal: {},
      campaignId: "campaign-1", // Set campaignId for campaign-1
      pipelineStage: "contacted",
      contactAttempts: 1,
      dealValue: "$48M",
      probability: 35,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-13",
      name: "FoodTech Innovations",
      industry: "Food & Beverage",
      revenue: "$9.8M",
      location: "Portland, OR",
      savedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      health: 84,
      tags: ["Food"],
      description: "Food delivery optimization",
      originalDeal: {},
      campaignId: "campaign-7", // Set campaignId for campaign-7
      pipelineStage: "interested",
      contactAttempts: 2,
      dealValue: "$35M",
      probability: 55,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-14",
      name: "TravelTech Global",
      industry: "Travel",
      revenue: "$19.3M",
      location: "Las Vegas, NV",
      savedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      health: 89,
      tags: ["Travel"],
      description: "Travel booking platform",
      originalDeal: {},
      campaignId: "campaign-7", // Set campaignId for campaign-7
      pipelineStage: "negotiating",
      contactAttempts: 3,
      dealValue: "$72M",
      probability: 68,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-15",
      name: "InsurTech Solutions",
      industry: "Insurance",
      revenue: "$17.2M",
      location: "Hartford, CT",
      savedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      health: 87,
      tags: ["Insurance"],
      description: "Digital insurance platform",
      originalDeal: {},
      campaignId: "campaign-3", // Set campaignId for campaign-3
      pipelineStage: "contacted",
      contactAttempts: 0,
      dealValue: "$65M",
      probability: 22,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-16",
      name: "AutoTech Systems",
      industry: "Automotive",
      revenue: "$21.5M",
      location: "Detroit, MI",
      savedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      health: 90,
      tags: ["Automotive"],
      description: "Automotive software solutions",
      originalDeal: {},
      campaignId: "campaign-1", // Set campaignId for campaign-1
      pipelineStage: "contacted",
      contactAttempts: 1,
      dealValue: "$82M",
      probability: 42,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-17",
      name: "EnergyTech Pro",
      industry: "Energy",
      revenue: "$24.8M",
      location: "Houston, TX",
      savedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      health: 92,
      tags: ["Energy", "Clean Tech"],
      description: "Renewable energy management",
      originalDeal: {},
      campaignId: "campaign-6", // Set campaignId for campaign-6
      pipelineStage: "interested",
      contactAttempts: 2,
      dealValue: "$95M",
      probability: 58,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-18",
      name: "MediaTech Studios",
      industry: "Media",
      revenue: "$12.9M",
      location: "Los Angeles, CA",
      savedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      health: 83,
      tags: ["Media"],
      description: "Digital media production",
      originalDeal: {},
      campaignId: "campaign-2", // Set campaignId for campaign-2
      pipelineStage: "contacted",
      contactAttempts: 0,
      dealValue: "$46M",
      probability: 28,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-19",
      name: "SportsTech Analytics",
      industry: "Sports",
      revenue: "$8.6M",
      location: "Phoenix, AZ",
      savedDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      health: 80,
      tags: ["Sports"],
      description: "Sports analytics platform",
      originalDeal: {},
      campaignId: "campaign-2", // Set campaignId for campaign-2
      pipelineStage: "contacted",
      contactAttempts: 1,
      dealValue: "$32M",
      probability: 38,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-20",
      name: "LegalTech Solutions",
      industry: "Legal",
      revenue: "$15.7M",
      location: "Philadelphia, PA",
      savedDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      health: 86,
      tags: ["Legal"],
      description: "Legal practice management",
      originalDeal: {},
      campaignId: "campaign-3", // Set campaignId for campaign-3
      pipelineStage: "negotiating",
      contactAttempts: 3,
      dealValue: "$58M",
      probability: 72,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-21",
      name: "AgriTech Innovations",
      industry: "Agriculture",
      revenue: "$11.3M",
      location: "Des Moines, IA",
      savedDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      health: 85,
      tags: ["AgTech"],
      description: "Agricultural technology solutions",
      originalDeal: {},
      campaignId: "campaign-6", // Set campaignId for campaign-6
      pipelineStage: "contacted",
      contactAttempts: 0,
      dealValue: "$41M",
      probability: 24,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-22",
      name: "FashionTech Co",
      industry: "Fashion",
      revenue: "$9.4M",
      location: "New York, NY",
      savedDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      health: 78,
      tags: ["Fashion"],
      description: "Fashion e-commerce platform",
      originalDeal: {},
      campaignId: "campaign-1", // Set campaignId for campaign-1
      pipelineStage: "contacted",
      contactAttempts: 1,
      dealValue: "$34M",
      probability: 36,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-23",
      name: "ConstructTech Systems",
      industry: "Construction",
      revenue: "$18.9M",
      location: "Dallas, TX",
      savedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      health: 88,
      tags: ["Construction"],
      description: "Construction management software",
      originalDeal: {},
      campaignId: "campaign-1", // Set campaignId for campaign-1
      pipelineStage: "interested",
      contactAttempts: 2,
      dealValue: "$71M",
      probability: 62,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-24",
      name: "BioTech Labs",
      industry: "Biotechnology",
      revenue: "$26.3M",
      location: "San Diego, CA",
      savedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      health: 94,
      tags: ["BioTech"],
      description: "Biotechnology research platform",
      originalDeal: {},
      campaignId: "campaign-3", // Set campaignId for campaign-3
      pipelineStage: "due_diligence",
      contactAttempts: 5,
      dealValue: "$105M",
      probability: 82,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-25",
      name: "TelcoTech Solutions",
      industry: "Telecommunications",
      revenue: "$20.7M",
      location: "Denver, CO",
      savedDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      health: 87,
      tags: ["Telecom"],
      description: "Telecommunications infrastructure",
      originalDeal: {},
      campaignId: "campaign-7", // Set campaignId for campaign-7
      pipelineStage: "contacted",
      contactAttempts: 0,
      dealValue: "$78M",
      probability: 26,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-26",
      name: "GamingTech Studios",
      industry: "Gaming",
      revenue: "$14.6M",
      location: "Austin, TX",
      savedDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      health: 82,
      tags: ["Gaming"],
      description: "Mobile gaming platform",
      originalDeal: {},
      campaignId: "campaign-2", // Set campaignId for campaign-2
      pipelineStage: "contacted",
      contactAttempts: 1,
      dealValue: "$54M",
      probability: 44,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-27",
      name: "HRTech Innovations",
      industry: "HR Tech",
      revenue: "$10.8M",
      location: "San Francisco, CA",
      savedDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
      health: 81,
      tags: ["HR"],
      description: "HR management platform",
      originalDeal: {},
      campaignId: "campaign-1", // Set campaignId for campaign-1
      pipelineStage: "negotiating",
      contactAttempts: 3,
      dealValue: "$39M",
      probability: 69,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-28",
      name: "CleanTech Solutions",
      industry: "Clean Technology",
      revenue: "$16.2M",
      location: "Seattle, WA",
      savedDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
      health: 89,
      tags: ["Clean Tech"],
      description: "Environmental technology solutions",
      originalDeal: {},
      campaignId: "campaign-6", // Set campaignId for campaign-6
      pipelineStage: "contacted",
      contactAttempts: 0,
      dealValue: "$62M",
      probability: 27,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-29",
      name: "PetTech Ventures",
      industry: "Pet Care",
      revenue: "$7.9M",
      location: "Portland, OR",
      savedDate: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
      health: 76,
      tags: ["Pet Care"],
      description: "Pet care technology platform",
      originalDeal: {},
      campaignId: "campaign-3", // Set campaignId for campaign-3
      pipelineStage: "contacted",
      contactAttempts: 1,
      dealValue: "$29M",
      probability: 33,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-30",
      name: "SpaceTech Systems",
      industry: "Aerospace",
      revenue: "$31.5M",
      location: "Cape Canaveral, FL",
      savedDate: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
      health: 95,
      tags: ["Aerospace"],
      description: "Aerospace technology solutions",
      originalDeal: {},
      campaignId: "campaign-3", // Set campaignId for campaign-3
      pipelineStage: "interested",
      contactAttempts: 2,
      dealValue: "$125M",
      probability: 64,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-31",
      name: "WaterTech Solutions",
      industry: "Water Technology",
      revenue: "$12.4M",
      location: "Phoenix, AZ",
      savedDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      health: 84,
      tags: ["Water"],
      description: "Water management technology",
      originalDeal: {},
      campaignId: "campaign-3", // Set campaignId for campaign-3
      pipelineStage: "contacted",
      contactAttempts: 0,
      dealValue: "$45M",
      probability: 29,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-32",
      name: "MusicTech Studios",
      industry: "Music",
      revenue: "$8.7M",
      location: "Nashville, TN",
      savedDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      health: 79,
      tags: ["Music"],
      description: "Music streaming platform",
      originalDeal: {},
      campaignId: "campaign-2", // Set campaignId for campaign-2
      pipelineStage: "contacted",
      contactAttempts: 1,
      dealValue: "$33M",
      probability: 37,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-33",
      name: "ChemTech Innovations",
      industry: "Chemical",
      revenue: "$19.8M",
      location: "Houston, TX",
      savedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      health: 88,
      tags: ["Chemical"],
      description: "Chemical processing technology",
      originalDeal: {},
      campaignId: "campaign-7", // Set campaignId for campaign-7
      pipelineStage: "negotiating",
      contactAttempts: 4,
      dealValue: "$74M",
      probability: 71,
      notes: [],
      interactions: [],
    },
    {
      id: "saved-34",
      name: "RoboTech Systems",
      industry: "Robotics",
      revenue: "$23.6M",
      location: "Boston, MA",
      savedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      health: 91,
      tags: ["Robotics"],
      description: "Industrial robotics solutions",
      originalDeal: {},
      campaignId: "campaign-3", // Set campaignId for campaign-3
      pipelineStage: "due_diligence",
      contactAttempts: 5,
      dealValue: "$92M",
      probability: 79,
      notes: [],
      interactions: [],
    },
  ],
  savedQueries: [
    {
      id: "query-1",
      name: "High-Growth SaaS",
      description: "SaaS companies with >80 health score and $10M+ revenue",
      searchQuery: "SaaS growth",
      filters: {
        industry: ["SaaS"],
        health: { min: 80, max: 100 },
        revenue: { min: 10, max: 100 },
      },
      createdAt: "2024-01-20",
      color: "blue",
      resultCount: 12,
    },
  ],
  campaigns: [
    {
      id: "campaign-1",
      name: "Q1 2024 Outreach",
      description: "Initial outreach to high-potential SaaS and manufacturing targets",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      dealIds: [
        "saved-1",
        "saved-2",
        "saved-4",
        "saved-5",
        "saved-8",
        "saved-12",
        "saved-22",
        "saved-16",
        "saved-23",
        "saved-27",
      ],
      tags: ["SaaS", "Manufacturing", "Q1"],
      outreachStats: {
        sent: 10,
        received: 8,
        replied: 5,
        interested: 3,
      },
    },
    {
      id: "campaign-2",
      name: "Data Intelligence Initiative",
      description: "Targeting analytics and data companies for strategic acquisition",
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      dealIds: [
        "saved-3",
        "saved-11",
        "saved-19",
        "saved-26",
        "saved-32",
        "saved-1",
        "saved-7",
        "saved-18",
        "saved-27",
      ],
      tags: ["Analytics", "Data", "AI"],
      outreachStats: {
        sent: 9,
        received: 7,
        replied: 4,
        interested: 3,
      },
    },
    {
      id: "campaign-3",
      name: "Strategic Growth Initiative",
      description: "Strategic focus on healthcare technology and biotechnology companies with strong growth potential",
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      dealIds: [
        "saved-6",
        "saved-24",
        "saved-15",
        "saved-29",
        "saved-18",
        "saved-30",
        "saved-7",
        "saved-13",
        "saved-20",
        "saved-31",
        "saved-34",
      ],
      tags: ["Healthcare", "BioTech", "High Value"],
      outreachStats: {
        sent: 11,
        received: 9,
        replied: 7,
        interested: 5,
      },
    },
    {
      id: "campaign-4",
      name: "Market Expansion Program",
      description: "Exploring opportunities in financial technology and payment processing sectors",
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      status: "paused",
      dealIds: [
        "saved-5",
        "saved-15",
        "saved-20",
        "saved-27",
        "saved-33",
        "saved-12",
        "saved-14",
        "saved-16",
        "saved-22",
        "saved-25",
      ],
      tags: ["FinTech", "Financial Services", "Q1"],
      outreachStats: {
        sent: 10,
        received: 6,
        replied: 3,
        interested: 2,
      },
    },
    {
      id: "campaign-5",
      name: "Enterprise Pipeline",
      description: "Building relationships with enterprise-grade SaaS companies for potential acquisition",
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: "completed",
      dealIds: [
        "saved-1",
        "saved-4",
        "saved-7",
        "saved-16",
        "saved-23",
        "saved-27",
        "saved-10",
        "saved-11",
        "saved-19",
        "saved-26",
        "saved-32",
        "saved-34",
      ],
      tags: ["SaaS", "Enterprise", "Completed"],
      outreachStats: {
        sent: 12,
        received: 10,
        replied: 8,
        interested: 6,
      },
    },
    {
      id: "campaign-6",
      name: "Sustainability Initiative",
      description: "Targeting renewable energy and clean technology companies aligned with ESG goals",
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      dealIds: [
        "saved-2",
        "saved-17",
        "saved-28",
        "saved-21",
        "saved-31",
        "saved-13",
        "saved-23",
        "saved-29",
        "saved-30",
        "saved-33",
      ],
      tags: ["Clean Tech", "Energy", "ESG"],
      outreachStats: {
        sent: 10,
        received: 8,
        replied: 5,
        interested: 4,
      },
    },
    {
      id: "campaign-7",
      name: "Operations Excellence Program",
      description: "Strategic outreach to logistics and supply chain optimization companies",
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      dealIds: [
        "saved-9",
        "saved-13",
        "saved-14",
        "saved-23",
        "saved-25",
        "saved-2",
        "saved-8",
        "saved-12",
        "saved-16",
        "saved-21",
        "saved-33",
      ],
      tags: ["Logistics", "Supply Chain", "Operations"],
      outreachStats: {
        sent: 11,
        received: 8,
        replied: 5,
        interested: 3,
      },
    },
    {
      id: "campaign-8",
      name: "Security & Defense Initiative",
      description: "High-priority outreach to cybersecurity and defense technology companies",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      dealIds: [
        "saved-10",
        "saved-16",
        "saved-18",
        "saved-30",
        "saved-34",
        "saved-1",
        "saved-4",
        "saved-20",
        "saved-24",
      ],
      tags: ["Cybersecurity", "Defense", "High Priority"],
      outreachStats: {
        sent: 9,
        received: 8,
        replied: 7,
        interested: 6,
      },
    },
  ],
  communications: [
    {
      id: "comm-1",
      dealId: "saved-1",
      dealName: "TechFlow Solutions",
      type: "email",
      direction: "inbound",
      subject: "Re: Partnership Opportunity",
      preview: "Thanks for reaching out. I'd be interested in learning more about your proposal...",
      fullContent:
        "Thanks for reaching out. I'd be interested in learning more about your proposal. Would next Tuesday work for a call?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "unread",
      from: "john@techflow.com",
      to: "you@company.com",
      sentiment: "positive",
    },
    {
      id: "comm-2",
      dealId: "saved-3",
      dealName: "DataViz Pro",
      type: "email",
      direction: "inbound",
      subject: "Following up on our conversation",
      preview: "Hi, just wanted to follow up on our last call. We've discussed internally and...",
      fullContent:
        "Hi, just wanted to follow up on our last call. We've discussed internally and would like to move forward with the next steps.",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: "unread",
      from: "sarah@dataviz.com",
      to: "you@company.com",
      sentiment: "positive",
    },
    {
      id: "comm-3",
      dealId: "saved-2",
      dealName: "GreenTech Manufacturing",
      type: "call",
      direction: "outbound",
      preview: "Left voicemail regarding acquisition interest",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "read",
      from: "you@company.com",
      to: "contact@greentech.com",
      sentiment: "neutral",
    },
  ],
  availableTags: [
    "High Growth",
    "Profitable",
    "ESG Focused",
    "Stable",
    "SaaS",
    "Manufacturing",
    "Analytics",
    "Data",
    "Q1",
    "Q2",
    "Q3",
    "Q4",
    "Enterprise",
    "SMB",
    "Series A",
    "Series B",
    "Bootstrapped",
    "VC-Backed",
    "Cloud",
    "FinTech",
    "Healthcare",
    "EdTech",
    "Retail",
    "Logistics",
    "Cybersecurity",
    "Marketing",
    "Real Estate",
    "Food & Beverage",
    "Travel",
    "Insurance",
    "Automotive",
    "Energy",
    "Clean Tech",
    "Media",
    "Sports",
    "Legal",
    "Agriculture",
    "Fashion",
    "Construction",
    "Biotechnology",
    "Telecommunications",
    "Gaming",
    "HR Tech",
    "Pet Care",
    "Aerospace",
    "Water Technology",
    "Music",
    "Chemical",
    "Robotics",
  ],
}

function savedDealsReducer(state: SavedDealsState, action: SavedDealsAction): SavedDealsState {
  switch (action.type) {
    case "SAVE_DEAL": {
      const deal = action.payload

      if (!deal) {
        console.error("[v0] Deal is undefined!")
        return state
      }

      const savedDeal: SavedDeal = {
        id: `saved-${Date.now()}`,
        name: deal.name,
        industry: deal.industry,
        revenue: deal.revenue,
        multiple: deal.multiple,
        location: deal.location,
        savedDate: new Date().toISOString(),
        health: deal.health,
        tags: deal.tags || [],
        description: deal.description,
        originalDeal: deal,
        campaignId: deal.campaignId,
        pipelineStage: deal.pipelineStage || "saved",
        lastContactDate: deal.lastContactDate,
        lastInteractionSummary: deal.lastInteractionSummary,
        nextFollowUpDate: deal.nextFollowUpDate,
        contactAttempts: deal.contactAttempts || 0,
        dealValue: deal.dealValue,
        probability: deal.probability || 0,
        assignedTo: deal.assignedTo,
        notes: deal.notes || [],
        interactions: deal.interactions || [],
      }

      return {
        ...state,
        savedDeals: [...state.savedDeals, savedDeal],
      }
    }

    case "UNSAVE_DEAL": {
      return {
        ...state,
        savedDeals: state.savedDeals.filter((deal) => deal.id !== action.payload),
      }
    }

    case "SAVE_QUERY": {
      const newQuery: SavedQuery = {
        id: `query-${Date.now()}`,
        ...action.payload,
        createdAt: new Date().toISOString(),
      }
      return {
        ...state,
        savedQueries: [...state.savedQueries, newQuery],
      }
    }

    case "DELETE_QUERY": {
      return {
        ...state,
        savedQueries: state.savedQueries.filter((query) => query.id !== action.payload),
      }
    }

    case "UPDATE_QUERY_RESULTS": {
      const { queryId, resultCount } = action.payload
      return {
        ...state,
        savedQueries: state.savedQueries.map((query) => (query.id === queryId ? { ...query, resultCount } : query)),
      }
    }

    case "CREATE_CAMPAIGN": {
      const newCampaign: Campaign = {
        id: `campaign-${Date.now()}`,
        name: action.payload.name,
        description: action.payload.description,
        createdAt: new Date().toISOString(),
        status: "active",
        dealIds: action.payload.dealIds,
        tags: action.payload.tags,
        outreachStats: {
          sent: 0,
          received: 0,
          replied: 0,
          interested: 0,
        },
      }

      const newTags = action.payload.tags.filter((tag) => !state.availableTags.includes(tag))

      return {
        ...state,
        campaigns: [...state.campaigns, newCampaign],
        availableTags: [...state.availableTags, ...newTags],
      }
    }

    case "UPDATE_CAMPAIGN": {
      const { campaignId, updates } = action.payload
      return {
        ...state,
        campaigns: state.campaigns.map((campaign) =>
          campaign.id === campaignId ? { ...campaign, ...updates } : campaign,
        ),
      }
    }

    case "DELETE_CAMPAIGN": {
      return {
        ...state,
        campaigns: state.campaigns.filter((campaign) => campaign.id !== action.payload),
      }
    }

    case "ADD_COMMUNICATION": {
      return {
        ...state,
        communications: [action.payload, ...state.communications],
      }
    }

    case "MARK_COMMUNICATION_READ": {
      return {
        ...state,
        communications: state.communications.map((comm) =>
          comm.id === action.payload ? { ...comm, status: "read" as const } : comm,
        ),
      }
    }

    case "ARCHIVE_COMMUNICATION": {
      return {
        ...state,
        communications: state.communications.map((comm) =>
          comm.id === action.payload ? { ...comm, status: "archived" as const } : comm,
        ),
      }
    }

    case "ADD_TAG_TO_DEAL": {
      const { dealId, tag } = action.payload
      const newAvailableTags = state.availableTags.includes(tag) ? state.availableTags : [...state.availableTags, tag]

      return {
        ...state,
        savedDeals: state.savedDeals.map((deal) =>
          deal.id === dealId && !deal.tags.includes(tag) ? { ...deal, tags: [...deal.tags, tag] } : deal,
        ),
        availableTags: newAvailableTags,
      }
    }

    case "REMOVE_TAG_FROM_DEAL": {
      const { dealId, tag } = action.payload
      return {
        ...state,
        savedDeals: state.savedDeals.map((deal) =>
          deal.id === dealId ? { ...deal, tags: deal.tags.filter((t) => t !== tag) } : deal,
        ),
      }
    }

    case "ADD_GLOBAL_TAG": {
      const tag = action.payload
      if (state.availableTags.includes(tag)) {
        return state
      }
      return {
        ...state,
        availableTags: [...state.availableTags, tag],
      }
    }

    case "REORDER_DEALS": {
      return {
        ...state,
        savedDeals: action.payload,
      }
    }

    default:
      return state
  }
}

const SavedDealsContext = createContext<{
  state: SavedDealsState
  dispatch: React.Dispatch<SavedDealsAction>
} | null>(null)

export function SavedDealsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(savedDealsReducer, initialState)

  return <SavedDealsContext.Provider value={{ state, dispatch }}>{children}</SavedDealsContext.Provider>
}

export function useSavedDeals() {
  const context = useContext(SavedDealsContext)
  if (!context) {
    throw new Error("useSavedDeals must be used within a SavedDealsProvider")
  }
  return context
}
