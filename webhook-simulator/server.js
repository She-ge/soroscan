const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const url = require('url');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/api/send-webhook', async (req, res) => {
  const { targetUrl, payload, secret, signatureAlgorithm = 'sha256' } = req.body;

  if (!targetUrl || !payload) {
    return res.status(400).json({ error: 'Missing targetUrl or payload' });
  }

  try {
    const payloadBytes = Buffer.from(JSON.stringify(payload, sortKeys), 'utf-8');
    let signature = null;

    if (secret) {
      const digestmod = signatureAlgorithm === 'sha1' ? crypto.createHash('sha1') : crypto.createHash('sha256');
      const hmac = crypto.createHmac(signatureAlgorithm === 'sha1' ? 'sha1' : 'sha256', secret);
      hmac.update(payloadBytes);
      signature = `${signatureAlgorithm}=${hmac.digest('hex')}`;
    }

    const options = url.parse(targetUrl);
    options.method = 'POST';
    options.headers = {
      'Content-Type': 'application/json',
      'Content-Length': payloadBytes.length,
    };

    if (signature) {
      options.headers['X-SoroScan-Signature'] = signature;
    }
    options.headers['X-SoroScan-Timestamp'] = new Date().toISOString();

    const result = await sendRequest(options, payloadBytes);

    res.json({
      success: true,
      status: result.statusCode,
      statusText: result.statusText,
      headers: result.headers,
      body: result.body,
      time: result.time,
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
});

function sortKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  } else if (obj && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((result, key) => {
      result[key] = sortKeys(obj[key]);
      return result;
    }, {});
  }
  return obj;
}

function sendRequest(options, data) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const client = options.protocol === 'https:' ? https : http;

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        const endTime = Date.now();
        resolve({
          statusCode: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          body: body,
          time: endTime - startTime,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

app.listen(PORT, () => {
  console.log(`Webhook simulator running on http://localhost:${PORT}`);
});
