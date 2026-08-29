# Advanced Use Cases

This section covers complex patterns for power users and enterprise integrators.

## 1. Multi-Contract Monitoring

When your dApp consists of a constellation of contracts (e.g., a Factory that deploys child contracts), you need to monitor all of them dynamically.

```python
import asyncio
from gql import Client, gql
from gql.transport.websockets import WebsocketsTransport

# Maintain a dynamic list of contracts to monitor
monitored_contracts = set(["FACTORY_CC..."])

transport = WebsocketsTransport(url='ws://localhost:8000/graphql')
client = Client(transport=transport, fetch_schema_from_transport=True)

# GraphQL subscription for multiple contracts
# Note: SoroScan allows omitting contractId to listen to ALL events, 
# which you can then filter locally, OR you can setup multiple subscription tasks.
SUBSCRIPTION = gql('''
  subscription OnAnyEvent {
    eventEmitted {
      id
      contractId
      topics
      data
    }
  }
''')

async def main():
    async for result in client.subscribe(SUBSCRIPTION):
        event = result['eventEmitted']
        contract_id = event['contractId']
        
        # Filter for our contracts
        if contract_id in monitored_contracts:
            print(f"Event from {contract_id}: {event['topics']}")
            
            # If the factory deployed a new contract, add it to our list!
            if 'ContractDeployed' in event['topics']:
                new_contract = event['data']['new_contract_id']
                monitored_contracts.add(new_contract)
                print(f"Added {new_contract} to watchlist!")

asyncio.run(main())
```

## 2. Cross-Chain Event Correlation

If your protocol bridges assets, you can correlate SoroScan events with events from another chain's indexer.

```javascript
const axios = require('axios');

async function checkBridgeStatus(stellarTxHash, ethereumTxHash) {
    // 1. Fetch Soroban Event (Deposit)
    const sorobanRes = await axios.get(`https://api.soroscan.com/api/v1/events/?tx_hash=${stellarTxHash}`);
    const sorobanEvent = sorobanRes.data.results[0];
    
    // 2. Fetch Ethereum Event (Mint) via Etherscan/Alchemy
    const ethRes = await axios.post(`https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY`, {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [ethereumTxHash]
    });
    const ethLogs = ethRes.data.result.logs;
    
    // 3. Correlate
    const depositedAmount = sorobanEvent.data.amount;
    // (Extract minted amount from ethLogs depending on ABI)
    const mintedAmount = parseInt(ethLogs[0].data, 16); 
    
    if (depositedAmount == mintedAmount) {
        console.log("Bridge transaction verified and balanced.");
    } else {
        console.error("Bridge mismatch!", { depositedAmount, mintedAmount });
    }
}
```

## 3. Custom Event Processing Pipeline

For high throughput applications, pass SoroScan data into a Kafka or RabbitMQ queue for distributed processing.

```python
import pika
import requests
import json
import time

# RabbitMQ setup
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()
channel.queue_declare(queue='soroscan_events')

def poll_and_publish():
    last_ledger = 0
    while True:
        try:
            url = f"https://api.soroscan.com/api/v1/events/?min_ledger={last_ledger+1}"
            response = requests.get(url).json()
            
            for event in response.get('results', []):
                # Publish to message queue for microservices to consume
                channel.basic_publish(
                    exchange='',
                    routing_key='soroscan_events',
                    body=json.dumps(event)
                )
                last_ledger = max(last_ledger, int(event['ledger']))
                
        except Exception as e:
            print(f"Polling error: {e}")
            
        time.sleep(2) # Poll every 2 seconds

poll_and_publish()
```

## 4. Batch Operations

Processing large amounts of historical data efficiently using SoroScan's pagination and concurrent requests.

```python
import asyncio
import aiohttp

async def fetch_page(session, url):
    async with session.get(url) as response:
        return await response.json()

async def fetch_all_history(contract_id):
    base_url = f"https://api.soroscan.com/api/v1/events/?contract_id={contract_id}"
    
    async with aiohttp.ClientSession() as session:
        # First request to get total count and first page
        initial_data = await fetch_page(session, base_url)
        all_events = initial_data['results']
        
        # If there are many pages, fetch them concurrently
        # Note: Be mindful of API rate limits!
        tasks = []
        next_url = initial_data.get('next')
        
        # Simplistic sequential fetch for safety, but can be parallelized
        # if you know the total pages and offset structure.
        while next_url:
            data = await fetch_page(session, next_url)
            all_events.extend(data['results'])
            next_url = data.get('next')
            
        return all_events

# Usage
# events = asyncio.run(fetch_all_history("CC..."))
```
