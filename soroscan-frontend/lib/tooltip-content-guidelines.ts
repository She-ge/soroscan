/**
 * Tooltip Content Guidelines for Degraded Contract Status
 * ──────────────────────────────────────────────────────────────────────────────
 * Comprehensive guidelines and utilities for generating contextual, actionable
 * tooltip content for degraded contract health indicators.
 * 
 * Features:
 * - Structured content templates for different degradation types
 * - Severity-based messaging (Minor, Moderate, Severe)
 * - Actionable recommendations and next steps
 * - Multi-language support preparation
 * - Accessibility-optimized content structure
 */

export type DegradationSeverity = "minor" | "moderate" | "severe";

export type DegradationType = 
  | "performance"
  | "connectivity" 
  | "data_quality"
  | "sync_lag"
  | "partial_failure"
  | "resource_limit"
  | "configuration"
  | "network_issues";

export interface DegradationContext {
  /** Type of degradation detected */
  type: DegradationType;
  /** Severity level of the issue */
  severity: DegradationSeverity;
  /** Specific metrics or error details */
  details?: {
    /** Performance metrics */
    responseTime?: number;
    /** Error rate percentage */
    errorRate?: number;
    /** Last successful operation timestamp */
    lastSuccess?: string;
    /** Number of affected operations */
    affectedOps?: number;
    /** Resource utilization percentage */
    resourceUsage?: number;
  };
  /** Estimated time to resolution */
  estimatedResolution?: string;
  /** Whether automatic recovery is in progress */
  autoRecoveryActive?: boolean;
  /** Custom message for specific situations */
  customMessage?: string;
}

/**
 * Content Templates for Different Degradation Types
 */
export const DEGRADATION_CONTENT_TEMPLATES = {
  performance: {
    title: "Performance Degraded",
    descriptions: {
      minor: "Response times slightly elevated. Contract operations may take longer than usual.",
      moderate: "Significant performance impact detected. Operations experiencing delays.",
      severe: "Critical performance issues. Contract operations severely impacted."
    },
    causes: [
      "High network latency",
      "Resource constraints",
      "Database query optimization needed",
      "Temporary system load"
    ],
    actions: {
      minor: [
        "Monitor performance metrics",
        "Check for network congestion"
      ],
      moderate: [
        "Review recent contract calls",
        "Check system resource usage",
        "Consider scaling resources"
      ],
      severe: [
        "Immediate investigation required",
        "Contact system administrators",
        "Review error logs",
        "Consider temporary rate limiting"
      ]
    }
  },
  connectivity: {
    title: "Connectivity Issues",
    descriptions: {
      minor: "Intermittent connection issues detected. Some operations may retry automatically.",
      moderate: "Network connectivity problems affecting contract reliability.",
      severe: "Significant connectivity failures. Contract operations may be unavailable."
    },
    causes: [
      "Network infrastructure issues",
      "DNS resolution problems", 
      "Firewall or security changes",
      "Third-party service outages"
    ],
    actions: {
      minor: [
        "Monitor connection stability",
        "Verify network configuration"
      ],
      moderate: [
        "Check network status dashboard",
        "Verify DNS settings",
        "Review firewall rules"
      ],
      severe: [
        "Escalate to network team",
        "Check for service outages",
        "Implement failover procedures"
      ]
    }
  },
  data_quality: {
    title: "Data Quality Issues",
    descriptions: {
      minor: "Minor data inconsistencies detected. Data validation may catch some issues.",
      moderate: "Data quality problems affecting contract accuracy.",
      severe: "Critical data integrity issues. Contract results may be unreliable."
    },
    causes: [
      "Schema validation failures",
      "Data source synchronization issues",
      "Incomplete data migrations",
      "Third-party data corruption"
    ],
    actions: {
      minor: [
        "Review recent data changes",
        "Run data validation checks"
      ],
      moderate: [
        "Investigate data source integrity",
        "Check synchronization processes",
        "Review data transformation logs"
      ],
      severe: [
        "Stop affected operations",
        "Perform data integrity audit",
        "Restore from known good backup"
      ]
    }
  },
  sync_lag: {
    title: "Synchronization Lag",
    descriptions: {
      minor: "Contract data is slightly behind the latest blockchain state.",
      moderate: "Noticeable synchronization delays affecting data freshness.",
      severe: "Significant sync lag. Contract data may be substantially outdated."
    },
    causes: [
      "High blockchain transaction volume",
      "Indexing service overload",
      "Network congestion",
      "Resource constraints"
    ],
    actions: {
      minor: [
        "Monitor sync progress",
        "Check blockchain node status"
      ],
      moderate: [
        "Review indexing service health",
        "Check for processing bottlenecks",
        "Consider increasing resources"
      ],
      severe: [
        "Restart synchronization service",
        "Investigate blockchain node issues",
        "Scale indexing infrastructure"
      ]
    }
  },
  partial_failure: {
    title: "Partial Service Failure", 
    descriptions: {
      minor: "Some contract features experiencing issues while core functionality remains available.",
      moderate: "Multiple contract features affected. Reduced functionality available.",
      severe: "Major service components failing. Limited contract functionality available."
    },
    causes: [
      "Microservice dependencies down",
      "Database partition issues",
      "Service configuration errors",
      "Resource exhaustion"
    ],
    actions: {
      minor: [
        "Identify affected features",
        "Check service dependencies"
      ],
      moderate: [
        "Review service health checks",
        "Restart affected components",
        "Check resource allocation"
      ],
      severe: [
        "Implement emergency procedures",
        "Activate backup services",
        "Escalate to on-call team"
      ]
    }
  },
  resource_limit: {
    title: "Resource Limits Reached",
    descriptions: {
      minor: "Approaching resource limits. Performance may degrade under load.",
      moderate: "Resource constraints affecting contract performance.",
      severe: "Critical resource exhaustion. Service capacity severely limited."
    },
    causes: [
      "High transaction volume",
      "Memory or CPU constraints",
      "Storage capacity issues",
      "Rate limiting activation"
    ],
    actions: {
      minor: [
        "Monitor resource usage trends",
        "Review scaling policies"
      ],
      moderate: [
        "Scale up resources immediately",
        "Implement load balancing",
        "Review resource allocation"
      ],
      severe: [
        "Emergency resource scaling",
        "Implement circuit breakers", 
        "Contact infrastructure team"
      ]
    }
  }
} as const;

/**
 * Generate structured tooltip content for degraded status
 */
export function generateDegradedTooltipContent(context: DegradationContext): string {
  const template = DEGRADATION_CONTENT_TEMPLATES[context.type];
  const severity = context.severity;
  
  if (!template) {
    return context.customMessage || "Contract experiencing degraded performance";
  }
  
  let content = `**${template.title}**\n\n`;
  
  // Add description based on severity
  content += `${template.descriptions[severity]}\n\n`;
  
  // Add specific details if available
  if (context.details) {
    const details = context.details;
    const detailParts: string[] = [];
    
    if (details.responseTime) {
      detailParts.push(`Response time: ${details.responseTime}ms`);
    }
    if (details.errorRate) {
      detailParts.push(`Error rate: ${details.errorRate}%`);
    }
    if (details.affectedOps) {
      detailParts.push(`Affected operations: ${details.affectedOps}`);
    }
    if (details.resourceUsage) {
      detailParts.push(`Resource usage: ${details.resourceUsage}%`);
    }
    if (details.lastSuccess) {
      detailParts.push(`Last success: ${details.lastSuccess}`);
    }
    
    if (detailParts.length > 0) {
      content += `**Current Status:**\n${detailParts.join(' • ')}\n\n`;
    }
  }
  
  // Add auto-recovery status
  if (context.autoRecoveryActive) {
    content += `🔄 Auto-recovery in progress\n`;
    if (context.estimatedResolution) {
      content += `⏱️ Estimated resolution: ${context.estimatedResolution}\n`;
    }
    content += '\n';
  }
  
  // Add recommended actions
  const actions = template.actions[severity];
  if (actions && actions.length > 0) {
    content += `**Recommended Actions:**\n`;
    actions.forEach(action => {
      content += `• ${action}\n`;
    });
  }
  
  return content.trim();
}

/**
 * Generate accessible tooltip content (screen reader optimized)
 */
export function generateAccessibleTooltipContent(context: DegradationContext): string {
  const template = DEGRADATION_CONTENT_TEMPLATES[context.type];
  
  if (!template) {
    return `Contract status degraded. ${context.customMessage || 'Performance issues detected.'}`;
  }
  
  let content = `Contract health degraded: ${template.title}. `;
  content += `${template.descriptions[context.severity]} `;
  
  if (context.autoRecoveryActive) {
    content += `Auto-recovery is active. `;
    if (context.estimatedResolution) {
      content += `Estimated resolution time: ${context.estimatedResolution}. `;
    }
  }
  
  // Add key metrics for screen readers
  if (context.details) {
    const details = context.details;
    if (details.errorRate) {
      content += `Current error rate: ${details.errorRate} percent. `;
    }
    if (details.responseTime) {
      content += `Response time: ${details.responseTime} milliseconds. `;
    }
  }
  
  return content.trim();
}

/**
 * Content Guidelines for Different UI Contexts
 */
export const TOOLTIP_CONTENT_GUIDELINES = {
  // Contract List - Brief, non-intrusive
  contractList: {
    maxLength: 120,
    includeActions: false,
    includeDetails: false,
    format: "brief"
  },
  
  // Dashboard - Informative with key metrics
  dashboard: {
    maxLength: 200,
    includeActions: true,
    includeDetails: true,
    format: "structured"
  },
  
  // Contract Detail Page - Comprehensive information
  contractDetail: {
    maxLength: 400,
    includeActions: true,
    includeDetails: true,
    format: "comprehensive"
  },
  
  // Mobile/Compact Views - Essential information only
  mobile: {
    maxLength: 80,
    includeActions: false,
    includeDetails: false,
    format: "minimal"
  }
} as const;

/**
 * Format tooltip content based on UI context
 */
export function formatTooltipForContext(
  context: DegradationContext,
  uiContext: keyof typeof TOOLTIP_CONTENT_GUIDELINES
): string {
  const guidelines = TOOLTIP_CONTENT_GUIDELINES[uiContext];
  const fullContent = generateDegradedTooltipContent(context);
  
  switch (guidelines.format) {
    case "minimal":
      return DEGRADATION_CONTENT_TEMPLATES[context.type]?.descriptions[context.severity] || 
             "Performance degraded";
    
    case "brief":
      const template = DEGRADATION_CONTENT_TEMPLATES[context.type];
      let brief = `${template?.title}: ${template?.descriptions[context.severity]}`;
      if (context.autoRecoveryActive) {
        brief += " (Auto-recovery active)";
      }
      return brief;
    
    case "structured":
    case "comprehensive":
      return fullContent.length > guidelines.maxLength 
        ? fullContent.substring(0, guidelines.maxLength - 3) + "..."
        : fullContent;
    
    default:
      return fullContent;
  }
}

/**
 * Predefined tooltip content for common scenarios
 */
export const COMMON_DEGRADATION_SCENARIOS = {
  highLatency: {
    type: "performance" as const,
    severity: "moderate" as const,
    details: { responseTime: 2500, errorRate: 5 },
    autoRecoveryActive: true,
    estimatedResolution: "10-15 minutes"
  },
  
  syncLag: {
    type: "sync_lag" as const,
    severity: "minor" as const,
    details: { lastSuccess: "2 minutes ago" },
    autoRecoveryActive: true,
    estimatedResolution: "5 minutes"
  },
  
  networkIssues: {
    type: "connectivity" as const,
    severity: "moderate" as const,
    details: { errorRate: 12, affectedOps: 23 },
    autoRecoveryActive: false
  },
  
  resourceConstraints: {
    type: "resource_limit" as const,
    severity: "severe" as const,
    details: { resourceUsage: 95, errorRate: 25 },
    autoRecoveryActive: true,
    estimatedResolution: "20-30 minutes"
  }
} as const;

/**
 * Validation utilities for tooltip content
 */
export function validateTooltipContent(content: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check length constraints
  if (content.length === 0) {
    errors.push("Tooltip content cannot be empty");
  }
  
  if (content.length > 500) {
    warnings.push("Tooltip content exceeds recommended maximum length (500 characters)");
  }
  
  // Check for accessibility issues
  if (!/^[A-Z]/.test(content.trim())) {
    warnings.push("Tooltip content should start with a capital letter");
  }
  
  if (!/[.!?]$/.test(content.trim())) {
    warnings.push("Tooltip content should end with proper punctuation");
  }
  
  // Check for markdown formatting in contexts that don't support it
  if (content.includes('**') || content.includes('*')) {
    warnings.push("Markdown formatting may not be supported in all tooltip contexts");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}