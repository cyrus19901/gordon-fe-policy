"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Trash2,
  Play,
  Wallet,
  Bot,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil,
  Zap,
  Lock,
  ArrowLeft,
  Shield,
  UserCheck,
  FileCheck,
  ArrowRight,
  Copy,
  ChevronRight,
  FolderOpen,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, BackendPolicy } from "@/lib/api-client"
import { toast } from "sonner"

// Types
interface HardConstraint {
  id: string
  rule: string
}

interface SoftConstraint {
  id: string
  guideline: string
}

interface DecisionOutcome {
  id: string
  action: "auto-approve" | "approve-with-justification" | "ask-approval" | "block"
  label: string
  conditions: string
  color: string
  icon: typeof CheckCircle2
}

interface ApproverRoute {
  id: string
  condition: string
  approver: string
}

interface EvidenceRequirement {
  id: string
  category: string
  requirements: string
}

interface PolicyTemplate {
  id: string
  name: string
  status: "active" | "draft" | "archived"
  lastModified: string
  transactionType: "a2m" | "a2a" | "both"
  description: string
}

interface SimulationResult {
  decision: string
  decisionColor: string
  reason: string
  suggestedAlternative?: string
  evidenceAttached: string[]
  rulesTriggered: string[]
  riskScore: number
  confidence: number
}

export function PolicyBuilderView() {
  // Policy list state
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)
  const [showPolicyList, setShowPolicyList] = useState(false)
  const [policies, setPolicies] = useState<PolicyTemplate[]>([])
  const [policiesCache, setPoliciesCache] = useState<Map<string, BackendPolicy>>(new Map())
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Editor state
  const [activeTab, setActiveTab] = useState<"define" | "enforcement">("define")
  const [policyName, setPolicyName] = useState("Procurement Policy")
  const [transactionType, setTransactionType] = useState<"a2m" | "a2a" | "both">("a2m")
  const [llmScope, setLlmScope] = useState<"all" | "specific">("specific")
  const [selectedLLMs, setSelectedLLMs] = useState<string[]>(["chatgpt"])
  const [simulationInput, setSimulationInput] = useState("")
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)

  // Natural language policy statement
  const [policyStatement, setPolicyStatement] = useState(
    "Agents can procure goods and services from approved vendors within budget.\nPurchases over $1,000 need department head approval. Any new vendor must go through vendor qualification first.\nAll purchases must reference a valid PO number and cost center."
  )

  // Structured constraints
  const [intent, setIntent] = useState("Goods & services procurement")
  const [scope, setScope] = useState("All departments with purchasing authority")

  const [hardConstraints, setHardConstraints] = useState<HardConstraint[]>([
    { id: "hc-1", rule: "Max single transaction without approval: $1,000" },
    { id: "hc-2", rule: "Only approved vendors from the qualified vendor list" },
    { id: "hc-3", rule: "Must have valid PO number and cost center code" },
    { id: "hc-4", rule: "Blocked categories: personal items, gift cards, cryptocurrency" },
    { id: "hc-5", rule: "Cannot exceed quarterly departmental budget allocation" },
  ])

  const [softConstraints, setSoftConstraints] = useState<SoftConstraint[]>([
    { id: "sc-1", guideline: "Prefer vendors with negotiated contract pricing" },
    { id: "sc-2", guideline: "Get 3 quotes for purchases over $5,000" },
    { id: "sc-3", guideline: "Choose items from pre-approved catalog when available" },
    { id: "sc-4", guideline: "Consolidate orders to same vendor within 48h window to reduce shipping" },
  ])

  // Decision outcomes
  const [decisionOutcomes] = useState<DecisionOutcome[]>([
    { id: "do-1", action: "auto-approve", label: "Auto-approve", conditions: "Amount <= $1,000 AND vendor approved AND within budget AND valid PO", color: "text-green-600", icon: CheckCircle2 },
    { id: "do-2", action: "approve-with-justification", label: "Approve with justification", conditions: "Amount <= $5,000 AND vendor approved AND business need documented", color: "text-blue-600", icon: FileCheck },
    { id: "do-3", action: "ask-approval", label: "Ask approval", conditions: "Over $1,000 OR new vendor OR non-catalog item OR no PO reference", color: "text-amber-600", icon: UserCheck },
    { id: "do-4", action: "block", label: "Block", conditions: "Vendor not qualified OR blocked category OR budget exceeded OR compliance violation", color: "text-red-600", icon: XCircle },
  ])

  // Approver routing
  const [approverRoutes] = useState<ApproverRoute[]>([
    { id: "ar-1", condition: "Default (< $5,000)", approver: "Department head" },
    { id: "ar-2", condition: "$5,000 - $25,000", approver: "VP of Operations" },
    { id: "ar-3", condition: "> $25,000 or new vendor", approver: "CFO + Procurement lead" },
    { id: "ar-4", condition: "Approver OOO", approver: "Backup approver (auto-routed)" },
  ])

  // Evidence requirements
  const [evidenceRequirements] = useState<EvidenceRequirement[]>([
    { id: "er-1", category: "Standard purchase", requirements: "PO number + cost center + business justification" },
    { id: "er-2", category: "New vendor", requirements: "W-9 + insurance cert + vendor qualification form + 3 quotes" },
    { id: "er-3", category: "Capital expenditure", requirements: "Capital request form + ROI analysis + budget approval chain" },
    { id: "er-4", category: "Recurring / subscription", requirements: "Contract terms + auto-renewal flag + cancellation policy" },
  ])

  // Actions
  const addHardConstraint = () => {
    setHardConstraints(prev => [...prev, { id: `hc-${Date.now()}`, rule: "" }])
  }

  const removeHardConstraint = (id: string) => {
    setHardConstraints(prev => prev.filter(c => c.id !== id))
  }

  const addSoftConstraint = () => {
    setSoftConstraints(prev => [...prev, { id: `sc-${Date.now()}`, guideline: "" }])
  }

  const removeSoftConstraint = (id: string) => {
    setSoftConstraints(prev => prev.filter(c => c.id !== id))
  }

  // Run policy simulation - tests ONLY against the current policy being edited
  const runSimulation = async () => {
    if (!simulationInput.trim()) {
      toast.error("Please enter a scenario to test")
      return
    }

    if (!selectedPolicyId) {
      toast.error("Please save the policy first before testing")
      return
    }

    setIsSimulating(true)
    setSimulationResult(null)

    try {
      // Parse natural language input to extract transaction details
      const parsed = parseSimulationInput(simulationInput)
      
      // Build a test policy from current editor state
      const testPolicy: BackendPolicy = {
        id: selectedPolicyId,
        name: policyName,
        type: "composite",
        enabled: true,
        priority: 10000, // Highest priority for testing
        transactionTypes: transactionType === "both" ? ["all"] : 
                         transactionType === "a2a" ? ["agent-to-agent"] : 
                         ["agent-to-merchant"],
        conditions: {},
        rules: {}
      }

      // Extract rules from hard constraints
      hardConstraints.forEach(constraint => {
        const rule = constraint.rule
        const lower = rule.toLowerCase()
        
        const amountMatch = rule.match(/\$?([\d,]+)/);
        if (amountMatch) {
          const amount = parseFloat(amountMatch[1].replace(/,/g, ''))
          
          // Check if it's a per-transaction limit or a budget limit
          if (lower.includes('single') || (lower.includes('transaction') && lower.includes('max'))) {
            testPolicy.rules.maxTransactionAmount = amount
            testPolicy.type = 'transaction'
          } else if (lower.includes('budget') || lower.includes('spend') || (lower.includes('limit') && !lower.includes('transaction'))) {
            testPolicy.rules.maxAmount = amount
            testPolicy.type = 'budget'
            if (lower.includes('daily') || lower.includes('day')) {
              testPolicy.rules.period = 'daily'
            } else if (lower.includes('weekly') || lower.includes('week')) {
              testPolicy.rules.period = 'weekly'
            } else if (lower.includes('monthly') || lower.includes('month')) {
              testPolicy.rules.period = 'monthly'
            } else {
              testPolicy.rules.period = 'monthly'
            }
          }
        }

        if ((lower.includes('approved') || lower.includes('allowed')) && lower.includes('vendor')) {
          const afterColon = rule.split(':')[1]?.trim()
          if (afterColon) {
            testPolicy.rules.allowedMerchants = afterColon.split(',').map(m => m.trim()).filter(Boolean)
          }
        }

        if (lower.includes('blocked') && lower.includes('categor')) {
          const afterColon = rule.split(':')[1]?.trim()
          if (afterColon) {
            testPolicy.rules.blockedCategories = afterColon.split(',').map(m => m.trim()).filter(Boolean)
          }
        }
      })

      // Set fallback action - what happens when no specific rules are triggered
      // For transaction limits and budgets, if a transaction doesn't violate any rule, it should be approved
      testPolicy.rules.fallbackAction = "approve"

      // Debug: Log the test policy being created
      console.log('🧪 Test Policy Configuration:', {
        name: testPolicy.name,
        type: testPolicy.type,
        rules: testPolicy.rules,
        hardConstraints: hardConstraints.map(c => c.rule)
      })

      // Get original state of THIS policy from cache (or fetch if not cached)
      let originalPolicyData = policiesCache.get(selectedPolicyId)
      if (!originalPolicyData) {
        originalPolicyData = await apiClient.getPolicy(selectedPolicyId)
      }
      
      // Get all other policies from cache
      const otherPolicies = Array.from(policiesCache.values())
        .filter(p => p.id !== selectedPolicyId)
      
      try {
        // Temporarily disable all other policies using cached data
        await Promise.all(
          otherPolicies.map(policy => 
            apiClient.updatePolicy({ ...policy, enabled: false })
          )
        )

        // Update THIS policy with test configuration
        await apiClient.updatePolicy(testPolicy)
        
        // Small delay to ensure database is updated
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Call backend policy check API - now only THIS policy is enabled
        const result = await apiClient.checkPolicy({
          user_id: "user-test-123",
          product_id: parsed.productId,
          price: parsed.price,
          merchant: parsed.merchant,
          category: parsed.category,
          transaction_type: transactionType === "both" ? "agent-to-merchant" : 
                           transactionType === "a2a" ? "agent-to-agent" : 
                           "agent-to-merchant",
        })

        // The backend evaluates all enabled policies - find THIS policy's result
        const currentPolicyResult = result.matchedPolicies.find(p => p.id === selectedPolicyId)

        // Build simulation result
        if (!currentPolicyResult) {
          const simulation: SimulationResult = {
            decision: "Policy conditions not triggered",
            decisionColor: "text-muted-foreground",
            reason: "This policy's conditions were not met by this transaction. The transaction may fall outside the scope of this policy's rules.",
            evidenceAttached: [
              `Product: ${parsed.productName || parsed.productId}`,
              `Amount: $${parsed.price}`,
              `Merchant: ${parsed.merchant || "Not specified"}`,
              `Category: ${parsed.category || "Not specified"}`,
            ],
            rulesTriggered: [],
            riskScore: 0.5,
            confidence: 0.85,
          }
          setSimulationResult(simulation)
          toast.info("Policy conditions not triggered")
          return
        }

        // Map backend result to frontend display
        const simulation: SimulationResult = {
          decision: currentPolicyResult.passed ? "Approved by this policy" : 
                    currentPolicyResult.reason?.toLowerCase().includes("approval") ? 
                    "Requires approval" : "Blocked by this policy",
          decisionColor: currentPolicyResult.passed ? "text-green-600" : 
                         currentPolicyResult.reason?.toLowerCase().includes("approval") ? 
                         "text-amber-600" : "text-red-600",
          reason: currentPolicyResult.reason || 
                  (currentPolicyResult.passed ? 
                    "Transaction meets all policy requirements" : 
                    "Transaction violates policy constraints"),
          evidenceAttached: [
            `Product: ${parsed.productName || parsed.productId}`,
            `Amount: $${parsed.price}`,
            `Merchant: ${parsed.merchant || "Not specified"}`,
            `Category: ${parsed.category || "Not specified"}`,
            `Policy: ${policyName}`,
          ],
          rulesTriggered: [currentPolicyResult.id],
          riskScore: currentPolicyResult.passed ? 0.1 : 0.7,
          confidence: 0.92,
        }

        setSimulationResult(simulation)
        toast.success("Simulation completed")
        
      } finally {
        // Restore THIS policy to its original state
        if (originalPolicyData) {
          await apiClient.updatePolicy(originalPolicyData)
        }
        
        // Re-enable all other policies (restore to their original enabled state)
        await Promise.all(
          otherPolicies.map(policy => 
            apiClient.updatePolicy({ ...policy, enabled: policy.enabled })
          )
        )
      }
    } catch (error: any) {
      console.error('Simulation failed:', error)
      toast.error(`Simulation failed: ${error.message}`)
    } finally {
      setIsSimulating(false)
    }
  }

  // Simple parser for natural language input
  const parseSimulationInput = (input: string): {
    productId: string
    productName?: string
    price: number
    merchant?: string
    category?: string
  } => {
    const lower = input.toLowerCase()
    
    // Extract price
    const priceMatch = input.match(/\$?([\d,]+(?:\.\d{2})?)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 100

    // Extract merchant
    let merchant = "Unknown Merchant"
    const merchantKeywords = ["from", "at", "via", "through"]
    for (const keyword of merchantKeywords) {
      const regex = new RegExp(`${keyword}\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')
      const match = input.match(regex)
      if (match) {
        merchant = match[1]
        break
      }
    }

    // Detect common merchants
    if (lower.includes('amazon')) merchant = 'Amazon'
    else if (lower.includes('dell')) merchant = 'Dell'
    else if (lower.includes('apple')) merchant = 'Apple'
    else if (lower.includes('microsoft')) merchant = 'Microsoft'
    else if (lower.includes('target')) merchant = 'Target'
    else if (lower.includes('walmart')) merchant = 'Walmart'

    // Extract product
    const productKeywords = ['buy', 'purchase', 'order', 'get']
    let productName = input
    for (const keyword of productKeywords) {
      const regex = new RegExp(`${keyword}\\s+(?:a\\s+|an\\s+)?([\\w\\s]+?)(?:\\s+(?:from|at|for|\\$)|$)`, 'i')
      const match = input.match(regex)
      if (match) {
        productName = match[1].trim()
        break
      }
    }

    // Detect category
    let category = "General"
    if (lower.includes('laptop') || lower.includes('computer')) category = 'Electronics'
    else if (lower.includes('software') || lower.includes('license')) category = 'Software'
    else if (lower.includes('purse') || lower.includes('bag') || lower.includes('clothes')) category = 'Fashion'
    else if (lower.includes('furniture') || lower.includes('desk') || lower.includes('chair')) category = 'Furniture'
    else if (lower.includes('food') || lower.includes('meal') || lower.includes('lunch')) category = 'Food'

    return {
      productId: `prod-${Date.now()}`,
      productName: productName.trim(),
      price,
      merchant,
      category,
    }
  }

  // Load policies from backend
  useEffect(() => {
    loadPolicies()
  }, [])

  const loadPolicies = async () => {
    setIsLoadingPolicies(true)
    try {
      const backendPolicies = await apiClient.getPolicies()
      const mapped = backendPolicies.map(backendPolicyToTemplate)
      setPolicies(mapped)
      
      // Cache full policy data for later use (like simulation) to avoid fetching again
      const cache = new Map<string, BackendPolicy>()
      backendPolicies.forEach(policy => {
        cache.set(policy.id, policy)
      })
      setPoliciesCache(cache)
      
      // Select first policy by default if available
      if (mapped.length > 0 && !selectedPolicyId) {
        selectPolicy(mapped[0])
      }
    } catch (error: any) {
      console.error('Failed to load policies:', error)
      toast.error(`Failed to load policies: ${error.message}`)
    } finally {
      setIsLoadingPolicies(false)
    }
  }

  // Convert backend policy to template format for list display
  const backendPolicyToTemplate = (policy: BackendPolicy): PolicyTemplate => {
    // Determine transaction type from transactionTypes array
    let transactionType: "a2m" | "a2a" | "both" = "a2m"
    if (policy.transactionTypes) {
      if (policy.transactionTypes.includes('all')) {
        transactionType = "both"
      } else if (policy.transactionTypes.includes('agent-to-agent')) {
        transactionType = "a2a"
      }
    }

    // Generate description from rules
    let description = ""
    if (policy.rules.maxAmount) {
      description += `Max ${policy.rules.period || 'monthly'} spend: $${policy.rules.maxAmount}. `
    }
    if (policy.rules.maxTransactionAmount) {
      description += `Max transaction: $${policy.rules.maxTransactionAmount}. `
    }
    if (policy.rules.allowedMerchants && policy.rules.allowedMerchants.length > 0) {
      description += `Allowed merchants: ${policy.rules.allowedMerchants.join(', ')}. `
    }
    if (policy.rules.blockedMerchants && policy.rules.blockedMerchants.length > 0) {
      description += `Blocked merchants: ${policy.rules.blockedMerchants.join(', ')}. `
    }

    return {
      id: policy.id,
      name: policy.name,
      status: policy.enabled ? "active" : "draft",
      lastModified: "Recently",
      transactionType,
      description: description.trim() || "Policy rules configured"
    }
  }

  // Convert backend policy to editor format
  const selectPolicy = (template: PolicyTemplate) => {
    setSelectedPolicyId(template.id)
    setPolicyName(template.name)
    setTransactionType(template.transactionType)
    setShowPolicyList(false)
    
    // Load full policy details from backend
    apiClient.getPolicy(template.id).then(policy => {
      // Map backend rules to our natural language format
      const hardRules: HardConstraint[] = []
      const softRules: SoftConstraint[] = []

      if (policy.rules.maxTransactionAmount) {
        hardRules.push({ 
          id: `hc-${Date.now()}-1`, 
          rule: `Max single transaction without approval: $${policy.rules.maxTransactionAmount}` 
        })
      }
      if (policy.rules.allowedMerchants && policy.rules.allowedMerchants.length > 0) {
        hardRules.push({ 
          id: `hc-${Date.now()}-2`, 
          rule: `Only approved vendors: ${policy.rules.allowedMerchants.join(', ')}` 
        })
      }
      if (policy.rules.blockedMerchants && policy.rules.blockedMerchants.length > 0) {
        hardRules.push({ 
          id: `hc-${Date.now()}-3`, 
          rule: `Blocked merchants: ${policy.rules.blockedMerchants.join(', ')}` 
        })
      }
      if (policy.rules.allowedCategories && policy.rules.allowedCategories.length > 0) {
        softRules.push({ 
          id: `sc-${Date.now()}-1`, 
          guideline: `Prefer categories: ${policy.rules.allowedCategories.join(', ')}` 
        })
      }
      if (policy.rules.blockedCategories && policy.rules.blockedCategories.length > 0) {
        hardRules.push({ 
          id: `hc-${Date.now()}-4`, 
          rule: `Blocked categories: ${policy.rules.blockedCategories.join(', ')}` 
        })
      }

      if (hardRules.length > 0) setHardConstraints(hardRules)
      if (softRules.length > 0) setSoftConstraints(softRules)

      // Build policy statement from rules
      let statement = ""
      if (policy.rules.maxAmount) {
        statement += `Agents can spend up to $${policy.rules.maxAmount} per ${policy.rules.period || 'month'}.\n`
      }
      if (policy.rules.maxTransactionAmount) {
        statement += `Purchases over $${policy.rules.maxTransactionAmount} need approval.\n`
      }
      if (statement) setPolicyStatement(statement)
    }).catch(error => {
      console.error('Failed to load policy details:', error)
      toast.error('Failed to load policy details')
    })
  }

  const tabs = [
    { key: "define" as const, label: "Define", icon: Pencil },
    { key: "enforcement" as const, label: "Enforcement", icon: Shield },
  ]

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    archived: "bg-muted text-muted-foreground border-border",
  }

  const statusIcons: Record<string, typeof ShieldCheck> = {
    active: ShieldCheck,
    draft: Pencil,
    archived: FolderOpen,
  }

  const createNewPolicy = async () => {
    try {
      // Create a minimal policy in the backend
      const newBackendPolicy: BackendPolicy = {
        id: `pol-${Date.now()}`,
        name: "Untitled Policy",
        type: "transaction",
        enabled: false,
        priority: 100,
        transactionTypes: ["all"],
        conditions: {},
        rules: {
          maxTransactionAmount: 1000,
          fallbackAction: "require_approval",
        },
      }

      const created = await apiClient.createPolicy(newBackendPolicy)
      toast.success("New policy created")

      // Reload policies
      await loadPolicies()

      // Select the new policy
      const template = backendPolicyToTemplate(created)
      selectPolicy(template)
    } catch (error: any) {
      console.error('Failed to create policy:', error)
      toast.error(`Failed to create policy: ${error.message}`)
    }
  }

  const savePolicy = async (silent = false) => {
    if (!selectedPolicyId) {
      if (!silent) toast.error("No policy selected")
      return
    }

    setIsSaving(true)
    try {
      // Build backend policy from current editor state
      const backendPolicy: BackendPolicy = {
        id: selectedPolicyId,
        name: policyName,
        type: "composite",
        enabled: true,
        priority: 100,
        transactionTypes: transactionType === "both" ? ["all"] : 
                         transactionType === "a2a" ? ["agent-to-agent"] : 
                         ["agent-to-merchant"],
        conditions: {},
        rules: {}
      }

      // Extract rules from hard constraints
      hardConstraints.forEach(constraint => {
        const rule = constraint.rule
        const lower = rule.toLowerCase()
        
        // Extract amounts
        const amountMatch = rule.match(/\$?([\d,]+)/);
        if (amountMatch) {
          const amount = parseFloat(amountMatch[1].replace(/,/g, ''))
          if (lower.includes('max') && (lower.includes('single') || lower.includes('transaction'))) {
            backendPolicy.rules.maxTransactionAmount = amount
          } else if (lower.includes('max') && !lower.includes('single')) {
            backendPolicy.rules.maxAmount = amount
            // Try to detect period
            if (lower.includes('daily') || lower.includes('day')) {
              backendPolicy.rules.period = 'daily'
            } else if (lower.includes('weekly') || lower.includes('week')) {
              backendPolicy.rules.period = 'weekly'
            } else {
              backendPolicy.rules.period = 'monthly'
            }
          }
        }

        // Extract merchants (after colons or specific patterns)
        if ((lower.includes('approved') || lower.includes('allowed')) && lower.includes('vendor')) {
          const afterColon = rule.split(':')[1]?.trim()
          if (afterColon) {
            const merchants = afterColon.split(',').map(m => m.trim()).filter(Boolean)
            if (merchants.length > 0) {
              backendPolicy.rules.allowedMerchants = merchants
            }
          }
        } else if (lower.includes('blocked') && (lower.includes('vendor') || lower.includes('merchant'))) {
          const afterColon = rule.split(':')[1]?.trim()
          if (afterColon) {
            const merchants = afterColon.split(',').map(m => m.trim()).filter(Boolean)
            if (merchants.length > 0) {
              backendPolicy.rules.blockedMerchants = merchants
            }
          }
        }

        // Extract categories
        if (lower.includes('blocked') && lower.includes('categor')) {
          const afterColon = rule.split(':')[1]?.trim()
          if (afterColon) {
            const categories = afterColon.split(',').map(m => m.trim()).filter(Boolean)
            if (categories.length > 0) {
              backendPolicy.rules.blockedCategories = categories
            }
          }
        }
      })

      // Set fallback action - approve if no explicit blocking rules
      backendPolicy.rules.fallbackAction = "approve"

      await apiClient.updatePolicy(backendPolicy)
      if (!silent) toast.success(`Policy "${policyName}" saved successfully`)

      // Reload policies
      if (!silent) await loadPolicies()
    } catch (error: any) {
      console.error('Failed to save policy:', error)
      toast.error(`Failed to save policy: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const deletePolicy = async () => {
    if (!selectedPolicyId) return

    if (!confirm(`Are you sure you want to delete "${policyName}"?`)) {
      return
    }

    try {
      await apiClient.deletePolicy(selectedPolicyId)
      toast.success("Policy deleted successfully")

      // Reload policies
      await loadPolicies()

      // Select first policy if available
      if (policies.length > 1) {
        const remaining = policies.filter(p => p.id !== selectedPolicyId)
        if (remaining.length > 0) {
          selectPolicy(remaining[0])
        } else {
          setShowPolicyList(true)
          setSelectedPolicyId(null)
        }
      } else {
        setShowPolicyList(true)
        setSelectedPolicyId(null)
      }
    } catch (error: any) {
      console.error('Failed to delete policy:', error)
      toast.error(`Failed to delete policy: ${error.message}`)
    }
  }

  const duplicatePolicy = async (policyId: string) => {
    try {
      // Load the source policy from backend
      const sourcePolicy = await apiClient.getPolicy(policyId)
      
      // Create duplicate with new ID and name
      const duplicatedPolicy: BackendPolicy = {
        ...sourcePolicy,
        id: `pol-${Date.now()}`,
        name: `${sourcePolicy.name} (Copy)`,
        enabled: false,
      }

      await apiClient.createPolicy(duplicatedPolicy)
      toast.success("Policy duplicated successfully")

      // Reload policies
      await loadPolicies()
    } catch (error: any) {
      console.error('Failed to duplicate policy:', error)
      toast.error(`Failed to duplicate policy: ${error.message}`)
    }
  }

  // Policy list view
  if (showPolicyList || !selectedPolicyId) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">All Policies</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{policies.length} policies configured</p>
          </div>
          <Button onClick={createNewPolicy} className="gap-2 bg-[#c8e972] hover:bg-[#b8d962] text-black font-medium h-9 text-sm">
            <Plus className="h-4 w-4" />
            New policy
          </Button>
        </div>

        {isLoadingPolicies ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading policies...</p>
            </div>
          </div>
        ) : policies.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No policies yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Create your first policy to get started</p>
            <Button onClick={createNewPolicy} className="gap-2 bg-[#c8e972] hover:bg-[#b8d962] text-black font-medium">
              <Plus className="h-4 w-4" />
              Create your first policy
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
          {policies.map(policy => {
            const StatusIcon = statusIcons[policy.status]
            return (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  className="bg-card border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => selectPolicy(policy)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      policy.status === "active" ? "bg-green-100 dark:bg-green-900/30" :
                      policy.status === "draft" ? "bg-amber-100 dark:bg-amber-900/30" :
                      "bg-muted"
                    )}>
                      <StatusIcon className={cn(
                        "h-5 w-5",
                        policy.status === "active" ? "text-green-600 dark:text-green-400" :
                        policy.status === "draft" ? "text-amber-600 dark:text-amber-400" :
                        "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-foreground">{policy.name}</h3>
                        <Badge variant="outline" className={cn("text-xs capitalize", statusColors[policy.status])}>
                          {policy.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          ChatGPT
                        </Badge>
                      </div>
                      {policy.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{policy.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">Modified {policy.lastModified}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicatePolicy(policy.id)
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
          </div>
        )}
      </div>
    )
  }

  // Policy editor view
  return (
    <div className="flex h-full min-h-[calc(100vh-200px)]">
      {/* Main canvas */}
      <div className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground h-8 text-xs"
              onClick={() => setShowPolicyList(true)}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All policies
            </Button>
            <div className="w-px h-5 bg-border" />
            <Input
              value={policyName}
              onChange={e => setPolicyName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none shadow-none px-0 h-auto focus-visible:ring-0 w-[280px]"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={() => savePolicy(false)} 
              disabled={isSaving}
              className="bg-[#c8e972] hover:bg-[#b8d962] text-black font-medium h-9 text-sm"
            >
              {isSaving ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save policy"
              )}
            </Button>
          </div>
        </div>

        {/* Apply to / LLM scope bar */}
        <div className="flex items-center gap-6 px-6 py-3 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-muted-foreground">Apply to:</span>
            <Select value={transactionType} onValueChange={(v: "a2m" | "a2a" | "both") => setTransactionType(v)}>
              <SelectTrigger className="w-[180px] h-8 text-sm border-border bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a2m">
                  <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Agent to Merchant</span>
                </SelectItem>
                <SelectItem value="a2a">
                  <span className="flex items-center gap-1.5"><Bot className="h-3.5 w-3.5" /> Agent to Agent</span>
                </SelectItem>
                <SelectItem value="both">
                  <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> A2M + A2A</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-px h-5 bg-border" />

          <div className="flex items-center gap-2.5">
            <span className="text-sm text-muted-foreground">LLM scope:</span>
            <Select value={llmScope} onValueChange={(v: "all" | "specific") => setLlmScope(v)}>
              <SelectTrigger className="w-[160px] h-8 text-sm border-border bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LLMs</SelectItem>
                <SelectItem value="specific">Specific LLMs</SelectItem>
              </SelectContent>
            </Select>

            {llmScope === "specific" && (
              <div className="flex items-center gap-1.5">
                {selectedLLMs.includes("chatgpt") && (
                  <Badge className="bg-foreground text-background hover:bg-foreground/90 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    ChatGPT
                  </Badge>
                )}
                {selectedLLMs.includes("anthropic") ? (
                  <Badge className="bg-foreground text-background hover:bg-foreground/90 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Anthropic
                  </Badge>
                ) : (
                  <button
                    onClick={() => {}}
                    className="text-xs text-muted-foreground border border-dashed border-border rounded-full px-2.5 py-0.5 hover:border-foreground/30 transition-colors cursor-not-allowed opacity-50"
                    title="Coming soon"
                  >
                    + Anthropic
                  </button>
                )}
                {selectedLLMs.includes("perplexity") ? (
                  <Badge className="bg-foreground text-background hover:bg-foreground/90 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Perplexity
                  </Badge>
                ) : (
                  <button
                    onClick={() => {}}
                    className="text-xs text-muted-foreground border border-dashed border-border rounded-full px-2.5 py-0.5 hover:border-foreground/30 transition-colors cursor-not-allowed opacity-50"
                    title="Coming soon"
                  >
                    + Perplexity
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-0 px-6 border-b border-border/50">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.key && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6 max-w-3xl">
          <AnimatePresence mode="wait">
            {/* DEFINE TAB */}
            {activeTab === "define" && (
              <motion.div
                key="define"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Policy statement */}
                <section>
                  <Label className="text-sm font-semibold text-foreground mb-1.5 block">Policy statement (natural language)</Label>
                  <p className="text-xs text-muted-foreground mb-3">Describe the procurement policy in plain English. The system will extract structured constraints below.</p>
                  <textarea
                    value={policyStatement}
                    onChange={e => setPolicyStatement(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
                  />
                </section>

                {/* Auto-extracted fields */}
                <div className="border border-dashed border-border/60 rounded-lg p-5 bg-muted/10 space-y-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    <Zap className="h-3.5 w-3.5" />
                    Auto-extracted structured fields
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Intent</Label>
                      <Input value={intent} onChange={e => setIntent(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Scope</Label>
                      <Input value={scope} onChange={e => setScope(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                  </div>
                </div>

                {/* Hard constraints */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Lock className="h-4 w-4 text-red-500" />
                        Hard constraints
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Non-negotiable rules that must always be enforced</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs bg-transparent" onClick={addHardConstraint}>
                      <Plus className="h-3.5 w-3.5" /> Add rule
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {hardConstraints.map(constraint => (
                      <div key={constraint.id} className="flex items-center gap-2 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        <Input
                          value={constraint.rule}
                          onChange={e => setHardConstraints(prev => prev.map(c => c.id === constraint.id ? { ...c, rule: e.target.value } : c))}
                          className="flex-1 h-9 text-sm"
                          placeholder="e.g. Max single transaction: $1,000"
                        />
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={() => removeHardConstraint(constraint.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Soft constraints */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Eye className="h-4 w-4 text-amber-500" />
                        Soft constraints
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Guidelines the model can interpret with context</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs bg-transparent" onClick={addSoftConstraint}>
                      <Plus className="h-3.5 w-3.5" /> Add guideline
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {softConstraints.map(constraint => (
                      <div key={constraint.id} className="flex items-center gap-2 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        <Input
                          value={constraint.guideline}
                          onChange={e => setSoftConstraints(prev => prev.map(c => c.id === constraint.id ? { ...c, guideline: e.target.value } : c))}
                          className="flex-1 h-9 text-sm"
                          placeholder="e.g. Prefer vendors with negotiated contract pricing"
                        />
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={() => removeSoftConstraint(constraint.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {/* ENFORCEMENT TAB */}
            {activeTab === "enforcement" && (
              <motion.div
                key="enforcement"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Decision outcomes */}
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Decision outcomes</h3>
                  <p className="text-xs text-muted-foreground mb-4">Define what the agent should do based on the procurement evaluation.</p>
                  <div className="space-y-3">
                    {decisionOutcomes.map(outcome => (
                      <Card key={outcome.id} className="bg-card border-border shadow-sm">
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            outcome.action === "auto-approve" ? "bg-green-100 dark:bg-green-900/30" :
                            outcome.action === "approve-with-justification" ? "bg-blue-100 dark:bg-blue-900/30" :
                            outcome.action === "ask-approval" ? "bg-amber-100 dark:bg-amber-900/30" :
                            "bg-red-100 dark:bg-red-900/30"
                          )}>
                            <outcome.icon className={cn("h-4 w-4", outcome.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium", outcome.color)}>{outcome.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">When: {outcome.conditions}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                {/* Approver routing */}
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Approver routing
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Who gets notified when procurement approval is needed.</p>
                  <div className="space-y-2">
                    {approverRoutes.map(route => (
                      <div key={route.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-background">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">{route.condition}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                        <Badge variant="secondary" className="text-xs font-medium">{route.approver}</Badge>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Evidence requirements */}
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Evidence requirements
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">What documentation or proof is required for each procurement category.</p>
                  <div className="space-y-2">
                    {evidenceRequirements.map(req => (
                      <div key={req.id} className="flex items-start gap-3 px-4 py-3 rounded-lg border border-border bg-background">
                        <Badge variant="outline" className="text-xs mt-0.5 flex-shrink-0">{req.category}</Badge>
                        <p className="text-sm text-muted-foreground">{req.requirements}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right sidebar: Simulation panel */}
      <div className="w-[340px] border-l border-border bg-muted/20 flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Play className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Policy Preview & Simulation</span>
          </div>
          {selectedPolicyId && (
            <p className="text-xs text-muted-foreground">Testing against: <span className="font-medium text-foreground">{policyName}</span></p>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-5">
          {/* Scenario input */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Test a scenario</Label>
            <textarea
              value={simulationInput}
              onChange={e => {
                setSimulationInput(e.target.value)
                setSimulationResult(null) // Clear previous results
              }}
              rows={3}
              placeholder={'"Purchase 15 Dell Latitude laptops at $1,200 each for new engineering hires. PO-2026-00847, cost center ENG-4200."'}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed placeholder:text-muted-foreground/50"
            />
            <Button
              onClick={runSimulation}
              disabled={!simulationInput.trim() || isSimulating}
              className="w-full mt-2 gap-2 bg-[#c8e972] hover:bg-[#b8d962] text-black font-medium h-9 text-sm"
            >
              {isSimulating ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Run simulation
                </>
              )}
            </Button>
          </div>

          {/* Simulation result */}
          <AnimatePresence>
            {simulationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Decision */}
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Engine output</div>
                  <div className={cn("text-base font-semibold mb-1", simulationResult.decisionColor)}>
                    {simulationResult.decision}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{simulationResult.reason}</p>
                  {simulationResult.suggestedAlternative && (
                    <div className="mt-3 p-2.5 rounded-md bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        <span className="font-medium">Suggested alternative:</span> {simulationResult.suggestedAlternative}
                      </p>
                    </div>
                  )}
                </div>

                {/* Evidence */}
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Evidence attached</div>
                  <div className="space-y-1.5">
                    {simulationResult.evidenceAttached.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit trace */}
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Audit trace</div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Rules triggered</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {simulationResult.rulesTriggered.length > 0 ? (
                          simulationResult.rulesTriggered.map(rule => (
                            <Badge key={rule} variant="secondary" className="text-xs font-mono">{rule}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Risk score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full", 
                              simulationResult.riskScore < 0.3 ? "bg-green-500" :
                              simulationResult.riskScore < 0.6 ? "bg-amber-500" :
                              "bg-red-500"
                            )} 
                            style={{ width: `${simulationResult.riskScore * 100}%` }} 
                          />
                        </div>
                        <span className={cn("text-xs font-medium",
                          simulationResult.riskScore < 0.3 ? "text-green-600" :
                          simulationResult.riskScore < 0.6 ? "text-amber-600" :
                          "text-red-600"
                        )}>
                          {simulationResult.riskScore.toFixed(2)} ({simulationResult.riskScore < 0.3 ? 'low' : simulationResult.riskScore < 0.6 ? 'medium' : 'high'})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Model confidence</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${simulationResult.confidence * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium text-foreground">{(simulationResult.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!simulationResult && !isSimulating && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Play className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Paste a procurement scenario above to see how this policy would respond</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Results include decision, reasoning, evidence, and audit trace</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
