export const workflowDefinitions = {
  "financial-analysis": {
    id: "financial-analysis",
    title: "Financial Analysis",
    description: "Comprehensive financial performance analysis",
    category: "Financial",
    color: "bg-blue-500",
    iconColor: "text-white",
    Icon: "TrendingUp",
    promptTemplate: "Analyze the financial performance of this company",
    steps: [
      {
        id: "revenue-analysis",
        text: "Analyzing revenue trends and growth patterns",
        duration: 1000,
        generates: "RevenueChart",
        insight: "Revenue has grown consistently at 15% YoY",
      },
      {
        id: "profitability-analysis",
        text: "Evaluating profitability metrics and margins",
        duration: 1200,
        generates: "EbitdaChart",
        insight: "EBITDA margins have improved from 18% to 22%",
      },
      {
        id: "cash-flow-analysis",
        text: "Reviewing cash flow generation and working capital",
        duration: 800,
        generates: "CashFlowChart",
        insight: "Strong free cash flow conversion at 85% of EBITDA",
      },
    ],
  },
  "market-analysis": {
    id: "market-analysis",
    title: "Market Analysis",
    description: "Industry trends and competitive positioning",
    category: "Market Research",
    color: "bg-green-500",
    iconColor: "text-white",
    Icon: "BarChart3",
    promptTemplate: "Analyze the market position and competitive landscape",
    steps: [
      {
        id: "market-size",
        text: "Calculating total addressable market size",
        duration: 900,
        generates: "MarketSizeChart",
        insight: "TAM of $12B growing at 8% annually",
      },
      {
        id: "competitive-analysis",
        text: "Mapping competitive landscape and positioning",
        duration: 1100,
        generates: "CompetitiveMatrix",
        insight: "Company holds #3 market position with differentiated offering",
      },
    ],
  },
  "risk-assessment": {
    id: "risk-assessment",
    title: "Risk Assessment",
    description: "Comprehensive risk analysis and mitigation strategies",
    category: "Risk Management",
    color: "bg-red-500",
    iconColor: "text-white",
    Icon: "AlertTriangle",
    promptTemplate: "Conduct a comprehensive risk assessment",
    steps: [
      {
        id: "operational-risks",
        text: "Identifying operational and business risks",
        duration: 1000,
        generates: "RiskRadarChart",
        insight: "Key risks identified in customer concentration and regulatory changes",
      },
      {
        id: "financial-risks",
        text: "Analyzing financial and market risks",
        duration: 800,
        generates: "RiskMatrix",
        insight: "Moderate financial risk profile with strong balance sheet",
      },
    ],
  },
  "customer-analysis": {
    id: "customer-analysis",
    title: "Customer Analysis",
    description: "Customer segmentation and retention analysis",
    category: "Customer Intelligence",
    color: "bg-purple-500",
    iconColor: "text-white",
    Icon: "Users",
    promptTemplate: "Analyze customer base and retention metrics",
    steps: [
      {
        id: "customer-segmentation",
        text: "Segmenting customer base by value and behavior",
        duration: 1200,
        generates: "CustomerSegmentChart",
        insight: "Top 20% of customers generate 65% of revenue",
      },
      {
        id: "retention-analysis",
        text: "Analyzing customer retention and churn patterns",
        duration: 1000,
        generates: "CohortChart",
        insight: "Customer retention rate of 94% with low churn in enterprise segment",
      },
    ],
  },
  "valuation-analysis": {
    id: "valuation-analysis",
    title: "Valuation Analysis",
    description: "DCF modeling and comparable company analysis",
    category: "Valuation",
    color: "bg-orange-500",
    iconColor: "text-white",
    Icon: "Calculator",
    promptTemplate: "Perform comprehensive valuation analysis",
    steps: [
      {
        id: "dcf-model",
        text: "Building discounted cash flow model",
        duration: 1500,
        generates: "DCFChart",
        insight: "DCF valuation range of $42-48M based on 12% WACC",
      },
      {
        id: "comparable-analysis",
        text: "Analyzing comparable company multiples",
        duration: 1000,
        generates: "ComparableChart",
        insight: "Trading at discount to peers at 7.2x EV/EBITDA vs 8.5x median",
      },
    ],
  },
  "due-diligence": {
    id: "due-diligence",
    title: "Due Diligence Review",
    description: "Comprehensive due diligence checklist and analysis",
    category: "Due Diligence",
    color: "bg-indigo-500",
    iconColor: "text-white",
    Icon: "FileCheck",
    promptTemplate: "Conduct comprehensive due diligence review",
    steps: [
      {
        id: "financial-dd",
        text: "Reviewing financial statements and accounting policies",
        duration: 1800,
        generates: "QoeTable",
        insight: "Clean financial statements with conservative accounting practices",
      },
      {
        id: "legal-dd",
        text: "Analyzing legal structure and compliance",
        duration: 1200,
        generates: "LegalMatrix",
        insight: "No material legal issues identified, strong IP portfolio",
      },
      {
        id: "operational-dd",
        text: "Evaluating operational processes and systems",
        duration: 1000,
        generates: "OperationalChart",
        insight: "Scalable operations with room for efficiency improvements",
      },
    ],
  },
}

export type WorkflowDefinition = {
  id: string
  title: string
  description: string
  category: string
  color: string
  iconColor: string
  Icon: string
  promptTemplate: string
  steps: Array<{
    id: string
    text: string
    duration: number
    generates?: string
    insight?: string
  }>
}

export type WorkflowDefinitions = typeof workflowDefinitions
