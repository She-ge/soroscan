# Webhook Examples

SoroScan allows you to register webhook endpoints that are triggered whenever specific smart contract events occur. Below are several examples of how to consume these webhooks.

## 1. Discord Webhook Sender

You can use an intermediate server (e.g., Express.js) to receive the SoroScan webhook and format it for Discord.

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN';

app.post('/soroscan-webhook', async (req, res) => {
  const event = req.body;
  
  // Format the message for Discord
  const embed = {
    title: 'New Smart Contract Event',
    color: 0x0099ff,
    fields: [
      { name: 'Contract ID', value: event.contract_id },
      { name: 'Ledger', value: event.ledger.toString(), inline: true },
      { name: 'Data', value: `\`\`\`json\n${JSON.stringify(event.data, null, 2)}\n\`\`\`` }
    ],
    timestamp: new Date().toISOString()
  };

  try {
    await axios.post(DISCORD_WEBHOOK_URL, { embeds: [embed] });
    res.status(200).send('Webhook processed');
  } catch (err) {
    console.error('Discord Webhook Error:', err);
    res.status(500).send('Error');
  }
});

app.listen(3000, () => console.log('Webhook receiver listening on port 3000'));
```

## 2. Email Notification Sender

Send an email when a specific event occurs using SendGrid.

```python
from flask import Flask, request
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    event = request.json
    
    message = Mail(
        from_email='alerts@yourdomain.com',
        to_emails='admin@yourdomain.com',
        subject=f"New Event on {event['contract_id']}",
        html_content=f"<strong>Ledger:</strong> {event['ledger']}<br/><strong>Data:</strong> {event['data']}"
    )
    
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        return 'Success', 200
    except Exception as e:
        print(e)
        return 'Error', 500

if __name__ == '__main__':
    app.run(port=5000)
```

## 3. Database Sync Trigger

If you maintain your own custom database, use webhooks to keep it in sync with the blockchain.

```python
from fastapi import FastAPI, Request
import psycopg2

app = FastAPI()

conn = psycopg2.connect(
    dbname="mydb", user="user", password="password", host="localhost"
)

@app.post("/sync-event")
async def sync_event(request: Request):
    event = await request.json()
    
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO contract_events (contract_id, ledger, data) VALUES (%s, %s, %s)",
        (event['contract_id'], event['ledger'], str(event['data']))
    )
    conn.commit()
    cur.close()
    
    return {"status": "synced"}
```

## 4. External API Call

Triggering an external API based on an on-chain event (e.g., fulfilling an order when payment is received).

```javascript
app.post('/order-payment-webhook', async (req, res) => {
  const event = req.body;
  
  // Verify it's a "PaymentReceived" event
  if (event.topics[0] === 'PaymentReceived') {
    const orderId = event.data.orderId;
    
    // Call your internal fulfillment service
    await axios.post('https://internal-api.com/fulfill', {
      order_id: orderId,
      tx_hash: event.tx_hash
    });
  }
  
  res.sendStatus(200);
});
```

## 5. Retry Logic Implementation

Webhooks can fail due to network issues. Always implement retry logic in your webhook consumers if you plan on fetching additional data.

```python
import time
import requests
from flask import Flask, request

app = Flask(__name__)

def fetch_tx_details_with_retry(tx_hash, retries=3, delay=2):
    for i in range(retries):
        try:
            # Attempt to fetch additional details from SoroScan
            res = requests.get(f"https://api.soroscan.com/api/v1/transactions/{tx_hash}")
            res.raise_for_status()
            return res.json()
        except requests.exceptions.RequestException:
            if i < retries - 1:
                time.sleep(delay)
            else:
                raise

@app.route('/robust-webhook', methods=['POST'])
def webhook():
    event = request.json
    try:
        # If the webhook doesn't contain all info, fetch it
        tx_details = fetch_tx_details_with_retry(event['tx_hash'])
        # Process event...
        return 'OK', 200
    except Exception as e:
        # Return 500 so SoroScan knows to retry sending the webhook
        print(f"Failed to process: {e}")
        return 'Internal Server Error', 500
```
