/**
 * Badge and StatusIndicator Usage Examples
 * ──────────────────────────────────────────────────────────────────────────────
 * Demonstrates usage of Badge and StatusIndicator components across different contexts
 * mentioned in the acceptance criteria: contract list, event explorer, webhook list.
 */
"use client";

import * as React from "react";
import { Badge } from "./badge";
import { StatusIndicator } from "./status-indicator";
import { CheckCircle, AlertTriangle, Clock, Activity, Zap } from "lucide-react";

export function BadgeStatusExamples() {
  return (
    <div className="space-y-8 p-6">
      <section className="space-y-4">
        <h2 className="text-lg font-terminal-mono text-terminal-green">
          Contract List Usage
        </h2>
        
        <div className="space-y-3">
          {/* Active contract with event count */}
          <div className="flex items-center justify-between p-4 rounded border border-terminal-green/30">
            <div className="flex items-center gap-3">
              <StatusIndicator status="active" />
              <span className="font-terminal-mono">contract_12345...abcdef</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" icon={Activity} size="sm">1.2k Events</Badge>
              <Badge variant="secondary" size="sm">Verified</Badge>
            </div>
          </div>
          
          {/* Failed contract */}
          <div className="flex items-center justify-between p-4 rounded border border-terminal-danger/30">
            <div className="flex items-center gap-3">
              <StatusIndicator status="failed" />
              <span className="font-terminal-mono">contract_67890...xyz123</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="danger" icon={AlertTriangle} size="sm">Error</Badge>
              <Badge variant="outline" size="sm">Unverified</Badge>
            </div>
          </div>
          
          {/* Pending contract */}
          <div className="flex items-center justify-between p-4 rounded border border-terminal-warning/30">
            <div className="flex items-center gap-3">
              <StatusIndicator status="pending" />
              <span className="font-terminal-mono">contract_new456...def789</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" icon={Clock} size="sm">Indexing</Badge>
              <Badge variant="outline" size="sm">New</Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-terminal-mono text-terminal-green">
          Event Explorer Usage
        </h2>
        
        <div className="space-y-2">
          {/* Event with priority and category */}
          <div className="flex items-center gap-4 p-3 rounded border border-terminal-gray/20">
            <StatusIndicator status="active" size="sm" dotOnly />
            <span className="font-terminal-mono text-sm">Transfer Event</span>
            <Badge variant="primary" size="sm">High Priority</Badge>
            <Badge variant="secondary" size="sm" icon={Zap}>Real-time</Badge>
          </div>
          
          <div className="flex items-center gap-4 p-3 rounded border border-terminal-gray/20">
            <StatusIndicator status="pending" size="sm" dotOnly />
            <span className="font-terminal-mono text-sm">Mint Event</span>
            <Badge variant="warning" size="sm">Processing</Badge>
            <Badge variant="outline" size="sm">Batch</Badge>
          </div>
          
          <div className="flex items-center gap-4 p-3 rounded border border-terminal-gray/20">
            <StatusIndicator status="failed" size="sm" dotOnly />
            <span className="font-terminal-mono text-sm">Burn Event</span>
            <Badge variant="danger" size="sm">Failed</Badge>
            <Badge variant="outline" size="sm">Retry</Badge>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-terminal-mono text-terminal-green">
          Webhook List Usage
        </h2>
        
        <div className="space-y-3">
          {/* Successful webhook */}
          <div className="flex items-center justify-between p-4 rounded border border-terminal-green/30">
            <div className="flex items-center gap-3">
              <StatusIndicator status="active" variant="compact" />
              <span className="font-terminal-mono">https://api.example.com/webhook</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" icon={CheckCircle} size="sm">Delivered</Badge>
              <Badge variant="outline" size="sm">2min ago</Badge>
            </div>
          </div>
          
          {/* Retrying webhook */}
          <div className="flex items-center justify-between p-4 rounded border border-terminal-warning/30">
            <div className="flex items-center gap-3">
              <StatusIndicator status="pending" variant="compact" />
              <span className="font-terminal-mono">https://webhook.service.com/events</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" icon={Clock} size="sm">Retrying</Badge>
              <Badge variant="outline" size="sm">Attempt 2/3</Badge>
            </div>
          </div>
          
          {/* Failed webhook */}
          <div className="flex items-center justify-between p-4 rounded border border-terminal-danger/30">
            <div className="flex items-center gap-3">
              <StatusIndicator status="failed" variant="compact" />
              <span className="font-terminal-mono">https://broken.endpoint.com/hook</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="danger" icon={AlertTriangle} size="sm">Failed</Badge>
              <Badge variant="outline" size="sm">5min ago</Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-terminal-mono text-terminal-green">
          Size Variants Showcase
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm font-terminal-mono">Small:</span>
            <StatusIndicator status="active" size="sm" />
            <Badge size="sm" variant="success">SM Badge</Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm font-terminal-mono">Medium:</span>
            <StatusIndicator status="pending" size="md" />
            <Badge size="md" variant="warning">MD Badge</Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm font-terminal-mono">Large:</span>
            <StatusIndicator status="failed" size="lg" />
            <Badge size="lg" variant="danger">LG Badge</Badge>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-terminal-mono text-terminal-green">
          Color Variants Showcase
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
          </div>
          <div className="space-y-2">
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </div>
      </section>
    </div>
  );
}