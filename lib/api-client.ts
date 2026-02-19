// API Client for Agentic Commerce Backend
// Uses Next.js API proxy to automatically include user session

const API_BASE_URL = '/api/proxy'; // Proxy through Next.js API routes
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || '';

export interface BackendPolicy {
  id: string;
  name: string;
  type: 'budget' | 'transaction' | 'merchant' | 'category' | 'time' | 'agent' | 'purpose' | 'composite';
  enabled: boolean;
  priority: number;
  // NEW: Transaction type scoping
  transactionTypes?: ('agent-to-merchant' | 'agent-to-agent' | 'all')[];
  conditions: {
    users?: string[];
    departments?: string[];
    timeRange?: { start: string; end: string };
  };
  rules: {
    maxAmount?: number;
    period?: 'daily' | 'weekly' | 'monthly';
    maxTransactionAmount?: number;
    allowedMerchants?: string[];
    blockedMerchants?: string[];
    allowedCategories?: string[];
    blockedCategories?: string[];
    // Time-based rules
    allowedTimeRanges?: Array<{ start: string; end: string }>;
    allowedDaysOfWeek?: number[];
    // Agent-based rules
    allowedAgentNames?: string[];
    blockedAgentNames?: string[];
    allowedAgentTypes?: string[];
    blockedAgentTypes?: string[];
    allowedRecipientAgents?: string[];
    blockedRecipientAgents?: string[];
    allowedRecipientAgentTypes?: string[];
    blockedRecipientAgentTypes?: string[];
    // Service-based rules (for agent-to-agent)
    allowedServiceTypes?: string[];
    blockedServiceTypes?: string[];
    allowedServiceCategories?: string[];
    blockedServiceCategories?: string[];
    // Purpose-based rules
    allowedPurposes?: string[];
    blockedPurposes?: string[];
    // Composite conditions
    compositeConditions?: Array<{
      field: string;
      operator: string;
      value: string | number;
    }>;
    // Fallback action when no conditions match
    fallbackAction?: 'approve' | 'deny' | 'flag_review' | 'require_approval';
  };
}

export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
  matchedPolicies: {
    id: string;
    name: string;
    passed: boolean;
    reason?: string;
  }[];
}

export interface SpendingSummary {
  userId: string;
  spending: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface Purchase {
  id: number;
  userId: string;
  transactionType?: 'agent-to-merchant' | 'agent-to-agent';
  // Agent-to-Merchant fields
  productId?: string;
  productName?: string;
  merchant?: string;
  category?: string;
  // Agent-to-Agent fields
  serviceType?: string;
  recipientAgentId?: string;
  buyerAgentId?: string;
  // Common fields
  amount: number;
  allowed: boolean;
  requiresApproval?: boolean;
  policyResults: Array<{
    id: string;
    name: string;
    passed: boolean;
    reason?: string;
  }>;
  timestamp: string;
}

export interface ApprovalAccuracy {
  totalSuggestions: number;
  accepted: number;
  rejected: number;
  requiresApproval: number;
  accuracy: number;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (API_TOKEN) {
    headers.set('Authorization', `Bearer ${API_TOKEN}`);
  }
  headers.set('Content-Type', 'application/json');

  // Remove /api prefix if present (proxy will add it back)
  const cleanUrl = url.startsWith('/api/') ? url.substring(4) : url;

  const response = await fetch(`${API_BASE_URL}${cleanUrl}`, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for session
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const apiClient = {
  // Policy Management
  async getPolicies(): Promise<BackendPolicy[]> {
    const response = await fetchWithAuth('/api/policies');
    return response.policies || [];
  },

  async getPolicy(id: string): Promise<BackendPolicy> {
    const response = await fetchWithAuth(`/api/policies/${id}`);
    return response.policy;
  },

  async createPolicy(policy: BackendPolicy): Promise<BackendPolicy> {
    const response = await fetchWithAuth('/api/policies', {
      method: 'POST',
      body: JSON.stringify(policy),
    });
    return response.policy;
  },

  async updatePolicy(policy: BackendPolicy): Promise<BackendPolicy> {
    const response = await fetchWithAuth(`/api/policies/${policy.id}`, {
      method: 'PUT',
      body: JSON.stringify(policy),
    });
    return response.policy;
  },

  async deletePolicy(id: string): Promise<void> {
    await fetchWithAuth(`/api/policies/${id}`, {
      method: 'DELETE',
    });
  },

  // Policy Checking
  async checkPolicy(request: {
    user_id: string;
    product_id?: string;  // Optional for A2A transactions
    price: number;
    merchant?: string;    // Optional for A2A (uses agentId instead)
    category?: string;
    // New fields for transaction type support
    transaction_type?: 'agent-to-merchant' | 'agent-to-agent';
    serviceType?: string; // For A2A service categorization
    // A2A specific fields
    recipientAgentId?: string;
    buyerAgentId?: string;
    purpose?: string;
  }): Promise<PolicyCheckResult> {
    return fetchWithAuth('/api/policy/check', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Spending
  async getSpending(userId: string): Promise<SpendingSummary> {
    return fetchWithAuth('/api/policy/spending', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  // Purchase History
  async getPurchases(userId: string, limit: number = 50): Promise<Purchase[]> {
    const response = await fetchWithAuth(`/api/purchases?user_id=${userId}&limit=${limit}`);
    return response.purchases || [];
  },

  async getApprovalAccuracy(userId: string): Promise<ApprovalAccuracy> {
    const response = await fetchWithAuth(`/api/approval-accuracy?user_id=${userId}`);
    return response;
  },

  // Approval Management
  async getPendingApprovals(userId?: string): Promise<Purchase[]> {
    const url = userId ? `/api/approvals/pending?user_id=${userId}` : '/api/approvals/pending';
    const response = await fetchWithAuth(url);
    return response.approvals || [];
  },

  async approvePurchase(purchaseId: number): Promise<void> {
    await fetchWithAuth(`/api/approvals/${purchaseId}/approve`, {
      method: 'POST',
    });
  },

  async rejectPurchase(purchaseId: number, reason?: string): Promise<void> {
    await fetchWithAuth(`/api/approvals/${purchaseId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Policy Compliance & Analytics
  async getPolicyCompliance(userId?: string): Promise<{
    totalSpend: number;
    inPolicySpend: number;
    outOfPolicySpend: number;
    compliancePercentage: number;
    totalTransactions: number;
    approvedTransactions: number;
    deniedTransactions: number;
    pendingApprovals: number;
    trend: number;
  }> {
    const url = userId 
      ? `/api/policy/compliance?user_id=${userId}`
      : `/api/policy/compliance`;
    
    const response = await fetchWithAuth(url);
    return response.stats;
  },

  async getPolicyAnalytics(policyId: string, userId?: string): Promise<{
    policyId: string;
    policyName: string;
    totalChecks: number;
    passed: number;
    failed: number;
    successRate: number;
    impactedSpend: number;
  }> {
    const url = userId 
      ? `/api/policy/analytics/${policyId}?user_id=${userId}`
      : `/api/policy/analytics/${policyId}`;
    
    const response = await fetchWithAuth(url);
    return response.analytics;
  },

  // Reviewer Management
  async getReviewers(): Promise<Array<{ id: string; email: string; name?: string; role: string; active: boolean }>> {
    const response = await fetchWithAuth('/api/reviewers');
    return response.reviewers || [];
  },

  async addReviewer(userId: string, role: string = 'reviewer'): Promise<void> {
    await fetchWithAuth('/api/reviewers', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role }),
    });
  },

  async updateReviewerRole(userId: string, role: string): Promise<void> {
    await fetchWithAuth(`/api/reviewers/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async removeReviewer(userId: string): Promise<void> {
    await fetchWithAuth(`/api/reviewers/${userId}`, {
      method: 'DELETE',
    });
  },

  // User Management
  async getUsers(): Promise<Array<{ id: string; email: string; name?: string; role?: string }>> {
    const response = await fetchWithAuth('/api/users');
    return response.users || [];
  },

  // Invoices
  async getInvoices(userId?: string, limit: number = 50): Promise<any[]> {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    params.append('limit', limit.toString());
    
    const response = await fetchWithAuth(`/api/invoices?${params.toString()}`);
    return response.invoices || [];
  },

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return fetch(`${API_BASE_URL}/health`).then((res) => res.json());
  },
};
