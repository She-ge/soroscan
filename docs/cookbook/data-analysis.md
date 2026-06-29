# Data Analysis Examples

SoroScan is an excellent source of data for analyzing smart contract activity, user behavior, and tokenomics. Below are examples of how to analyze event data using Python and Pandas.

## 1. Time Series Analysis with Pandas

Analyze the frequency of events over time to see when your contract is most active.

```python
import pandas as pd
import requests
import matplotlib.pyplot as plt

# Fetch last 1000 events
url = "https://api.soroscan.com/api/v1/events/?contract_id=CC...123&limit=1000"
events = requests.get(url).json()['results']

# Load into DataFrame
df = pd.DataFrame(events)

# Convert timestamp string to datetime object
df['created_at'] = pd.to_datetime(df['created_at'])

# Set the timestamp as the index
df.set_index('created_at', inplace=True)

# Resample data to count events per hour
events_per_hour = df.resample('H').size()

# Plot the results
events_per_hour.plot(title="Contract Events Per Hour", figsize=(10, 5))
plt.ylabel("Number of Events")
plt.xlabel("Time")
plt.show()
```

## 2. Event Aggregation and Reporting

Calculate total volume or amounts transferred within a token contract.

```python
import pandas as pd
import json

# Assuming `df` is loaded as in the previous example

# Filter for "Transfer" events (assuming topic 0 is 'Transfer')
transfers = df[df['topics'].apply(lambda t: 'Transfer' in t if isinstance(t, list) else False)].copy()

# Extract the 'amount' field from the 'data' JSON string/dict
def extract_amount(data):
    try:
        # Depending on if data is already parsed or a string
        d = data if isinstance(data, dict) else json.loads(data)
        return float(d.get('amount', 0))
    except:
        return 0.0

transfers['amount'] = transfers['data'].apply(extract_amount)

total_volume = transfers['amount'].sum()
print(f"Total Transferred Volume: {total_volume}")

# Group by day
daily_volume = transfers.resample('D')['amount'].sum()
print("\nDaily Volume:")
print(daily_volume)
```

## 3. Trend Detection

Identify moving averages to see macro trends in contract usage.

```python
# Calculate a 7-day moving average of daily event counts
daily_events = df.resample('D').size()
moving_avg = daily_events.rolling(window=7).mean()

# Plot both
plt.figure(figsize=(12, 6))
plt.plot(daily_events.index, daily_events.values, label='Daily Events', alpha=0.5)
plt.plot(moving_avg.index, moving_avg.values, label='7-Day Moving Average', color='red')
plt.title('Contract Activity Trend')
plt.legend()
plt.show()
```

## 4. Comparative Analysis

Compare the activity of two different contracts (e.g., v1 vs v2).

```python
def fetch_daily_counts(contract_id):
    # In practice, you might need pagination to get enough historical data
    url = f"https://api.soroscan.com/api/v1/events/?contract_id={contract_id}&limit=5000"
    df = pd.DataFrame(requests.get(url).json()['results'])
    df['created_at'] = pd.to_datetime(df['created_at'])
    df.set_index('created_at', inplace=True)
    return df.resample('D').size()

v1_counts = fetch_daily_counts("CC_V1_...123")
v2_counts = fetch_daily_counts("CC_V2_...456")

# Combine into one DataFrame for easy plotting
comparison_df = pd.DataFrame({
    'V1 Activity': v1_counts,
    'V2 Activity': v2_counts
}).fillna(0) # Fill days with no events with 0

comparison_df.plot(kind='area', stacked=False, alpha=0.5, figsize=(10, 6))
plt.title("Contract Migration: V1 vs V2 Activity")
plt.ylabel("Events per Day")
plt.show()
```
