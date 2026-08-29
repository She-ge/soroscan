/**
 * Contract Health Badge Demo & Examples
 * ──────────────────────────────────────────────────────────────────────────────
 * Comprehensive demo showcasing all ContractHealthBadge variations and use cases.
 * 
 * Includes:
 * - All status types and variants
 * - Context-specific examples (contract list, dashboard, detail view)
 * - Animation demonstrations
 * - Tooltip content examples
 * - Accessibility testing helpers
 */
"use client";

import * as React from "react";
import { ContractHealthBadge, HEALTH_STATUS_CONFIG, HealthBadgePresets } from "./ContractHealthBadge";
import { COMMON_DEGRADATION_SCENARIOS } from "@/lib/tooltip-content-guidelines";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

export function ContractHealthBadgeDemo() {
  return (
    <div className="space-y-8 p-6 bg-terminal-black text-terminal-green">
      {/* Basic Status Types */}
      <Card>
        <CardHeader>
          <CardTitle className="font-terminal-mono text-terminal-green">
            Basic Status Types
          </CardTitle>
          <CardDescription>
            All four health status types with default styling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <ContractHealthBadge status="healthy" />
            <ContractHealthBadge status="degraded" />
            <ContractHealthBadge status="paused" />
            <ContractHealthBadge status="error" />
          </div>
        </CardContent>
      </Card>

      {/* Size Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="font-terminal-mono text-terminal-green">
            Size Variants
          </CardTitle>
          <CardDescription>
            Small, medium, and large sizes for different contexts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(['sm', 'md', 'lg'] as const).map(size => (
            <div key={size} className="space-y-2">
              <h4 className="text-sm font-terminal-mono text-terminal-cyan uppercase">
                Size: {size}
              </h4>
              <div className="flex flex-wrap gap-3">
                <ContractHealthBadge status="healthy" size={size} />
                <ContractHealthBadge status="degraded" size={size} />
                <ContractHealthBadge status="paused" size={size} />
                <ContractHealthBadge status="error" size={size} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Variant Styles */}
      <Card>
        <CardHeader>
          <CardTitle className="font-terminal-mono text-terminal-green">
            Variant Styles
          </CardTitle>
          <CardDescription>
            Different visual treatments for various UI contexts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(['default', 'compact', 'pill', 'square'] as const).map(variant => (
            <div key={variant} className="space-y-2">
              <h4 className="text-sm font-terminal-mono text-terminal-cyan uppercase">
                Variant: {variant}
              </h4>
              <div className="flex flex-wrap gap-3">
                <ContractHealthBadge status="healthy" variant={variant} />
                <ContractHealthBadge status="degraded" variant={variant} />
                <ContractHealthBadge status="paused" variant={variant} />
                <ContractHealthBadge status="error" variant={variant} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Glow Effects */}
      <Card>
        <CardHeader>
          <CardTitle className="font-terminal-mono text-terminal-green">
            Glow Effects
          </CardTitle>
          <CardDescription>
            Different glow intensities for visual emphasis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(['none', 'subtle', 'moderate', 'intense'] as const).map(glow => (
            <div key={glow} className="space-y-2">
              <h4 className="text-sm font-terminal-mono text-terminal-cyan uppercase">
                Glow: {glow}
              </h4>
              <div className="flex flex-wrap gap-3 p-4 bg-terminal-dark rounded">
                <ContractHealthBadge status="healthy" glow={glow} />
                <ContractHealthBadge status="degraded" glow={glow} />
                <ContractHealthBadge status="paused" glow={glow} />
                <ContractHealthBadge status="error" glow={glow} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Icon Variations */}
      <Card>
        <CardHeader>
          <CardTitle className="font-terminal-mono text-terminal-green">
            Icon & Dot Variations
          </CardTitle>
          <CardDescription>
            Different ways to display status indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-terminal-mono text-terminal-cyan">With Icons</h4>
            <div className="flex flex-wrap gap-3">
              <ContractHealthBadge status="healthy" showIcon />
              <ContractHealthBadge status="degraded" showIcon />
              <ContractHealthBadge status="paused" showIcon />
              <ContractHealthBadge status="error" showIcon />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-terminal-mono text-terminal-cyan">Dot Only</h4>
            <div className="flex flex-wrap gap-3">
              <ContractHealthBadge status="healthy" dotOnly />
              <ContractHealthBadge status="degraded" dotOnly />
              <ContractHealthBadge status="paused" dotOnly />
              <ContractHealthBadge status="error" dotOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Degraded Status with Context */}
      <Card>
        <CardHeader>
          <CardTitle className="font-terminal-mono text-terminal-green">
            Degraded Status with Context
          </CardTitle>
          <CardDescription>
            Degraded status badges with detailed tooltip information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(COMMON_DEGRADATION_SCENARIOS).map(([scenarioKey, context]) => (
            <div key={scenarioKey} className="space-y-2">
              <h4 className="text-sm font-terminal-mono text-terminal-cyan capitalize">
                {scenarioKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </h4>
              <div className="flex gap-3">
                <ContractHealthBadge 
                  status="degraded" 
                  degradationContext={context}
                  variant="pill"
                />
                <ContractHealthBadge 
                  status="degraded" 
                  degradationContext={context}
                  dotOnly
                  size="sm"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preset Configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="font-terminal-mono text-terminal-green">
            Preset Configurations
          </CardTitle>
          <CardDescription>
            Pre-configured badge styles for common use cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(HealthBadgePresets).map(([presetName, presetConfig]) => (
            <div key={presetName} className="space-y-2">
              <h4 className="text-sm font-terminal-mono text-terminal-cyan capitalize">
                {presetName.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </h4>
              <div className="flex flex-wrap gap-3">
                <ContractHealthBadge status="healthy" {...presetConfig} />
                <ContractHealthBadge 
                  status="degraded" 
                  degradationContext={COMMON_DEGRADATION_SCENARIOS.highLatency}
                  {...presetConfig} 
                />
                <ContractHealthBadge status="paused" {...presetConfig} />
                <ContractHealthBadge status="error" {...presetConfig} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Metrics Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="font-terminal-mono text-terminal-green">
            With Metrics
          </CardTitle>
          <CardDescription>
            Status badges displaying additional metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <ContractHealthBadge 
              status="healthy" 
              metrics={{ eventCount: 1234, uptime: "99.9%" }}
              variant="pill"
              size="lg"
            />
            <ContractHealthBadge 
              status="degraded" 
              degradationContext={COMMON_DEGRADATION_SCENARIOS.resourceConstraints}
              metrics={{ eventCount: 856, uptime: "94.2%" }}
              variant="pill"
              size="lg"
            />
            <ContractHealthBadge 
              status="paused" 
              metrics={{ lastActivity: "5 min ago" }}
              variant="pill"
              size="lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Real-world Context Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="font-terminal-mono text-terminal-green">
            Real-world Context Examples
          </CardTitle>
          <CardDescription>
            How badges appear in actual SoroScan interface contexts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Contract List Context */}
          <div className="space-y-3">
            <h4 className="text-sm font-terminal-mono text-terminal-cyan">
              Contract List
            </h4>
            <div className="space-y-2">
              {[
                { 
                  id: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAACTHXDYHH", 
                  status: "healthy" as const,
                  events: 2341 
                },
                { 
                  id: "CBQHNAXSI55GX2GN6D67GK7BHVPSLJUGK3TC5USQA3GNOAZBNDJ7KRV7", 
                  status: "degraded" as const,
                  events: 156,
                  context: COMMON_DEGRADATION_SCENARIOS.syncLag
                },
                { 
                  id: "CCFV6DGQITXMVZD3YDIBGZ7KACNPPMQMUK3DRFZJ2EQ4VZBHM2DE36PT", 
                  status: "paused" as const,
                  events: 0 
                }
              ].map((contract) => (
                <div 
                  key={contract.id} 
                  className="flex items-center justify-between p-3 bg-terminal-dark/30 rounded border border-terminal-green/20"
                >
                  <div className="flex items-center gap-3">
                    <ContractHealthBadge 
                      status={contract.status}
                      degradationContext={contract.context}
                      animationContext="contract-list"
                      {...HealthBadgePresets.contractList}
                    />
                    <code className="font-terminal-mono text-sm text-terminal-light">
                      {contract.id.substring(0, 8)}...{contract.id.slice(-8)}
                    </code>
                  </div>
                  <span className="text-xs text-terminal-gray">
                    {contract.events.toLocaleString()} events
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Widget Context */}
          <div className="space-y-3">
            <h4 className="text-sm font-terminal-mono text-terminal-cyan">
              Dashboard Widget
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-terminal-dark/30 rounded border border-terminal-green/20 text-center">
                <ContractHealthBadge 
                  status="healthy" 
                  {...HealthBadgePresets.dashboard}
                  metrics={{ eventCount: 15420 }}
                />
                <div className="mt-2 text-xs text-terminal-gray">
                  Active Contracts: 42
                </div>
              </div>
              <div className="p-4 bg-terminal-dark/30 rounded border border-terminal-warning/20 text-center">
                <ContractHealthBadge 
                  status="degraded" 
                  degradationContext={COMMON_DEGRADATION_SCENARIOS.networkIssues}
                  {...HealthBadgePresets.dashboard}
                  metrics={{ eventCount: 3241 }}
                />
                <div className="mt-2 text-xs text-terminal-gray">
                  Degraded Contracts: 3
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animation Control */}
      <Card>
        <CardHeader>
          <CardTitle className="font-terminal-mono text-terminal-green">
            Animation Control
          </CardTitle>
          <CardDescription>
            Testing animation behavior and performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <ContractHealthBadge 
              status="healthy" 
              label="Animated"
              disableAnimation={false}
            />
            <ContractHealthBadge 
              status="healthy" 
              label="Static"
              disableAnimation={true}
            />
            <ContractHealthBadge 
              status="degraded" 
              label="Animated"
              disableAnimation={false}
            />
            <ContractHealthBadge 
              status="degraded" 
              label="Static"
              disableAnimation={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Color Specifications Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="font-terminal-mono text-terminal-green">
            Color Specifications
          </CardTitle>
          <CardDescription>
            Exact hex values used for each status type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(HEALTH_STATUS_CONFIG).map(([status, config]) => (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-2">
                  <ContractHealthBadge 
                    status={status as ContractHealthStatus}
                    dotOnly
                    size="sm"
                  />
                  <h4 className="font-terminal-mono text-sm capitalize">{status}</h4>
                </div>
                <div className="text-xs font-terminal-mono space-y-1 text-terminal-gray">
                  <div>Primary: {config.colors.primary}</div>
                  <div>Background: {config.colors.background}</div>
                  <div>Border: {config.colors.border}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}