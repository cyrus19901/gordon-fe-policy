import { workflowDefinitions } from "./workflows"

export interface WorkflowRun {
  id: string
  workflowId: string
  analysis: string
  insights: string[]
  charts: Array<{
    type: string
    component: string
    title: string
    insight?: string
  }>
  recommendations: string[]
  timestamp: Date
}

const analysisTemplates = {
  "financial-analysis": {
    analysis:
      "Based on the comprehensive financial analysis, the company demonstrates strong fundamentals with consistent revenue growth of 15% year-over-year and improving EBITDA margins from 18% to 22%. The balance sheet shows healthy liquidity with a current ratio of 2.1x and manageable debt levels at 2.6x gross leverage. Free cash flow conversion remains robust at 85% of EBITDA, indicating efficient working capital management.",
    insights: [
      "Revenue growth accelerating in Q3 with 18% increase",
      "EBITDA margins expanding due to operational leverage",
      "Strong cash generation supporting growth investments",
      "Debt-to-equity ratio within target range for the industry",
    ],
    recommendations: [
      "Consider refinancing existing debt to take advantage of lower rates",
      "Evaluate opportunities for margin expansion through automation",
      "Monitor working capital trends closely during growth phase",
    ],
  },
  "market-analysis": {
    analysis:
      "The market analysis reveals a favorable competitive landscape with the company positioned as the #3 player in a $12B total addressable market growing at 8% annually. The competitive moat is strengthened by proprietary technology and strong customer relationships, with limited direct competition in the specialized segments where the company operates.",
    insights: [
      "TAM growing faster than GDP with secular tailwinds",
      "Company gaining market share from traditional players",
      "Barriers to entry increasing due to regulatory requirements",
      "Customer switching costs creating defensive positioning",
    ],
    recommendations: [
      "Accelerate expansion into adjacent market segments",
      "Invest in R&D to maintain technological advantage",
      "Consider strategic partnerships to access new markets",
    ],
  },
  "risk-assessment": {
    analysis:
      "The comprehensive risk assessment identifies moderate overall risk profile with key exposures in customer concentration (top 5 customers represent 45% of revenue) and regulatory changes in the renewable energy sector. However, these risks are partially mitigated by long-term contracts and the company's strong compliance track record.",
    insights: [
      "Customer concentration risk elevated but manageable",
      "Regulatory environment generally supportive of industry",
      "Operational risks well-controlled with strong management",
      "Financial risks limited due to conservative capital structure",
    ],
    recommendations: [
      "Diversify customer base through targeted acquisition",
      "Establish regulatory affairs function to monitor changes",
      "Implement additional operational redundancies for key processes",
    ],
  },
  "customer-analysis": {
    analysis:
      "Customer analysis reveals a highly engaged user base with strong retention metrics. The top 20% of customers generate 65% of revenue, indicating successful value delivery to enterprise clients. Net Promoter Score of 68 demonstrates strong customer satisfaction, while the 94% retention rate in the enterprise segment provides revenue predictability.",
    insights: [
      "Enterprise customers showing highest lifetime value",
      "Customer acquisition costs declining with improved targeting",
      "Upselling opportunities identified in existing accounts",
      "Churn concentrated in smaller customer segments",
    ],
    recommendations: [
      "Develop dedicated enterprise customer success program",
      "Implement predictive analytics for churn prevention",
      "Create tiered service offerings to better serve different segments",
    ],
  },
  "valuation-analysis": {
    analysis:
      "The valuation analysis supports a fair value range of $42-48M based on DCF methodology using a 12% WACC. Comparable company analysis shows the target trading at a discount to peers at 7.2x EV/EBITDA versus the sector median of 8.5x, suggesting potential upside. The discount appears justified by smaller scale but may compress as the company executes its growth strategy.",
    insights: [
      "DCF valuation indicates fair value at current metrics",
      "Multiple expansion opportunity as company scales",
      "Peer group trading at premium due to larger size",
      "Growth trajectory supports higher valuation over time",
    ],
    recommendations: [
      "Focus on metrics that drive multiple expansion",
      "Benchmark against high-growth peers in the sector",
      "Consider strategic initiatives to accelerate scale",
    ],
  },
  "due-diligence": {
    analysis:
      "The due diligence review reveals a well-managed company with clean financial statements, conservative accounting practices, and strong operational controls. Legal structure is appropriate with no material litigation or compliance issues identified. The management team demonstrates deep industry expertise with a proven track record of execution.",
    insights: [
      "Financial reporting quality is high with conservative policies",
      "Legal and regulatory compliance is well-maintained",
      "Operational processes are scalable and well-documented",
      "Management team has strong industry credentials",
    ],
    recommendations: [
      "Proceed with transaction based on positive findings",
      "Implement enhanced reporting for portfolio monitoring",
      "Consider management retention and incentive programs",
    ],
  },
}

const chartConfigurations = {
  "financial-analysis": [
    {
      type: "chart",
      component: "EbitdaChart",
      title: "EBITDA Trend Analysis",
      insight: "EBITDA margins improving consistently over 3-year period",
    },
    {
      type: "table",
      component: "QoeTable",
      title: "Quality of Earnings Analysis",
      insight: "High-quality earnings with minimal adjustments required",
    },
  ],
  "market-analysis": [
    {
      type: "chart",
      component: "MarketSizeChart",
      title: "Total Addressable Market",
      insight: "TAM growing at 8% CAGR with company capturing increasing share",
    },
    {
      type: "chart",
      component: "CompetitiveChart",
      title: "Competitive Positioning",
      insight: "Strong competitive position in key market segments",
    },
  ],
  "risk-assessment": [
    {
      type: "chart",
      component: "RiskRadarChart",
      title: "Risk Assessment Matrix",
      insight: "Moderate risk profile with manageable key exposures",
    },
  ],
  "customer-analysis": [
    {
      type: "chart",
      component: "CohortChart",
      title: "Customer Retention Analysis",
      insight: "Strong retention rates across all customer cohorts",
    },
    {
      type: "chart",
      component: "CustomerSegmentChart",
      title: "Customer Segmentation",
      insight: "Enterprise segment driving majority of value creation",
    },
  ],
  "valuation-analysis": [
    {
      type: "chart",
      component: "DCFChart",
      title: "DCF Valuation Model",
      insight: "Fair value range of $42-48M based on conservative assumptions",
    },
    {
      type: "chart",
      component: "ComparableChart",
      title: "Comparable Company Analysis",
      insight: "Trading at discount to peers with potential for multiple expansion",
    },
  ],
  "due-diligence": [
    {
      type: "table",
      component: "QoeTable",
      title: "Financial Due Diligence Summary",
      insight: "Clean financial statements with no material adjustments",
    },
    {
      type: "chart",
      component: "OperationalChart",
      title: "Operational Assessment",
      insight: "Scalable operations with strong management systems",
    },
  ],
}

export function generateWorkflowRun(workflowId: string): WorkflowRun {
  const workflow = workflowDefinitions[workflowId as keyof typeof workflowDefinitions]
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`)
  }

  const template = analysisTemplates[workflowId as keyof typeof analysisTemplates]
  const charts = chartConfigurations[workflowId as keyof typeof chartConfigurations] || []

  if (!template) {
    // Fallback for workflows without specific templates
    return {
      id: `run_${Date.now()}`,
      workflowId,
      analysis: `Analysis complete for ${workflow.title}. The workflow has been executed successfully and key insights have been generated.`,
      insights: [
        "Analysis completed successfully",
        "Key metrics have been evaluated",
        "Recommendations are available for review",
      ],
      charts: [],
      recommendations: ["Review the generated analysis", "Consider next steps based on findings"],
      timestamp: new Date(),
    }
  }

  return {
    id: `run_${Date.now()}`,
    workflowId,
    analysis: template.analysis,
    insights: template.insights,
    charts,
    recommendations: template.recommendations,
    timestamp: new Date(),
  }
}

export function getWorkflowRunById(runId: string): WorkflowRun | null {
  // In a real application, this would fetch from a database
  // For now, return null as runs are generated on-demand
  return null
}

export function getAllWorkflowRuns(): WorkflowRun[] {
  // In a real application, this would fetch from a database
  // For now, return empty array as runs are generated on-demand
  return []
}
