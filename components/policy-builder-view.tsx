"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  ArrowDown,
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Trash2,
  Copy,
  RotateCcw,
  RotateCw,
  Play,
  Settings,
  History,
  Wallet,
  Bot,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"
import {
  frontendToBackendPolicy,
  backendToFrontendPolicy,
  type FrontendPolicy,
  type Condition,
  type PolicyRule,
} from "@/lib/policy-mapper"
import { toast } from "sonner"

// Types are imported from policy-mapper

const fieldOptions = [
  { value: "amount", label: "Amount" },
  { value: "merchant_category", label: "Merchant Category" },
  { value: "merchant_name", label: "Merchant Name" },
  { value: "agent_name", label: "Agent Name" },
  { value: "agent_type", label: "Agent Type" },
  { value: "time_of_day", label: "Time of Day" },
  { value: "day_of_week", label: "Day of Week" },
  { value: "frequency", label: "Transaction Frequency" },
  { value: "recipient_agent", label: "Recipient Agent" },
  { value: "purpose", label: "Transaction Purpose" },
]

const operatorOptions = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "greater_than", label: "is greater than" },
  { value: "greater_than_or_equal", label: "is greater than or equal to" },
  { value: "less_than", label: "is less than" },
  { value: "less_than_or_equal", label: "is less than or equal to" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with", label: "starts with" },
  { value: "in_list", label: "is in list" },
]

const llmOptions = [
  { value: "chatgpt", label: "ChatGPT" },
  // Other agents disabled for now - only ChatGPT is supported
  // { value: "claude", label: "Claude" },
  // { value: "gemini", label: "Gemini" },
  // { value: "llama", label: "Llama" },
  // { value: "mistral", label: "Mistral" },
  // { value: "cohere", label: "Cohere" },
  // { value: "custom", label: "Custom Agents" },
]

const outcomeOptions = [
  { value: "approve", label: "Approve transaction", icon: CheckCircle2, color: "text-green-600" },
  { value: "deny", label: "Decline transaction", icon: XCircle, color: "text-red-600" },
  { value: "flag_review", label: "Flag for review", icon: AlertTriangle, color: "text-amber-600" },
  { value: "require_approval", label: "Ask for approval", icon: ShieldCheck, color: "text-blue-600" },
]

export function PolicyBuilderView() {
  const [activeTab, setActiveTab] = useState<"build" | "history" | "settings">("build")
  const [policy, setPolicy] = useState<FrontendPolicy>({
    id: `policy-${Date.now()}`,
    name: "New Policy",
    transactionType: "agent-to-merchant",
    llmScope: "specific",
    selectedLLMs: ["chatgpt"],
    trigger: "transaction_occurs",
    rules: [
      {
        id: "rule-1",
        conditions: [
          { id: "cond-1", field: "amount", operator: "less_than_or_equal", value: "500" },
        ],
        logicOperator: "AND",
      },
    ],
    fallbackAction: "require_approval",
    outcomeAction: "approve",
    isActive: true,
  })
  const [editingCondition, setEditingCondition] = useState<string | null>(null)
  const [showAddStep, setShowAddStep] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [policies, setPolicies] = useState<FrontendPolicy[]>([])
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)
  const [complianceStats, setComplianceStats] = useState<{
    totalSpend: number;
    inPolicySpend: number;
    outOfPolicySpend: number;
    compliancePercentage: number;
    totalTransactions: number;
    approvedTransactions: number;
    deniedTransactions: number;
    pendingApprovals: number;
    trend: number;
  } | null>(null)

  const addCondition = (ruleId: string) => {
    setPolicy((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              conditions: [
                ...rule.conditions,
                { id: `cond-${Date.now()}`, field: "amount", operator: "less_than_or_equal", value: "500" },
              ],
            }
          : rule
      ),
    }))
  }

  const removeCondition = (ruleId: string, conditionId: string) => {
    setPolicy((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, conditions: rule.conditions.filter((c) => c.id !== conditionId) }
          : rule
      ),
    }))
  }

  const updateCondition = (ruleId: string, conditionId: string, updates: Partial<Condition>) => {
    setPolicy((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              conditions: rule.conditions.map((c) =>
                c.id === conditionId ? { ...c, ...updates } : c
              ),
            }
          : rule
      ),
    }))
  }

  const addRule = () => {
    setPolicy((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          id: `rule-${Date.now()}`,
          conditions: [{ id: `cond-${Date.now()}`, field: "amount", operator: "less_than_or_equal", value: "500" }],
          logicOperator: "AND",
        },
      ],
    }))
    setShowAddStep(null)
  }

  const removeRule = (ruleId: string) => {
    if (policy.rules.length <= 1) {
      toast.error("Cannot remove the last rule. Policies must have at least one rule.")
      return
    }
    setPolicy((prev) => ({
      ...prev,
      rules: prev.rules.filter((r) => r.id !== ruleId),
    }))
  }

  // Load policies from backend
  useEffect(() => {
    loadPolicies()
    loadComplianceStats()
  }, [])

  const loadComplianceStats = async () => {
    try {
      const stats = await apiClient.getPolicyCompliance()
      setComplianceStats(stats)
    } catch (error) {
      console.error('Failed to load compliance stats:', error)
    }
  }

  const loadPolicies = async () => {
    setLoading(true)
    try {
      const backendPolicies = await apiClient.getPolicies()
      const frontendPolicies = backendPolicies.map(backendToFrontendPolicy)
      setPolicies(frontendPolicies)
      
      // If there are policies and none selected, select the first one
      if (frontendPolicies.length > 0 && !selectedPolicyId) {
        setSelectedPolicyId(frontendPolicies[0].id)
        setPolicy(frontendPolicies[0])
      }
    } catch (error: any) {
      console.error('Failed to load policies:', error)
      toast.error(`Failed to load policies: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePolicy = async () => {
    // Validate policy before saving
    if (!policy.name || policy.name.trim() === '') {
      toast.error('Please enter a policy name before saving')
      return
    }

    if (policy.rules.length === 0) {
      toast.error('Policy must have at least one rule')
      return
    }

    // Validate that all rules have at least one condition
    for (const rule of policy.rules) {
      if (rule.conditions.length === 0) {
        toast.error('Each rule must have at least one condition')
        return
      }
      // Validate condition values (amount must be numeric, merchant/category can be text)
      for (const condition of rule.conditions) {
        if (condition.field === 'amount') {
          if (!condition.value || condition.value.trim() === '' || isNaN(parseFloat(condition.value))) {
            toast.error('Amount conditions must have a valid number')
            return
          }
        } else if (condition.field === 'merchant_name' || condition.field === 'merchant_category') {
          if (!condition.value || condition.value.trim() === '') {
            toast.error('Merchant and category conditions must have a value')
            return
          }
        } else if (!condition.value || condition.value.trim() === '') {
          toast.error('All condition values must be filled in')
          return
        }
      }
    }

    setSaving(true)
    try {
      const backendPolicy = frontendToBackendPolicy(policy)
      
      // Check if policy exists (update) or is new (create)
      const existing = policies.find(p => p.id === policy.id)
      
      if (existing) {
        await apiClient.updatePolicy(backendPolicy)
        toast.success(`Policy "${policy.name}" updated successfully`)
      } else {
        const created = await apiClient.createPolicy(backendPolicy)
        toast.success(`Policy "${policy.name}" created successfully`)
        // Update the policy ID to the one returned from backend
        setPolicy((prev) => ({ ...prev, id: created.id }))
      }
      
      // Reload policies
      await loadPolicies()
      // Set selected policy ID so UI shows we're editing
      const updatedPolicies = await apiClient.getPolicies()
      const frontendPolicies = updatedPolicies.map(backendToFrontendPolicy)
      const savedPolicy = frontendPolicies.find(p => p.id === policy.id || p.name === policy.name)
      if (savedPolicy) {
        setSelectedPolicyId(savedPolicy.id)
        setPolicy(savedPolicy)
      }
    } catch (error: any) {
      console.error('Failed to save policy:', error)
      toast.error(`Failed to save policy: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePolicy = async () => {
    if (!confirm(`Are you sure you want to delete "${policy.name}"?`)) {
      return
    }
    
    try {
      await apiClient.deletePolicy(policy.id)
      toast.success('Policy deleted successfully')
      
      // Reload policies and select first one or create new
      await loadPolicies()
      if (policies.length > 1) {
        const remaining = policies.filter(p => p.id !== policy.id)
        if (remaining.length > 0) {
          setSelectedPolicyId(remaining[0].id)
          setPolicy(remaining[0])
        }
      } else {
        // Create a new empty policy
        setPolicy({
          id: `policy-${Date.now()}`,
          name: "New Policy",
          transactionType: "agent-to-merchant",
          llmScope: "specific",
          selectedLLMs: ["chatgpt"],
          trigger: "transaction_occurs",
          rules: [
            {
              id: "rule-1",
              conditions: [
                { id: "cond-1", field: "amount", operator: "less_than_or_equal", value: "500" },
              ],
              logicOperator: "AND",
            },
          ],
          fallbackAction: "require_approval",
          outcomeAction: "approve",
          isActive: true,
        })
        setSelectedPolicyId(null)
      }
    } catch (error: any) {
      console.error('Failed to delete policy:', error)
      toast.error(`Failed to delete policy: ${error.message}`)
    }
  }

  const handleNewPolicy = () => {
    setPolicy({
      id: `policy-${Date.now()}`,
      name: "New Policy",
      transactionType: "agent-to-merchant",
      llmScope: "specific",
      selectedLLMs: ["chatgpt"],
      trigger: "transaction_occurs",
      rules: [
        {
          id: "rule-1",
          conditions: [
            { id: "cond-1", field: "amount", operator: "less_than_or_equal", value: "500" },
          ],
          logicOperator: "AND",
        },
      ],
      fallbackAction: "require_approval",
      outcomeAction: "approve",
      isActive: true,
    })
    setSelectedPolicyId(null)
    toast.info('Creating new policy - enter a name and configure your rules')
  }

  const handleSelectPolicy = (policyId: string) => {
    if (!policyId) {
      // User selected "empty" option - create new policy
      handleNewPolicy()
      return
    }
    const selected = policies.find(p => p.id === policyId)
    if (selected) {
      setPolicy(selected)
      setSelectedPolicyId(policyId)
      toast.success(`Loaded policy: ${selected.name}`)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Main Canvas */}
      <div className="flex-1 overflow-auto min-w-0">
        {/* Breadcrumb Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border/50 bg-muted/20">
          {/* Left Section - Breadcrumb and Policy Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 text-sm shrink-0">
              <span className="text-muted-foreground hidden md:inline">Expense approvals</span>
              <span className="text-muted-foreground hidden md:inline">{" > "}</span>
            </div>
            {selectedPolicyId ? (
              <>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                  <Settings className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Editing</span>
                  <span className="sm:hidden">Edit</span>
                </Badge>
                <Select value={selectedPolicyId || ""} onValueChange={handleSelectPolicy}>
                  <SelectTrigger className="w-[140px] sm:w-[160px] md:w-[180px] font-medium shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {!p.isActive && "(Inactive)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-muted-foreground hidden xl:inline shrink-0">{" / "}</div>
                <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[280px]">
                  <label className="text-sm font-medium text-foreground whitespace-nowrap shrink-0 hidden md:inline">Name:</label>
                  <Input
                    value={policy.name}
                    onChange={(e) => setPolicy((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Policy name..."
                    className="font-medium text-sm sm:text-base min-w-0 flex-1 border-border focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </>
            ) : (
              <>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shrink-0">
                  <Plus className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">New Policy</span>
                  <span className="sm:hidden">New</span>
                </Badge>
                <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[280px]">
                  <label className="text-sm font-medium text-foreground whitespace-nowrap shrink-0 hidden md:inline">Policy name:</label>
                  <Input
                    value={policy.name}
                    onChange={(e) => setPolicy((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter policy name..."
                    className="font-medium text-sm sm:text-base min-w-0 flex-1 border-border focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </>
            )}
          </div>
          {/* Right Section - Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedPolicyId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewPolicy}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Policy</span>
              </Button>
            )}
            {!selectedPolicyId && (
              <Select value={selectedPolicyId || ""} onValueChange={handleSelectPolicy}>
                <SelectTrigger className="w-[140px] sm:w-[180px] shrink-0">
                  <SelectValue placeholder="Select existing policy..." />
                </SelectTrigger>
                <SelectContent>
                  {policies.length > 0 ? (
                    policies.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {!p.isActive && "(Inactive)"}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No policies yet</div>
                  )}
                </SelectContent>
              </Select>
            )}
            <Button
              className="bg-[#c8e972] hover:bg-[#b8d962] text-black font-medium shadow-sm shrink-0 whitespace-nowrap"
              onClick={handleSavePolicy}
              disabled={saving || !policy.name.trim()}
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : selectedPolicyId ? (
                <>
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create Policy</span>
                  <span className="sm:hidden">Create</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Transaction Type & LLM Scope Selector */}
        <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-muted/20">
          <div className="flex flex-wrap gap-4 sm:gap-6">
            {/* Transaction Type */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Apply to:</span>
              <Select
                value={policy.transactionType}
                onValueChange={(value: "agent-to-merchant" | "agent-to-agent" | "all") =>
                  setPolicy((prev) => ({ ...prev, transactionType: value }))
                }
              >
                <SelectTrigger className="w-[200px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      All Transactions
                    </div>
                  </SelectItem>
                  <SelectItem value="agent-to-merchant">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Agent to Merchant
                    </div>
                  </SelectItem>
                  <SelectItem value="agent-to-agent">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Agent to Agent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* LLM Scope */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">LLM scope:</span>
              <Select
                value={policy.llmScope}
                onValueChange={(value: "all" | "specific") =>
                  setPolicy((prev) => ({ 
                    ...prev, 
                    llmScope: value, 
                    selectedLLMs: value === "all" ? [] : (prev.selectedLLMs.length > 0 ? prev.selectedLLMs : ["chatgpt"])
                  }))
                }
              >
                <SelectTrigger className="w-[160px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All LLMs</SelectItem>
                  <SelectItem value="specific">Specific LLMs</SelectItem>
                </SelectContent>
              </Select>

              {policy.llmScope === "specific" && (
                <div className="flex flex-wrap gap-2">
                  {llmOptions.map((llm) => (
                    <button
                      key={llm.value}
                      onClick={() => {
                        setPolicy((prev) => ({
                          ...prev,
                          selectedLLMs: prev.selectedLLMs.includes(llm.value)
                            ? prev.selectedLLMs.filter((l) => l !== llm.value)
                            : [...prev.selectedLLMs, llm.value],
                        }))
                      }}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                        policy.selectedLLMs.includes(llm.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {llm.label}
                    </button>
                  ))}
                  {policy.selectedLLMs.length === 0 && (
                    <span className="text-xs text-muted-foreground px-2 py-1">Select at least one LLM</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Canvas */}
        <div className="p-4 sm:p-6 lg:p-8 min-h-[600px]">
          <div className="max-w-2xl mx-auto space-y-0">
            {/* Trigger Node */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="flex items-center gap-3 px-5 py-4 bg-background border border-border rounded-lg shadow-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                  <Wallet className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium">When transaction occurs</span>
                <div className="ml-auto flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Trigger
                  </Badge>
                </div>
              </div>
            </motion.div>

            {/* Connector Arrow */}
            <div className="flex justify-center py-2">
              <div className="flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Condition Rules */}
            {policy.rules.map((rule, ruleIndex) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ruleIndex * 0.1 }}
              >
                <div className="border border-border rounded-lg bg-background shadow-sm overflow-hidden">
                  {/* Conditions */}
                  <div className="p-5 space-y-4">
                    {rule.conditions.map((condition, condIndex) => (
                      <div key={condition.id}>
                        {condIndex > 0 && (
                          <div className="flex items-center gap-2 py-2">
                            <div className="flex-1 h-px bg-border" />
                            <button
                              onClick={() =>
                                setPolicy((prev) => ({
                                  ...prev,
                                  rules: prev.rules.map((r) =>
                                    r.id === rule.id
                                      ? { ...r, logicOperator: r.logicOperator === "AND" ? "OR" : "AND" }
                                      : r
                                  ),
                                }))
                              }
                              className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted rounded-full"
                            >
                              {rule.logicOperator}
                            </button>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <span className="text-sm font-medium text-muted-foreground pt-2 w-6">
                            {condIndex === 0 ? "If" : ""}
                          </span>

                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <Select
                                value={condition.field}
                                onValueChange={(value) =>
                                  updateCondition(rule.id, condition.id, { field: value })
                                }
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select
                                value={condition.operator}
                                onValueChange={(value) =>
                                  updateCondition(rule.id, condition.id, { operator: value })
                                }
                              >
                                <SelectTrigger className="w-[220px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {operatorOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center gap-2">
                              <Input
                                value={condition.value}
                                onChange={(e) =>
                                  updateCondition(rule.id, condition.id, { value: e.target.value })
                                }
                                placeholder="Enter value..."
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                onClick={() => removeCondition(rule.id, condition.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Condition & Actions */}
                  <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCondition(rule.id)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add condition
                    </Button>
                    {policy.rules.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRule(rule.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove rule
                      </Button>
                    )}
                  </div>
                </div>

                {/* Add Step Button */}
                <div className="flex justify-center py-2">
                  <div className="flex flex-col items-center">
                    <div className="w-px h-2 bg-border" />
                    <button
                      onClick={addRule}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add step
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <div className="w-px h-2 bg-border" />
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Fallback Node */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Select
                value={policy.fallbackAction}
                onValueChange={(value) => setPolicy((prev) => ({ ...prev, fallbackAction: value }))}
              >
                <SelectTrigger className="w-full border border-border bg-background shadow-sm">
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100">
                      <ShieldCheck className="h-4 w-4 text-slate-600" />
                    </div>
                    <span className="font-medium">
                      If no conditions are met: {outcomeOptions.find((o) => o.value === policy.fallbackAction)?.label || "Select action"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {outcomeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className={cn("h-4 w-4", option.color)} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Add Step under fallback */}
              <div className="flex justify-center py-2">
                <div className="flex flex-col items-center">
                  <div className="w-px h-2 bg-border" />
                  <button 
                    onClick={addRule}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add step
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <div className="w-px h-2 bg-border" />
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </motion.div>

            {/* Outcome Node */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Select
                value={policy.outcomeAction}
                onValueChange={(value) => setPolicy((prev) => ({ ...prev, outcomeAction: value }))}
              >
                <SelectTrigger className="w-full border-2 border-[#c8e972] bg-[#f8fce8] shadow-sm">
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium text-green-700">
                      {outcomeOptions.find((o) => o.value === policy.outcomeAction)?.label || "Select outcome"}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Outcome
                      </Badge>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {outcomeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className={cn("h-4 w-4", option.color)} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block w-80 border-l border-border bg-muted/20 shrink-0">
        {/* Tabs */}
        <div className="flex items-center border-b border-border">
          <div className="flex items-center gap-2 px-4 py-3">
            <button className="p-1.5 hover:bg-muted rounded">
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="p-1.5 hover:bg-muted rounded">
              <RotateCw className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 flex">
            {(["build", "history", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-3 text-sm font-medium capitalize transition-colors",
                  activeTab === tab
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "build" ? "Build" : tab === "history" ? "History" : "Settings"}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="p-4 space-y-6">
          {activeTab === "build" && (
            <>
              {/* Policy Compliance Card */}
              {complianceStats && (
                <div className="mb-6">
                  <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">In policy spend</h3>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs font-medium",
                            complianceStats.trend >= 0 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : "bg-red-50 text-red-700 border-red-200"
                          )}
                        >
                          {complianceStats.trend >= 0 ? '+' : ''}{complianceStats.trend}%
                        </Badge>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-4xl font-bold mb-2">
                          {Math.round(complianceStats.compliancePercentage)}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          of all spend is within policy
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-4">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                          style={{ width: `${complianceStats.compliancePercentage}%` }}
                        />
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2 bg-background rounded border border-border/50">
                          <div className="text-muted-foreground mb-1">Total Spend</div>
                          <div className="font-semibold">${complianceStats.totalSpend.toFixed(2)}</div>
                        </div>
                        <div className="p-2 bg-background rounded border border-border/50">
                          <div className="text-muted-foreground mb-1">Transactions</div>
                          <div className="font-semibold">{complianceStats.totalTransactions}</div>
                        </div>
                        <div className="p-2 bg-background rounded border border-border/50">
                          <div className="text-muted-foreground mb-1">Approved</div>
                          <div className="font-semibold text-green-600">{complianceStats.approvedTransactions}</div>
                        </div>
                        <div className="p-2 bg-background rounded border border-border/50">
                          <div className="text-muted-foreground mb-1">Denied</div>
                          <div className="font-semibold text-red-600">{complianceStats.deniedTransactions}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3">Test workflow</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-background">
                    <p className="text-sm text-muted-foreground mb-3">
                      Test this policy with a sample purchase
                    </p>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={async () => {
                        try {
                          const testRequest = {
                            user_id: "test-user-123",
                            product_id: "test-product-1",
                            price: parseFloat(policy.rules[0]?.conditions[0]?.value || "100"),
                            merchant: "Test Merchant",
                            category: "Test Category",
                          }
                          const result = await apiClient.checkPolicy(testRequest)
                          toast.success(
                            result.allowed
                              ? "✅ Purchase would be ALLOWED"
                              : `❌ Purchase would be DENIED: ${result.reason}`,
                            { duration: 5000 }
                          )
                        } catch (error: any) {
                          toast.error(`Test failed: ${error.message}`)
                        }
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Test with sample purchase
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Quick actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 bg-transparent"
                    onClick={handleNewPolicy}
                  >
                    <Plus className="h-4 w-4" />
                    New workflow
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 bg-transparent"
                    onClick={() => {
                      const duplicated = { ...policy, id: `policy-${Date.now()}`, name: `${policy.name} (Copy)` }
                      setPolicy(duplicated)
                      setSelectedPolicyId(null)
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate workflow
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive bg-transparent"
                    onClick={handleDeletePolicy}
                    disabled={!selectedPolicyId}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete workflow
                  </Button>
                </div>
              </div>
            </>
          )}

          {activeTab === "history" && (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No history yet</p>
              <p className="text-xs mt-1">Changes to this workflow will appear here</p>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Policy name</label>
                <Input
                  value={policy.name}
                  onChange={(e) => setPolicy((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter a descriptive name for this policy..."
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Give your policy a clear, descriptive name to easily identify it later.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active</span>
                <button
                  onClick={() => setPolicy((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    policy.isActive ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                      policy.isActive && "translate-x-5"
                    )}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
