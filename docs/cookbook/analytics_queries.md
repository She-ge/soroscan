# Tutorial: Building Custom Event Analytics Queries

This tutorial guides you through constructing complex GraphQL queries in SoroScan to analyze smart contract event activity and transaction volumes over time.

---

## 1. Querying Event Timelines (Hourly / Daily Volume)

The `eventTimeline` query lets you slice event emission history into standard time buckets. This is extremely useful for generating volume charts.

### GraphQL Query Example
The following query retrieves the count of events in 1-hour buckets for a specific contract between a starting and ending timestamp:

```graphql
query GetHourlyEventVolume(
  $contractId: String!
  $since: DateTime!
  $until: DateTime!
) {
  eventTimeline(
    contractId: $contractId
    bucketSize: ONE_HOUR
    since: $since
    until: $until
    timezone: "UTC"
  ) {
    contractId
    bucketSize
    since
    until
    totalEvents
    groups {
      start
      end
      eventCount
      eventTypeCounts {
        eventType
        count
      }
    }
  }
}
```

### Query Variables
```json
{
  "contractId": "CC...your_contract_id...",
  "since": "2026-08-01T00:00:00Z",
  "until": "2026-08-02T00:00:00Z"
}
```

### Supported Bucket Sizes
The `bucketSize` parameter supports:
* `FIVE_MINUTES`
* `THIRTY_MINUTES`
* `ONE_HOUR`
* `ONE_DAY`

---

## 2. Finding Top Active Contracts

You can identify your organization's or the system's most active smart contracts by fetching all tracked contracts and requesting their total indexed `eventCount`.

### GraphQL Query Example
```graphql
query ListContractsWithEventVolume {
  contracts(isActive: true) {
    contractId
    name
    alias
    eventCount
    lastEventAt
  }
}
```

### Client-Side Ranking (TypeScript Example)
Once you receive the payload, sort the contracts in descending order to render a "Top Contracts" dashboard widget:

```typescript
interface Contract {
  contractId: string;
  name: string;
  alias: string;
  eventCount: number;
  lastEventAt: string;
}

function getTopContracts(contracts: Contract[], limit = 5): Contract[] {
  return [...contracts]
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, limit);
}
```

---

## 3. Advanced Filtering & Sorting Parameters

When building dashboards, you often need to filter event lists by transaction ranges or timeframes. Use the `events` query:

```graphql
query FilterAndPaginateEvents(
  $contractId: String
  $since: DateTime
  $until: DateTime
  $fromLedger: Int
  $toLedger: Int
) {
  events(
    contractId: $contractId
    since: $since
    until: $until
    fromLedger: $fromLedger
    toLedger: $toLedger
    first: 25
  ) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        id
        eventType
        ledger
        timestamp
        txHash
        payload
      }
    }
  }
}
```

### Validation Constraints
* **Ledger Ranges**: If you provide `fromLedger` or `toLedger`, **both must be provided**. Also, `fromLedger` must be less than or equal to `toLedger`.

---

## 4. Formatting Response Data for Frontend Charts

Most graphing libraries (such as Recharts, Chart.js, or Nivo) require a flat array of objects as their input. Here is how to format the `eventTimeline` response in JavaScript:

```javascript
// Sample raw GraphQL response
const graphQLResponse = {
  data: {
    eventTimeline: {
      groups: [
        {
          start: "2026-08-01T00:00:00Z",
          eventCount: 42,
          eventTypeCounts: [
            { eventType: "transfer", count: 30 },
            { eventType: "swap", count: 12 }
          ]
        },
        {
          start: "2026-08-01T01:00:00Z",
          eventCount: 88,
          eventTypeCounts: [
            { eventType: "transfer", count: 70 },
            { eventType: "swap", count: 18 }
          ]
        }
      ]
    }
  }
};

// Formatter function for Recharts / Chart.js
function formatTimelineForCharts(timelineGroups) {
  return timelineGroups.map(group => {
    // Basic formatting: format timestamp to a friendly local time
    const timeLabel = new Date(group.start).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create a flat data object
    const chartNode = {
      name: timeLabel,
      total: group.eventCount,
    };

    // Flatten event type distributions
    group.eventTypeCounts.forEach(item => {
      chartNode[item.eventType] = item.count;
    });

    return chartNode;
  });
}

const chartData = formatTimelineForCharts(graphQLResponse.data.eventTimeline.groups);
console.log(chartData);
/*
Output:
[
  { name: "12:00 AM", total: 42, transfer: 30, swap: 12 },
  { name: "01:00 AM", total: 88, transfer: 70, swap: 18 }
]
*/
```

This structured output can be directly passed to a `<LineChart>` or `<BarChart>` component:
```jsx
// Example using Recharts
<BarChart data={chartData}>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="transfer" fill="#8884d8" stackId="a" />
  <Bar dataKey="swap" fill="#82ca9d" stackId="a" />
</BarChart>
```
