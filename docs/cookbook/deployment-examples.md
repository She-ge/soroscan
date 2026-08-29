# Deployment Examples

Once you have built your SoroScan integration or webhook consumer, you need to deploy it. Here are some quick examples for common platforms.

## 1. Deploy Webhook Receiver on AWS Lambda

AWS Lambda is perfect for handling infrequent webhooks without paying for an always-on server.

**handler.py (Using AWS Chalice or Serverless Framework)**

```python
import json
import urllib.request
import os

def lambda_handler(event, context):
    # Parse the incoming webhook from SoroScan
    body = json.loads(event['body'])
    
    contract_id = body.get('contract_id')
    event_data = body.get('data')
    
    # Example: Forward to an internal service
    print(f"Received event for {contract_id}")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Webhook processed successfully!')
    }
```

*Deploy using the Serverless framework:*
```yaml
# serverless.yml
service: soroscan-webhook
provider:
  name: aws
  runtime: python3.9
functions:
  receiveWebhook:
    handler: handler.lambda_handler
    events:
      - http:
          path: webhook
          method: post
```

## 2. Deploy on Railway / Render / Heroku

If you have a Node.js express app acting as a real-time dashboard or webhook receiver, deploying on PaaS platforms is trivial.

**package.json**
```json
{
  "name": "soroscan-consumer",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

**index.js**
```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  console.log("Event received:", req.body);
  res.sendStatus(200);
});

// Port is injected by the PaaS provider
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
```
*Push to GitHub and link the repository in Railway/Render. It will automatically detect the Node environment and start the app.*

## 3. Docker Compose Example

For self-hosted deployments containing a webhook receiver, database, and a frontend dashboard.

**docker-compose.yml**
```yaml
version: '3.8'

services:
  webhook-receiver:
    build: ./receiver
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/events
    depends_on:
      - db

  dashboard:
    build: ./dashboard
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://webhook-receiver:8080

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: events
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

## 4. Google Cloud Functions (Python)

Similar to AWS Lambda, GCP functions are great for serverless webhook handling.

**main.py**
```python
import functions_framework

@functions_framework.http
def soroscan_webhook(request):
    """HTTP Cloud Function."""
    request_json = request.get_json(silent=True)
    
    if request_json and 'contract_id' in request_json:
        # Process the event
        print(f"Processing event for contract {request_json['contract_id']}")
        return 'Success', 200
    else:
        return 'Bad Request', 400
```

**requirements.txt**
```text
functions-framework==3.4.0
```

*Deploy command:*
```bash
gcloud functions deploy soroscan_webhook \
--runtime python310 \
--trigger-http \
--allow-unauthenticated
```
