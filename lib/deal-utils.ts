// Utility functions for deal-related operations
export const getHealthColor = (health: number) => {
  if (health >= 85) return "bg-green-500"
  if (health >= 70) return "bg-yellow-500"
  return "bg-red-500"
}

export const getCreditScoreColor = (score: string) => {
  if (score.startsWith("A")) return "text-green-600"
  if (score.startsWith("B")) return "text-yellow-600"
  return "text-red-600"
}

export const getStageColor = (stage: string) => {
  switch (stage) {
    case "Due Diligence":
      return "border-slate-200 text-slate-700 bg-slate-50"
    case "Pending LOI":
      return "border-amber-200 text-amber-700 bg-amber-50"
    case "Closing":
      return "border-green-200 text-green-700 bg-green-50"
    case "Initial Review":
      return "border-gray-200 text-gray-700 bg-gray-50"
    case "Sourcing":
      return "border-neutral-200 text-neutral-700 bg-neutral-50"
    default:
      return "border-gray-200 text-gray-700 bg-gray-50"
  }
}

export const INDUSTRY_MULTIPLIERS = {
  // High-growth, high-margin industries
  SaaS: 1.25,
  Technology: 1.2,
  Cybersecurity: 1.3,
  Biotechnology: 1.25,
  Gaming: 1.15,

  // Healthcare and specialized services
  Healthcare: 1.2,
  Pharmaceuticals: 1.25,
  Education: 1.1,
  Veterinary: 1.05,

  // Financial and professional services
  "Financial Services": 1.15,
  Insurance: 1.1,
  Consulting: 1.1,
  "Real Estate": 1.05,

  // Energy and sustainability (trending up)
  Energy: 1.15,
  "Renewable Energy": 1.2,
  "Water Treatment": 1.1,

  // Traditional industries (stable but lower growth)
  Manufacturing: 1.0,
  Construction: 0.95,
  Automotive: 0.95,
  Chemicals: 0.9,
  Mining: 0.85,

  // Service industries
  Retail: 0.9,
  "Food & Beverage": 0.95,
  Hospitality: 0.85,
  Transportation: 0.9,
  Logistics: 1.0,

  // Specialized industries
  Aerospace: 1.05,
  Marine: 0.95,
  Agriculture: 0.95,
  Textiles: 0.85,
  Printing: 0.8,
  Packaging: 0.9,
  "Waste Management": 1.0,
  Telecommunications: 1.05,
  Media: 1.05,
  Fitness: 1.0,
  Robotics: 1.2,
} as const

export const calculateAdjustedHealthScore = (baseHealth: number, industry: string): number => {
  const multiplier = INDUSTRY_MULTIPLIERS[industry as keyof typeof INDUSTRY_MULTIPLIERS] || 1.0
  const adjustedScore = Math.round(baseHealth * multiplier)

  // Cap the score at 100 to maintain the 0-100 scale
  return Math.min(adjustedScore, 100)
}

export const getIndustryMultiplier = (industry: string): number => {
  return INDUSTRY_MULTIPLIERS[industry as keyof typeof INDUSTRY_MULTIPLIERS] || 1.0
}

export const getIndustryRating = (industry: string): { rating: string; color: string; description: string } => {
  const multiplier = getIndustryMultiplier(industry)

  if (multiplier >= 1.25) {
    return {
      rating: "Premium",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      description: "High-growth, high-margin industry",
    }
  } else if (multiplier >= 1.15) {
    return {
      rating: "Strong",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      description: "Above-average growth potential",
    }
  } else if (multiplier >= 1.05) {
    return {
      rating: "Good",
      color: "text-green-600 bg-green-50 border-green-200",
      description: "Solid industry fundamentals",
    }
  } else if (multiplier >= 0.95) {
    return {
      rating: "Stable",
      color: "text-slate-600 bg-slate-50 border-slate-200",
      description: "Mature, stable industry",
    }
  } else {
    return {
      rating: "Cautious",
      color: "text-amber-600 bg-amber-50 border-amber-200",
      description: "Traditional industry with challenges",
    }
  }
}
