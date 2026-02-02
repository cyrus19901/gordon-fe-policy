export const REPORT_TEMPLATE = {
  sections: [
    {
      id: "executive-summary",
      title: "Executive Summary",
      description: "High-level overview of the investment opportunity",
    },
    {
      id: "company-overview",
      title: "Company Overview",
      description: "Detailed analysis of the target company",
    },
    {
      id: "financial-analysis",
      title: "Financial Analysis",
      description: "Revenue, profitability, and financial metrics",
    },
    {
      id: "market-analysis",
      title: "Market Analysis",
      description: "Industry trends and competitive landscape",
    },
    {
      id: "management-team",
      title: "Management Team",
      description: "Leadership assessment and organizational structure",
    },
    {
      id: "risk-assessment",
      title: "Risk Assessment",
      description: "Key risks and mitigation strategies",
    },
    {
      id: "valuation",
      title: "Valuation",
      description: "Valuation methodology and price analysis",
    },
    {
      id: "investment-thesis",
      title: "Investment Thesis",
      description: "Strategic rationale and expected returns",
    },
    {
      id: "next-steps",
      title: "Next Steps",
      description: "Recommended actions and timeline",
    },
  ],
}

export type ReportSection = {
  id: string
  title: string
  description: string
}

export type ReportTemplate = {
  sections: ReportSection[]
}
