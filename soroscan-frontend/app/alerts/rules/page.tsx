"use client";

import { useMemo, useState } from "react";

type ChannelType = "email" | "slack" | "pagerduty";

interface AlertTemplate {
  id: string;
  name: string;
  eventType: string;
  frequency: "lt" | "gt";
  threshold: number;
  timeWindowMin: number;
}

interface AlertRule {
  id: string;
  name: string;
  eventType: string;
  frequency: "lt" | "gt";
  threshold: number;
  timeWindowMin: number;
  enabled: boolean;
  escalation: ChannelType[];
}

interface NotificationChannel {
  id: string;
  label: string;
  type: ChannelType;
  target: string;
  enabled: boolean;
}

const templates: AlertTemplate[] = [
  {
    id: "tpl-1",
    name: "No events for 10 minutes",
    eventType: "any",
    frequency: "lt",
    threshold: 1,
    timeWindowMin: 10,
  },
  {
    id: "tpl-2",
    name: "Swap surge in 5 minutes",
    eventType: "swap",
    frequency: "gt",
    threshold: 500,
    timeWindowMin: 5,
  },
  {
    id: "tpl-3",
    name: "Burn events missing for 30 minutes",
    eventType: "burn",
    frequency: "lt",
    threshold: 1,
    timeWindowMin: 30,
  },
];

const initialRules: AlertRule[] = [
  {
    id: "rule-1",
    name: "Indexer silent monitor",
    eventType: "any",
    frequency: "lt",
    threshold: 1,
    timeWindowMin: 10,
    enabled: true,
    escalation: ["email", "slack", "pagerduty"],
  },
];

const initialChannels: NotificationChannel[] = [
  {
    id: "channel-1",
    label: "Ops Inbox",
    type: "email",
    target: "ops@soroscan.io",
    enabled: true,
  },
  {
    id: "channel-2",
    label: "On-call Slack",
    type: "slack",
    target: "https://hooks.slack.com/services/T00/B00/XYZ",
    enabled: true,
  },
  {
    id: "channel-3",
    label: "Primary PagerDuty",
    type: "pagerduty",
    target: "service_key_****",
    enabled: true,
  },
];

const history = [
  {
    id: "h-1",
    action: "Rule enabled",
    actor: "sylvia@soroscan.io",
    timestamp: "2026-07-26T09:22:00Z",
  },
  {
    id: "h-2",
    action: "Escalation step added: pagerduty",
    actor: "opsbot@soroscan.io",
    timestamp: "2026-07-26T10:45:00Z",
  },
  {
    id: "h-3",
    action: "Slack channel rotated",
    actor: "aaron@soroscan.io",
    timestamp: "2026-07-27T06:05:00Z",
  },
];

export default function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [channels, setChannels] = useState<NotificationChannel[]>(initialChannels);
  const [name, setName] = useState("No Swap Events - 10m");
  const [eventType, setEventType] = useState("swap");
  const [frequency, setFrequency] = useState<"lt" | "gt">("lt");
  const [threshold, setThreshold] = useState(1);
  const [timeWindowMin, setTimeWindowMin] = useState(10);
  const [steps, setSteps] = useState<ChannelType[]>(["email", "slack", "pagerduty"]);
  const [previewRate] = useState(0.03);

  const previewText = useMemo(() => {
    const comparator = frequency === "lt" ? "<" : ">";
    return `Trigger when ${eventType} events are ${comparator} ${threshold} in ${timeWindowMin} minutes.`;
  }, [eventType, frequency, threshold, timeWindowMin]);

  const addRule = () => {
    setRules((current) => [
      ...current,
      {
        id: `rule-${Date.now()}`,
        name,
        eventType,
        frequency,
        threshold,
        timeWindowMin,
        enabled: true,
        escalation: steps,
      },
    ]);
  };

  const applyTemplate = (template: AlertTemplate) => {
    setName(template.name);
    setEventType(template.eventType);
    setFrequency(template.frequency);
    setThreshold(template.threshold);
    setTimeWindowMin(template.timeWindowMin);
  };

  const toggleStep = (channel: ChannelType) => {
    setSteps((current) => {
      if (current.includes(channel)) {
        return current.filter((step) => step !== channel);
      }
      return [...current, channel];
    });
  };

  const toggleRule = (id: string) => {
    setRules((current) =>
      current.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
      ),
    );
  };

  const toggleChannel = (id: string) => {
    setChannels((current) =>
      current.map((channel) =>
        channel.id === id ? { ...channel, enabled: !channel.enabled } : channel,
      ),
    );
  };

  return (
    <main className="min-h-screen bg-terminal-black p-8 font-terminal-mono text-terminal-green">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs tracking-[0.2em] text-terminal-gray">[ALERT_RULE_BUILDER]</p>
          <h1 className="text-3xl">Alert Rule and Escalation Policy Designer</h1>
          <p className="text-sm text-terminal-gray">
            Build conditional alert rules, chain escalation steps, and validate trigger logic.
          </p>
        </header>

        <section className="rounded border border-terminal-green/20 p-4">
          <h2 className="mb-3 text-sm text-terminal-cyan">Template Library</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template)}
                className="rounded border border-terminal-cyan/30 bg-black/30 p-3 text-left hover:bg-terminal-cyan/10"
              >
                <p className="text-sm text-terminal-cyan">{template.name}</p>
                <p className="mt-1 text-xs text-terminal-gray">
                  {template.eventType} / {template.frequency} {template.threshold} in{" "}
                  {template.timeWindowMin}m
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded border border-terminal-green/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-gray">Visual Rule Editor</h2>
            <div className="space-y-3 text-xs">
              <label className="block text-terminal-gray">
                Rule Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded border border-terminal-green/30 bg-terminal-black px-2 py-2 text-terminal-green"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-terminal-gray">
                  Event Type
                  <select
                    value={eventType}
                    onChange={(event) => setEventType(event.target.value)}
                    className="mt-1 w-full rounded border border-terminal-green/30 bg-terminal-black px-2 py-2 text-terminal-green"
                  >
                    <option value="any">any</option>
                    <option value="swap">swap</option>
                    <option value="mint">mint</option>
                    <option value="burn">burn</option>
                  </select>
                </label>
                <label className="text-terminal-gray">
                  Condition
                  <select
                    value={frequency}
                    onChange={(event) => setFrequency(event.target.value as "lt" | "gt")}
                    className="mt-1 w-full rounded border border-terminal-green/30 bg-terminal-black px-2 py-2 text-terminal-green"
                  >
                    <option value="lt">less than</option>
                    <option value="gt">greater than</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-terminal-gray">
                  Frequency threshold
                  <input
                    type="number"
                    value={threshold}
                    onChange={(event) => setThreshold(Number(event.target.value) || 0)}
                    className="mt-1 w-full rounded border border-terminal-green/30 bg-terminal-black px-2 py-2 text-terminal-green"
                  />
                </label>
                <label className="text-terminal-gray">
                  Time window (minutes)
                  <input
                    type="number"
                    value={timeWindowMin}
                    onChange={(event) => setTimeWindowMin(Number(event.target.value) || 1)}
                    className="mt-1 w-full rounded border border-terminal-green/30 bg-terminal-black px-2 py-2 text-terminal-green"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={addRule}
                className="rounded border border-terminal-green/40 px-3 py-2 text-terminal-green hover:bg-terminal-green/10"
              >
                Save rule
              </button>
            </div>
          </article>

          <article className="rounded border border-terminal-magenta/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-magenta">Escalation Policy Chain</h2>
            <p className="mb-2 text-xs text-terminal-gray">
              Step 1 to 3, notify in sequence if unresolved.
            </p>
            <div className="space-y-2 text-xs">
              {(["email", "slack", "pagerduty"] as ChannelType[]).map((channel, index) => (
                <label
                  key={channel}
                  className="flex items-center justify-between rounded border border-terminal-magenta/30 p-2"
                >
                  <span>
                    step {index + 1}: {channel}
                  </span>
                  <input
                    type="checkbox"
                    checked={steps.includes(channel)}
                    onChange={() => toggleStep(channel)}
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 rounded border border-terminal-cyan/20 bg-terminal-cyan/5 p-3 text-xs">
              <p className="text-terminal-cyan">Rule test preview</p>
              <p className="mt-1">{previewText}</p>
              <p className="mt-1 text-terminal-gray">
                Estimated trigger probability in last 24h: {(previewRate * 100).toFixed(1)}%
              </p>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded border border-terminal-yellow/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-yellow">Notification Channels</h2>
            <div className="space-y-2 text-xs">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between rounded border border-terminal-yellow/20 p-2"
                >
                  <div>
                    <p>{channel.label}</p>
                    <p className="text-terminal-gray">
                      {channel.type}: {channel.target}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleChannel(channel.id)}
                    className={`rounded border px-2 py-1 ${
                      channel.enabled
                        ? "border-terminal-green/40 text-terminal-green"
                        : "border-terminal-gray/40 text-terminal-gray"
                    }`}
                  >
                    {channel.enabled ? "enabled" : "disabled"}
                  </button>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded border border-terminal-cyan/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-cyan">Rule History / Audit Trail</h2>
            <div className="space-y-2 text-xs">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded border border-terminal-cyan/20 bg-black/30 p-2"
                >
                  <p>{entry.action}</p>
                  <p className="text-terminal-gray">
                    {entry.actor} - {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded border border-terminal-green/20 p-4">
          <h2 className="mb-3 text-sm text-terminal-gray">Active Rules</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-terminal-green/10 text-terminal-green">
                <tr>
                  <th className="px-2 py-2">Rule</th>
                  <th className="px-2 py-2">Condition</th>
                  <th className="px-2 py-2">Escalation</th>
                  <th className="px-2 py-2">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-t border-terminal-green/10">
                    <td className="px-2 py-2">{rule.name}</td>
                    <td className="px-2 py-2">
                      {rule.eventType} {rule.frequency} {rule.threshold} in {rule.timeWindowMin}m
                    </td>
                    <td className="px-2 py-2">{rule.escalation.join(" -> ")}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => toggleRule(rule.id)}
                        className={`rounded border px-2 py-1 ${
                          rule.enabled
                            ? "border-terminal-green/40 text-terminal-green"
                            : "border-terminal-gray/40 text-terminal-gray"
                        }`}
                      >
                        {rule.enabled ? "on" : "off"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
