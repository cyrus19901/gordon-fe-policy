"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  ArrowRight,
  ExternalLink,
  GitBranch,
  FileText,
  Shield,
  Receipt,
  CreditCard,
  Users,
  AlertTriangle,
  Settings,
  ChevronRight,
  Play,
  BookOpen,
  Video,
  X,
  Plus,
  MoreVertical,
  ChevronDown,
  Check,
  Trash2,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Loader2,
} from "lucide-react"
import SpendBreakdownSection from "@/components/spend-breakdown-section"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface PolicyHomeViewProps {
  onNavigate?: (section: string) => void
}

interface ApprovalPolicy {
  id: string
  name: string
  isDefault: boolean
  allocations: number
  programs: number
  members: { id: string; name: string; email: string; role: string }[]
}

interface ApprovedMember {
  id: string
  name: string
  email: string
  role: string
}

export function PolicyHomeView({ onNavigate }: PolicyHomeViewProps) {
  const [reviewerFilter, setReviewerFilter] = useState("all")
  const [showExpenseApprovals, setShowExpenseApprovals] = useState(false)
  const [agentSuggestionMode, setAgentSuggestionMode] = useState<"live" | "testing">("live")
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("reviewer")
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false)
  const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set())
  
  const [approvalPolicies, setApprovalPolicies] = useState<ApprovalPolicy[]>([
    {
      id: "1",
      name: "Require Manager Review / Default Approval Policy",
      isDefault: true,
      allocations: 63,
      programs: 2,
      members: [],
    },
  ])

  // Fetch reviewers from API
  useEffect(() => {
    const loadReviewers = async () => {
      try {
        const reviewers = await apiClient.getReviewers()
        setApprovalPolicies(prev => prev.map(policy => ({
          ...policy,
          members: reviewers.map(r => ({
            id: r.id,
            name: r.name || r.email.split('@')[0],
            email: r.email,
            role: r.role === 'admin' ? 'Admin' : r.role === 'manager' ? 'Manager' : 'Reviewer',
          })),
        })))
      } catch (error) {
        console.error('Failed to load reviewers:', error)
      }
    }
    loadReviewers()
  }, [])

  const handleAddMember = async () => {
    if (!newMemberEmail) return
    
    try {
      // First, check if user exists or create them
      const users = await apiClient.getUsers()
      let userId = users.find(u => u.email === newMemberEmail)?.id
      
      if (!userId) {
        // User doesn't exist - would need a create user endpoint
        console.error('User not found. Please create user first.')
        return
      }
      
      await apiClient.addReviewer(userId, newMemberRole)
      
      const newMember: ApprovedMember = {
        id: userId,
        name: newMemberEmail.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        email: newMemberEmail,
        role: newMemberRole === "admin" ? "Admin" : newMemberRole === "manager" ? "Manager" : "Reviewer",
      }
      
      setApprovalPolicies(prev => prev.map(policy => ({
        ...policy,
        members: [...policy.members, newMember],
      })))
      
      setNewMemberEmail("")
      setNewMemberRole("reviewer")
      setShowAddMember(false)
    } catch (error) {
      console.error('Failed to add reviewer:', error)
    }
  }

  const handleRemoveMember = async (policyId: string, memberId: string) => {
    try {
      await apiClient.removeReviewer(memberId)
      setApprovalPolicies(prev => prev.map(policy => 
        policy.id === policyId 
        ? { ...policy, members: policy.members.filter(m => m.id !== memberId) }
        : policy
      ))
    } catch (error) {
      console.error('Failed to remove reviewer:', error)
    }
  }

  const policyData = {
    name: "Agent Spend Policy",
    effectiveDate: "January 15, 2026",
    inPolicySpend: 80,
    inPolicySpendChange: "+2.3%",
    activeAgents: 12,
    approvalAccuracy: 94,
    approvalAccuracyChange: "+1.5%",
  }

  const [showPendingApprovals, setShowPendingApprovals] = useState(false)

  // Load pending approvals from backend
  const loadPendingApprovals = async () => {
    setIsLoadingApprovals(true)
    try {
      const approvals = await apiClient.getPendingApprovals()
      setPendingApprovals(approvals)
    } catch (error: any) {
      console.error('Failed to load pending approvals:', error)
      toast.error(`Failed to load pending approvals: ${error.message}`)
    } finally {
      setIsLoadingApprovals(false)
    }
  }

  // Load on mount
  useEffect(() => {
    loadPendingApprovals()
  }, [])

  const handleControlClick = (controlId: string) => {
    if (controlId === "expense-approvals") {
      setShowExpenseApprovals(true)
    } else if (controlId === "pending-approvals") {
      setShowPendingApprovals(true)
      loadPendingApprovals() // Refresh approvals when opening
    } else {
      onNavigate?.(controlId)
    }
  }

  const handleApprove = async (purchaseId: number) => {
    setApprovingIds(prev => new Set(prev).add(purchaseId))
    try {
      await apiClient.approvePurchase(purchaseId)
      toast.success('Purchase approved successfully')
      // Remove from pending list
      setPendingApprovals(prev => prev.filter(p => p.id !== purchaseId))
    } catch (error: any) {
      console.error('Failed to approve purchase:', error)
      toast.error(`Failed to approve: ${error.message}`)
    } finally {
      setApprovingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(purchaseId)
        return newSet
      })
    }
  }

  const handleReject = async (purchaseId: number) => {
    setApprovingIds(prev => new Set(prev).add(purchaseId))
    try {
      await apiClient.rejectPurchase(purchaseId)
      toast.success('Purchase rejected')
      // Remove from pending list
      setPendingApprovals(prev => prev.filter(p => p.id !== purchaseId))
    } catch (error: any) {
      console.error('Failed to reject purchase:', error)
      toast.error(`Failed to reject: ${error.message}`)
    } finally {
      setApprovingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(purchaseId)
        return newSet
      })
    }
  }

  // Format timestamp relative to now
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  // Map backend approvals to UI format
  const pendingApprovalRequests = pendingApprovals.map((approval) => {
    const isA2A = approval.transactionType === 'agent-to-agent';
    const vendor = isA2A 
      ? (approval.recipientAgentId || 'Agent Service')
      : (approval.merchant || 'Unknown Merchant');
    const description = isA2A
      ? `${approval.serviceType || 'Service'} from ${vendor}`
      : (approval.productName || `Purchase from ${vendor}`);
    
    return {
      id: approval.id.toString(),
      requester: approval.category || approval.serviceType || "Agent",
      amount: approval.amount,
      vendor,
      category: approval.category || approval.serviceType || "General",
      submittedAt: formatTimestamp(approval.timestamp),
      urgency: approval.amount > 1000 ? "high" : approval.amount > 500 ? "medium" : "low",
      description,
    };
  })

  const spendControls = [
    {
      id: "pending-approvals",
      icon: Clock,
      title: "Pending approvals",
      description: "Review and action outstanding approval requests",
      badge: pendingApprovals.length,
      badgeColor: "bg-amber-500",
    },
    {
      id: "expense-approvals",
      icon: GitBranch,
      title: "Expense approvals",
      description: "Configure who can approve agent transactions and reimbursements",
    },
    {
      id: "merchant-catalogs",
      icon: FileText,
      title: "Allowed Merchant Catalogs",
      description: "Define approved merchants and vendor catalogs for agent transactions",
    },
    {
      id: "merchant-controls",
      icon: Shield,
      title: "Merchant controls",
      description: "Block or allow specific merchant categories",
    },
    {
      id: "agent-permissions",
      icon: Users,
      title: "Agent permissions",
      description: "Manage which agents can initiate transactions",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Agent Overview Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Agent overview</h2>
          <Select value={reviewerFilter} onValueChange={setReviewerFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Filter by reviewer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">On for all reviewers</SelectItem>
              <SelectItem value="admins">Admins only</SelectItem>
              <SelectItem value="managers">Managers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Three-card grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Policy Knowledge Card */}
          <Card className="bg-card border border-border shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Policy knowledge</span>
              </div>
              <div className="p-4">
                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-foreground mb-1">{policyData.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">Effective {policyData.effectiveDate}</p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">General Rules</p>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Purpose</p>
                      <p className="text-xs text-muted-foreground">
                        All agent transactions must advance business goals and comply with spending policies.
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-sm gap-2 px-0 hover:bg-transparent">
                  <ExternalLink className="h-4 w-4" />
                  Edit policy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Agents Card */}
          <Card className="bg-card border border-border shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active agents with spend permissions</span>
              </div>
              <div className="p-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-semibold text-foreground">{policyData.activeAgents}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">agents can initiate transactions</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <span>8 with full access</span>
                  <span>4 with limited access</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Policy Spend Card */}
          <Card className="bg-card border border-border shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">In policy spend</span>
                <Badge variant="outline" className="text-xs font-normal text-green-600 border-green-200 bg-green-50">
                  {policyData.inPolicySpendChange}
                </Badge>
              </div>
              <div className="p-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-semibold text-foreground">{policyData.inPolicySpend}%</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">of all spend is within policy</p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${policyData.inPolicySpend}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Spend Breakdown Section */}
      <SpendBreakdownSection />

      {/* Spend Management Controls */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Spend management controls</h2>
        <div className="space-y-2">
          {spendControls.map((control, index) => (
            <motion.div
              key={control.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card 
                className="bg-card border border-border shadow-sm hover:shadow-md hover:border-border/80 transition-all cursor-pointer group"
                onClick={() => handleControlClick(control.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-muted transition-colors relative">
                    <control.icon className="h-5 w-5 text-muted-foreground" />
                    {control.badge && (
                      <span className={`absolute -top-1 -right-1 w-5 h-5 ${control.badgeColor || 'bg-primary'} text-white text-xs font-medium rounded-full flex items-center justify-center`}>
                        {control.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{control.title}</h3>
                      {control.badge && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                          {control.badge} pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{control.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Documentation</h3>
                <p className="text-xs text-muted-foreground">Learn best practices</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Video className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">Video tutorials</h3>
                <p className="text-xs text-muted-foreground">Step-by-step guides</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">API settings</h3>
                <p className="text-xs text-muted-foreground">Configure integrations</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Expense Approvals Sidebar */}
      <Sheet open={showExpenseApprovals} onOpenChange={setShowExpenseApprovals}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-semibold">Expenses</SheetTitle>
            <p className="text-sm text-muted-foreground">Who should review expenses?</p>
          </SheetHeader>

          <div className="space-y-8">
            {/* Policies Section */}
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-4">Policies</h3>
              
              <div className="space-y-3">
                {approvalPolicies.map((policy) => (
                  <div key={policy.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground text-sm">{policy.name}</span>
                          {policy.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {policy.allocations} allocations of funds · {policy.programs} programs
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 bg-transparent">
                          Edit
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">Approved reviewers</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setShowAddMember(!showAddMember)}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Add member
                        </Button>
                      </div>

                      {/* Add Member Form */}
                      <AnimatePresence>
                        {showAddMember && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50"
                          >
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="member-email" className="text-xs">Email address</Label>
                                <Input
                                  id="member-email"
                                  type="email"
                                  placeholder="colleague@company.com"
                                  value={newMemberEmail}
                                  onChange={(e) => setNewMemberEmail(e.target.value)}
                                  className="mt-1 h-9"
                                />
                              </div>
                              <div>
                                <Label htmlFor="member-role" className="text-xs">Role</Label>
                                <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                                  <SelectTrigger className="mt-1 h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="reviewer">Reviewer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <Button size="sm" className="h-8" onClick={handleAddMember}>
                                  Add member
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => {
                                    setShowAddMember(false)
                                    setNewMemberEmail("")
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Members List */}
                      <div className="space-y-2">
                        {policy.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/30 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                {member.name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {member.role}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveMember(policy.id, member.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="mt-4 gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Add approval workflow
              </Button>
            </section>

            {/* Policy Agent Suggestions */}
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-2">Policy agent suggestions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For expenses the policy agent doesn't approve or reject, it will suggest an action based on your company's{" "}
                <span className="underline cursor-pointer">expense policy</span>.
              </p>

              <div className="space-y-2">
                <label
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                    agentSuggestionMode === "live"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-border/80"
                  }`}
                  onClick={() => setAgentSuggestionMode("live")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        agentSuggestionMode === "live"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {agentSuggestionMode === "live" && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="font-medium text-foreground">Live for all reviewers</span>
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">Recommended</span>
                </label>

                <label
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                    agentSuggestionMode === "testing"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-border/80"
                  }`}
                  onClick={() => setAgentSuggestionMode("testing")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        agentSuggestionMode === "testing"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {agentSuggestionMode === "testing" && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="font-medium text-foreground">Testing mode (admins only)</span>
                  </div>
                </label>
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {/* Pending Approvals Sheet */}
      <Sheet open={showPendingApprovals} onOpenChange={setShowPendingApprovals}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-semibold">Pending Approvals</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {pendingApprovalRequests.length} requests awaiting your review
            </p>
          </SheetHeader>

          {isLoadingApprovals ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovalRequests.map((request) => {
                const purchaseId = parseInt(request.id)
                const isProcessing = approvingIds.has(purchaseId)
                
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{request.requester}</h4>
                          <p className="text-xs text-muted-foreground">{request.submittedAt}</p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          request.urgency === 'high' 
                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400' 
                            : request.urgency === 'medium'
                            ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800/30 dark:text-gray-400'
                        }`}
                      >
                        {request.urgency === 'high' ? 'High Priority' : request.urgency === 'medium' ? 'Medium' : 'Low'}
                      </Badge>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-semibold text-foreground">${request.amount.toLocaleString()}</span>
                        <Badge variant="secondary" className="text-xs">{request.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.vendor}</p>
                      <p className="text-xs text-muted-foreground mt-1">{request.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 gap-1.5"
                        onClick={() => handleApprove(purchaseId)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1.5 bg-transparent"
                        onClick={() => handleReject(purchaseId)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </Button>
                      <Button variant="ghost" size="sm" className="px-3">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )
              })}

              {pendingApprovalRequests.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-1">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">No pending approvals at this time.</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
