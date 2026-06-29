# Integration Examples

This section provides complete, real-world integration examples for SoroScan.

## 1. Build a Real-Time Event Dashboard

Using React and SoroScan's GraphQL subscriptions, you can build a real-time event dashboard for your smart contract.

### Setup (React + Apollo Client)
```tsx
import { ApolloClient, InMemoryCache, ApolloProvider, useSubscription, gql } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:8000/graphql',
}));

const client = new ApolloClient({
  link: wsLink,
  cache: new InMemoryCache()
});

const EVENT_SUBSCRIPTION = gql`
  subscription OnNewEvent($contractId: String!) {
    eventEmitted(contractId: $contractId) {
      id
      contractId
      topics
      data
      ledger
    }
  }
`;

function EventDashboard({ contractId }) {
  const { data, loading } = useSubscription(EVENT_SUBSCRIPTION, { variables: { contractId }});

  if (loading) return <p>Waiting for events...</p>;

  return (
    <div>
      <h3>New Event: {data.eventEmitted.id}</h3>
      <pre>{JSON.stringify(data.eventEmitted, null, 2)}</pre>
    </div>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <EventDashboard contractId="CC...123" />
    </ApolloProvider>
  );
}
```

## 2. Send Slack Notifications for Events

You can use a simple Node.js script to poll SoroScan and post alerts to Slack.

```javascript
const axios = require('axios');

const SOROSCAN_API = 'https://api.soroscan.com/api/v1/events/';
const SLACK_WEBHOOK = 'https://hooks.slack.com/services/T000/B000/XXXX';
const CONTRACT_ID = 'CC...123';

async function checkEvents(lastLedger) {
  try {
    const response = await axios.get(`${SOROSCAN_API}?contract_id=${CONTRACT_ID}&min_ledger=${lastLedger}`);
    const events = response.data.results;
    
    for (const event of events) {
      await axios.post(SLACK_WEBHOOK, {
        text: `🚨 *New Contract Event!* \nContract: ${event.contract_id}\nLedger: ${event.ledger}\nData: ${JSON.stringify(event.data)}`
      });
    }
    
    return events.length > 0 ? events[0].ledger + 1 : lastLedger;
  } catch (error) {
    console.error("Error fetching events:", error);
    return lastLedger;
  }
}

// Poll every 10 seconds
let currentLedger = 100000;
setInterval(async () => {
  currentLedger = await checkEvents(currentLedger);
}, 10000);
```

## 3. Export Events to Data Warehouse (Snowflake / BigQuery)

Using Python, you can fetch historical events in batches and upload them to a data warehouse like BigQuery.

```python
import requests
import pandas as pd
from google.cloud import bigquery

client = bigquery.Client()
table_id = "your-project.soroscan.contract_events"

def export_events(contract_id):
    url = f"https://api.soroscan.com/api/v1/events/?contract_id={contract_id}&limit=100"
    all_events = []
    
    while url:
        response = requests.get(url).json()
        all_events.extend(response['results'])
        url = response.get('next') # Handle pagination
        
    df = pd.DataFrame(all_events)
    # Perform minor data cleaning if necessary
    df['data'] = df['data'].astype(str)
    
    # Load to BigQuery
    job = client.load_table_from_dataframe(df, table_id)
    job.result()
    print(f"Loaded {len(df)} rows to BigQuery.")

export_events("CC...123")
```

## 4. Build a BI Dashboard with Metabase

SoroScan stores its data in PostgreSQL. You can connect Metabase directly to the SoroScan read-replica to build dashboards.

1. Install Metabase via Docker: `docker run -d -p 3000:3000 --name metabase metabase/metabase`
2. Go to `localhost:3000` and setup your admin account.
3. Add a Database connection:
   * **Database type**: PostgreSQL
   * **Host**: `localhost` (or your SoroScan Postgres host)
   * **Port**: `5432`
   * **Database name**: `soroscan`
   * **Username**: `soroscan_user`
4. Write SQL queries directly in Metabase:
```sql
SELECT
  date_trunc('day', created_at) AS day,
  count(*) AS event_count
FROM ingest_eventrecord
WHERE contract_id = 'CC...123'
GROUP BY 1
ORDER BY 1 ASC;
```

## 5. Monitor Contract Activity

A Python snippet to monitor overall contract activity rates (events per minute).

```python
import requests
from datetime import datetime, timedelta

def get_activity_rate(contract_id, minutes=60):
    start_time = (datetime.utcnow() - timedelta(minutes=minutes)).isoformat() + 'Z'
    url = f"https://api.soroscan.com/api/v1/events/?contract_id={contract_id}&created_after={start_time}"
    
    response = requests.get(url).json()
    total_events = response['count']
    
    print(f"Contract {contract_id} had {total_events} events in the last {minutes} minutes.")
    print(f"Activity Rate: {total_events / minutes:.2f} events/min")

get_activity_rate("CC...123")
```

## 6. Alert on Anomalies

Monitor for unusual behavior, such as an event type occurring much more frequently than normal.

```python
import requests
import numpy as np

def check_anomalies(contract_id):
    # Fetch last 1000 events
    url = f"https://api.soroscan.com/api/v1/events/?contract_id={contract_id}&limit=1000"
    events = requests.get(url).json()['results']
    
    # Count occurrences of each topic
    topic_counts = {}
    for event in events:
        topic = str(event['topics'])
        topic_counts[topic] = topic_counts.get(topic, 0) + 1
        
    counts = list(topic_counts.values())
    mean = np.mean(counts)
    std_dev = np.std(counts)
    
    # Alert if any topic count is 3 standard deviations above the mean
    for topic, count in topic_counts.items():
        if count > mean + (3 * std_dev):
            print(f"🚨 ANOMALY DETECTED: Topic {topic} occurred {count} times! Expected ~{mean:.1f}")

check_anomalies("CC...123")
```
