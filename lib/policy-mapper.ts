// Utility to map between frontend policy format and backend policy format

import { BackendPolicy } from './api-client';

export interface FrontendPolicy {
  id: string;
  name: string;
  transactionType: "agent-to-merchant" | "agent-to-agent" | "all";
  llmScope: "all" | "specific";
  selectedLLMs: string[];
  trigger: string;
  rules: PolicyRule[];
  fallbackAction: string;
  outcomeAction: string;
  isActive: boolean;
}

export interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface PolicyRule {
  id: string;
  conditions: Condition[];
  logicOperator: "AND" | "OR";
}

/**
 * Convert frontend policy format to backend policy format
 * The frontend has a complex rule-based system, but the backend supports:
 * - budget: maxAmount + period
 * - transaction: maxTransactionAmount
 * - merchant: allowedMerchants/blockedMerchants
 * - category: allowedCategories/blockedCategories
 */
export function frontendToBackendPolicy(frontend: FrontendPolicy): BackendPolicy {
  // Collect all conditions from all rules
  const allConditions: Condition[] = [];
  frontend.rules.forEach(rule => {
    allConditions.push(...rule.conditions);
  });

  // Determine policy type based on conditions
  let policyType: BackendPolicy['type'] = 'transaction';
  const rules: BackendPolicy['rules'] = {};
  const conditions: BackendPolicy['conditions'] = {};

  // Check for different condition types
  const hasAmount = allConditions.some(c => c.field === 'amount');
  const hasMerchant = allConditions.some(c => c.field === 'merchant_name');
  const hasCategory = allConditions.some(c => c.field === 'merchant_category');
  const hasTime = allConditions.some(c => c.field === 'time_of_day');
  const hasDayOfWeek = allConditions.some(c => c.field === 'day_of_week');
  const hasAgent = allConditions.some(c => c.field === 'agent_name' || c.field === 'agent_type' || c.field === 'recipient_agent');
  const hasPurpose = allConditions.some(c => c.field === 'purpose');
  const hasFrequency = allConditions.some(c => c.field === 'frequency');

  // Determine primary policy type
  if (hasAmount && (hasFrequency || hasDayOfWeek)) {
    policyType = 'budget';
  } else if (hasMerchant) {
    policyType = 'merchant';
  } else if (hasCategory) {
    policyType = 'category';
  } else if (hasTime || hasDayOfWeek) {
    policyType = 'time';
  } else if (hasAgent) {
    policyType = 'agent';
  } else if (hasPurpose) {
    policyType = 'purpose';
  } else if (hasAmount) {
    policyType = 'transaction';
  } else if (allConditions.length > 1 || (allConditions.length === 1 && !hasAmount && !hasMerchant && !hasCategory)) {
    // Multiple condition types or non-standard single condition = composite
    policyType = 'composite';
  }

  // Process amount conditions
  if (hasAmount) {
    const amountCondition = allConditions.find(c => c.field === 'amount');
    if (amountCondition) {
      const amount = parseFloat(amountCondition.value);
      if (!isNaN(amount)) {
        if (policyType === 'budget') {
          rules.maxAmount = amount;
          // Determine period from frequency condition or policy name
          const frequencyCondition = allConditions.find(c => c.field === 'frequency');
          if (frequencyCondition) {
            const freqLower = frequencyCondition.value.toLowerCase();
            if (freqLower.includes('daily') || freqLower.includes('day')) {
              rules.period = 'daily';
            } else if (freqLower.includes('weekly') || freqLower.includes('week')) {
              rules.period = 'weekly';
            } else {
              rules.period = 'monthly';
            }
          } else {
            const nameLower = frontend.name.toLowerCase();
            if (nameLower.includes('daily') || nameLower.includes('day')) {
              rules.period = 'daily';
            } else if (nameLower.includes('weekly') || nameLower.includes('week')) {
              rules.period = 'weekly';
            } else {
              rules.period = 'monthly';
            }
          }
        } else {
          rules.maxTransactionAmount = amount;
        }
      }
    }
  }

  // Process merchant conditions
  if (hasMerchant) {
    const allowed: string[] = [];
    const blocked: string[] = [];
    
    allConditions.filter(c => c.field === 'merchant_name').forEach(cond => {
      if (cond.operator === 'equals' || cond.operator === 'in_list') {
        allowed.push(cond.value);
      } else if (cond.operator === 'not_equals' || cond.operator === 'not_contains') {
        blocked.push(cond.value);
      }
    });

    if (allowed.length > 0) rules.allowedMerchants = allowed;
    if (blocked.length > 0) rules.blockedMerchants = blocked;
  }

  // Process category conditions
  if (hasCategory) {
    const allowed: string[] = [];
    const blocked: string[] = [];
    
    allConditions.filter(c => c.field === 'merchant_category').forEach(cond => {
      if (cond.operator === 'equals' || cond.operator === 'in_list') {
        allowed.push(cond.value);
      } else if (cond.operator === 'not_equals' || cond.operator === 'not_contains') {
        blocked.push(cond.value);
      }
    });

    if (allowed.length > 0) rules.allowedCategories = allowed;
    if (blocked.length > 0) rules.blockedCategories = blocked;
  }

  // Process time conditions
  if (hasTime) {
    const timeConditions = allConditions.filter(c => c.field === 'time_of_day');
    const timeRanges: Array<{ start: string; end: string }> = [];
    
    // Try to extract time ranges from conditions
    // For now, we'll store individual time values and let the backend handle ranges
    // This is a simplified approach - you might want to enhance this
    timeConditions.forEach(cond => {
      if (cond.operator === 'equals' || cond.operator === 'greater_than_or_equal') {
        // Assume HH:MM format
        timeRanges.push({ start: cond.value, end: '23:59' });
      }
    });
    
    if (timeRanges.length > 0) {
      rules.allowedTimeRanges = timeRanges;
    }
  }

  // Process day of week conditions
  if (hasDayOfWeek) {
    const dayConditions = allConditions.filter(c => c.field === 'day_of_week');
    const allowedDays: number[] = [];
    
    dayConditions.forEach(cond => {
      if (cond.operator === 'equals' || cond.operator === 'in_list') {
        // Map day names to numbers (Sunday = 0)
        const dayMap: { [key: string]: number } = {
          'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
          'thursday': 4, 'friday': 5, 'saturday': 6
        };
        const dayValue = dayMap[cond.value.toLowerCase()];
        if (dayValue !== undefined) {
          allowedDays.push(dayValue);
        } else {
          // Try parsing as number
          const dayNum = parseInt(cond.value);
          if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
            allowedDays.push(dayNum);
          }
        }
      }
    });
    
    if (allowedDays.length > 0) {
      rules.allowedDaysOfWeek = allowedDays;
    }
  }

  // Process agent conditions
  if (hasAgent) {
    const agentNameConditions = allConditions.filter(c => c.field === 'agent_name');
    const agentTypeConditions = allConditions.filter(c => c.field === 'agent_type');
    const recipientConditions = allConditions.filter(c => c.field === 'recipient_agent');

    // Agent names
    const allowedAgentNames: string[] = [];
    const blockedAgentNames: string[] = [];
    agentNameConditions.forEach(cond => {
      if (cond.operator === 'equals' || cond.operator === 'in_list') {
        allowedAgentNames.push(cond.value);
      } else if (cond.operator === 'not_equals' || cond.operator === 'not_contains') {
        blockedAgentNames.push(cond.value);
      }
    });

    // Agent types
    const allowedAgentTypes: string[] = [];
    const blockedAgentTypes: string[] = [];
    agentTypeConditions.forEach(cond => {
      if (cond.operator === 'equals' || cond.operator === 'in_list') {
        allowedAgentTypes.push(cond.value);
      } else if (cond.operator === 'not_equals' || cond.operator === 'not_contains') {
        blockedAgentTypes.push(cond.value);
      }
    });

    // Recipient agents
    const allowedRecipients: string[] = [];
    const blockedRecipients: string[] = [];
    recipientConditions.forEach(cond => {
      if (cond.operator === 'equals' || cond.operator === 'in_list') {
        allowedRecipients.push(cond.value);
      } else if (cond.operator === 'not_equals' || cond.operator === 'not_contains') {
        blockedRecipients.push(cond.value);
      }
    });

    if (allowedAgentNames.length > 0) rules.allowedAgentNames = allowedAgentNames;
    if (blockedAgentNames.length > 0) rules.blockedAgentNames = blockedAgentNames;
    if (allowedAgentTypes.length > 0) rules.allowedAgentTypes = allowedAgentTypes;
    if (blockedAgentTypes.length > 0) rules.blockedAgentTypes = blockedAgentTypes;
    if (allowedRecipients.length > 0) rules.allowedRecipientAgents = allowedRecipients;
    if (blockedRecipients.length > 0) rules.blockedRecipientAgents = blockedRecipients;
  }

  // Process purpose conditions
  if (hasPurpose) {
    const purposeConditions = allConditions.filter(c => c.field === 'purpose');
    const allowed: string[] = [];
    const blocked: string[] = [];
    
    purposeConditions.forEach(cond => {
      if (cond.operator === 'equals' || cond.operator === 'in_list') {
        allowed.push(cond.value);
      } else if (cond.operator === 'not_equals' || cond.operator === 'not_contains') {
        blocked.push(cond.value);
      }
    });

    if (allowed.length > 0) rules.allowedPurposes = allowed;
    if (blocked.length > 0) rules.blockedPurposes = blocked;
  }

  // For composite policies, store all conditions
  if (policyType === 'composite') {
    rules.compositeConditions = allConditions.map(cond => ({
      field: cond.field,
      operator: cond.operator,
      value: cond.field === 'amount' || cond.field === 'day_of_week' ? parseFloat(cond.value) || cond.value : cond.value
    }));
  }

  // If no specific rules extracted, default to transaction
  if (Object.keys(rules).length === 0 && allConditions.length > 0) {
    const amountCondition = allConditions.find(c => c.field === 'amount');
    if (amountCondition) {
      const amount = parseFloat(amountCondition.value);
      if (!isNaN(amount)) {
        policyType = 'transaction';
        rules.maxTransactionAmount = amount;
      }
    }
  }

  // Ensure we always have at least one rule
  if (Object.keys(rules).length === 0) {
    policyType = 'transaction';
    rules.maxTransactionAmount = 500;
  }

  // Include fallback action in rules
  if (frontend.fallbackAction) {
    rules.fallbackAction = frontend.fallbackAction as 'approve' | 'deny' | 'flag_review' | 'require_approval';
  }

  return {
    id: frontend.id,
    name: frontend.name,
    type: policyType,
    enabled: frontend.isActive,
    priority: 100, // Default priority
    conditions,
    rules,
  };
}

/**
 * Convert backend policy format to frontend policy format
 */
export function backendToFrontendPolicy(backend: BackendPolicy): FrontendPolicy {
  const conditions: Condition[] = [];
  const timestamp = Date.now();
  
  // Convert backend rules to frontend conditions
  if (backend.type === 'budget' && backend.rules.maxAmount) {
    // For budget, we show it as a limit that shouldn't be exceeded
    // The frontend will interpret this as "if amount would exceed budget"
    conditions.push({
      id: `cond-${timestamp}-1`,
      field: 'amount',
      operator: 'greater_than_or_equal',
      value: String(backend.rules.maxAmount),
    });
  } else if (backend.type === 'transaction' && backend.rules.maxTransactionAmount) {
    conditions.push({
      id: `cond-${timestamp}-1`,
      field: 'amount',
      operator: 'less_than_or_equal',
      value: String(backend.rules.maxTransactionAmount),
    });
  } else if (backend.type === 'merchant') {
    if (backend.rules.allowedMerchants && backend.rules.allowedMerchants.length > 0) {
      // For allowed merchants, use in_list if multiple, equals if single
      if (backend.rules.allowedMerchants.length === 1) {
        conditions.push({
          id: `cond-${timestamp}-1`,
          field: 'merchant_name',
          operator: 'equals',
          value: backend.rules.allowedMerchants[0],
        });
      } else {
        backend.rules.allowedMerchants.forEach((merchant, idx) => {
          conditions.push({
            id: `cond-${timestamp}-${idx + 1}`,
            field: 'merchant_name',
            operator: 'in_list',
            value: merchant,
          });
        });
      }
    }
    if (backend.rules.blockedMerchants && backend.rules.blockedMerchants.length > 0) {
      backend.rules.blockedMerchants.forEach((merchant, idx) => {
        conditions.push({
          id: `cond-blocked-${timestamp}-${idx + 1}`,
          field: 'merchant_name',
          operator: 'not_equals',
          value: merchant,
        });
      });
    }
  } else if (backend.type === 'category') {
    if (backend.rules.allowedCategories && backend.rules.allowedCategories.length > 0) {
      if (backend.rules.allowedCategories.length === 1) {
        conditions.push({
          id: `cond-${timestamp}-1`,
          field: 'merchant_category',
          operator: 'equals',
          value: backend.rules.allowedCategories[0],
        });
      } else {
        backend.rules.allowedCategories.forEach((category, idx) => {
          conditions.push({
            id: `cond-${timestamp}-${idx + 1}`,
            field: 'merchant_category',
            operator: 'in_list',
            value: category,
          });
        });
      }
    }
    if (backend.rules.blockedCategories && backend.rules.blockedCategories.length > 0) {
      backend.rules.blockedCategories.forEach((category, idx) => {
        conditions.push({
          id: `cond-blocked-${timestamp}-${idx + 1}`,
          field: 'merchant_category',
          operator: 'not_equals',
          value: category,
        });
      });
    }
  } else if (backend.type === 'time') {
    // Time-based conditions
    if (backend.rules.allowedTimeRanges && backend.rules.allowedTimeRanges.length > 0) {
      backend.rules.allowedTimeRanges.forEach((range, idx) => {
        conditions.push({
          id: `cond-time-${timestamp}-${idx + 1}`,
          field: 'time_of_day',
          operator: 'greater_than_or_equal',
          value: range.start,
        });
      });
    }
    if (backend.rules.allowedDaysOfWeek && backend.rules.allowedDaysOfWeek.length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      backend.rules.allowedDaysOfWeek.forEach((day, idx) => {
        conditions.push({
          id: `cond-day-${timestamp}-${idx + 1}`,
          field: 'day_of_week',
          operator: 'equals',
          value: dayNames[day] || String(day),
        });
      });
    }
  } else if (backend.type === 'agent') {
    // Agent-based conditions
    if (backend.rules.allowedAgentNames && backend.rules.allowedAgentNames.length > 0) {
      backend.rules.allowedAgentNames.forEach((agent, idx) => {
        conditions.push({
          id: `cond-agent-${timestamp}-${idx + 1}`,
          field: 'agent_name',
          operator: backend.rules.allowedAgentNames.length === 1 ? 'equals' : 'in_list',
          value: agent,
        });
      });
    }
    if (backend.rules.blockedAgentNames && backend.rules.blockedAgentNames.length > 0) {
      backend.rules.blockedAgentNames.forEach((agent, idx) => {
        conditions.push({
          id: `cond-agent-blocked-${timestamp}-${idx + 1}`,
          field: 'agent_name',
          operator: 'not_equals',
          value: agent,
        });
      });
    }
    if (backend.rules.allowedAgentTypes && backend.rules.allowedAgentTypes.length > 0) {
      backend.rules.allowedAgentTypes.forEach((type, idx) => {
        conditions.push({
          id: `cond-agent-type-${timestamp}-${idx + 1}`,
          field: 'agent_type',
          operator: backend.rules.allowedAgentTypes.length === 1 ? 'equals' : 'in_list',
          value: type,
        });
      });
    }
    if (backend.rules.allowedRecipientAgents && backend.rules.allowedRecipientAgents.length > 0) {
      backend.rules.allowedRecipientAgents.forEach((agent, idx) => {
        conditions.push({
          id: `cond-recipient-${timestamp}-${idx + 1}`,
          field: 'recipient_agent',
          operator: backend.rules.allowedRecipientAgents.length === 1 ? 'equals' : 'in_list',
          value: agent,
        });
      });
    }
  } else if (backend.type === 'purpose') {
    // Purpose-based conditions
    if (backend.rules.allowedPurposes && backend.rules.allowedPurposes.length > 0) {
      backend.rules.allowedPurposes.forEach((purpose, idx) => {
        conditions.push({
          id: `cond-purpose-${timestamp}-${idx + 1}`,
          field: 'purpose',
          operator: backend.rules.allowedPurposes.length === 1 ? 'equals' : 'in_list',
          value: purpose,
        });
      });
    }
    if (backend.rules.blockedPurposes && backend.rules.blockedPurposes.length > 0) {
      backend.rules.blockedPurposes.forEach((purpose, idx) => {
        conditions.push({
          id: `cond-purpose-blocked-${timestamp}-${idx + 1}`,
          field: 'purpose',
          operator: 'not_equals',
          value: purpose,
        });
      });
    }
  } else if (backend.type === 'composite' && backend.rules.compositeConditions) {
    // Composite conditions - convert directly
    backend.rules.compositeConditions.forEach((cond, idx) => {
      conditions.push({
        id: `cond-composite-${timestamp}-${idx + 1}`,
        field: cond.field,
        operator: cond.operator,
        value: String(cond.value),
      });
    });
  }

  // If no conditions, create a default one
  if (conditions.length === 0) {
    conditions.push({
      id: `cond-${timestamp}-1`,
      field: 'amount',
      operator: 'greater_than',
      value: '0',
    });
  }

  return {
    id: backend.id,
    name: backend.name,
    transactionType: 'agent-to-merchant',
    llmScope: 'all',
    selectedLLMs: [],
    trigger: 'transaction_occurs',
    rules: [
      {
        id: `rule-${timestamp}`,
        conditions,
        logicOperator: 'AND',
      },
    ],
    fallbackAction: backend.rules.fallbackAction || 'require_approval',
    outcomeAction: 'approve',
    isActive: backend.enabled,
  };
}
