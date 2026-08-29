# Webhook Signature Verification Guide

This guide covers secure webhook signature verification using Ed25519 cryptography, including signature verification, public key rotation, and replay attack prevention.

## Table of Contents

1. [Overview](#overview)
2. [Ed25519 Signature Verification](#ed25519-signature-verification)
3. [X-Signature Header Format](#x-signature-header-format)
4. [Implementation Examples](#implementation-examples)
   - [Python](#python)
   - [Node.js](#nodejs)
   - [Go](#go)
5. [Public Key Rotation](#public-key-rotation)
6. [Replay Attack Prevention](#replay-attack-prevention)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

SoroScan webhooks use Ed25519 digital signatures to ensure authenticity and integrity of webhook payloads. This cryptographic approach provides:

- **Authenticity**: Verify webhooks originate from SoroScan
- **Integrity**: Ensure payload hasn't been tampered with
- **Non-repudiation**: Cryptographic proof of message origin

### Why Ed25519?

Ed25519 offers several advantages over traditional cryptographic schemes:

- **Performance**: Faster signature generation and verification
- **Security**: Resistance to side-channel attacks
- **Simplicity**: Deterministic signatures with no parameter choices
- **Compact**: Small signature size (64 bytes) and public key size (32 bytes)

## Ed25519 Signature Verification

### Signature Process

1. **Payload Preparation**: Combine timestamp + raw request body
2. **Signature Generation**: Sign the prepared payload using Ed25519 private key
3. **Header Inclusion**: Include signature and timestamp in `X-Signature` header
4. **Verification**: Recipient verifies using Ed25519 public key

### Mathematical Foundation

Ed25519 signatures are based on the Edwards curve:

```
-x² + y² = 1 + dx²y² (mod p)
```

Where `d = -121665/121666` and `p = 2²⁵⁵ - 19`.

## X-Signature Header Format

The `X-Signature` header contains the timestamp and signature in the following format:

```
X-Signature: t=<timestamp>,v1=<signature>
```

### Format Details

- **`t=<timestamp>`**: Unix timestamp when signature was generated
- **`v1=<signature>`**: Base64-encoded Ed25519 signature
- **Separator**: Comma separates timestamp and signature
- **Versioning**: `v1` allows for future signature algorithm upgrades

### Example Header

```
X-Signature: t=1640995200,v1=MEUCIQDxS9PqZjRzKpyMZ8pJdE4X7vZkF3QvNrPqWxYzKjLmNwIhALx8F4EzRyJ2K3vZm8PqWxYzKjLmNwQvNrPqDxS9PqZj
```

## Implementation Examples

### Python

```python
import hmac
import time
import base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.exceptions import InvalidSignature
from typing import Optional

class WebhookVerifier:
    def __init__(self, public_key_base64: str):
        """Initialize verifier with Ed25519 public key."""
        public_key_bytes = base64.b64decode(public_key_base64)
        self.public_key = Ed25519PublicKey.from_public_bytes(public_key_bytes)
        self.tolerance = 300  # 5 minutes tolerance for timestamp
    
    def verify_signature(self, payload: bytes, signature_header: str) -> bool:
        """
        Verify Ed25519 signature from X-Signature header.
        
        Args:
            payload: Raw request body as bytes
            signature_header: Value of X-Signature header
            
        Returns:
            bool: True if signature is valid, False otherwise
        """
        try:
            # Parse signature header
            timestamp, signature = self._parse_signature_header(signature_header)
            
            # Check timestamp to prevent replay attacks
            if not self._is_timestamp_valid(timestamp):
                return False
            
            # Prepare signed payload
            signed_payload = f"{timestamp}.{payload.decode('utf-8')}".encode('utf-8')
            
            # Verify signature
            signature_bytes = base64.b64decode(signature)
            self.public_key.verify(signature_bytes, signed_payload)
            return True
            
        except (ValueError, InvalidSignature, UnicodeDecodeError):
            return False
    
    def _parse_signature_header(self, header: str) -> tuple[int, str]:
        """Parse X-Signature header to extract timestamp and signature."""
        parts = header.split(',')
        timestamp_part = next(p for p in parts if p.startswith('t='))
        signature_part = next(p for p in parts if p.startswith('v1='))
        
        timestamp = int(timestamp_part.split('=')[1])
        signature = signature_part.split('=')[1]
        
        return timestamp, signature
    
    def _is_timestamp_valid(self, timestamp: int) -> bool:
        """Check if timestamp is within acceptable tolerance."""
        current_time = int(time.time())
        return abs(current_time - timestamp) <= self.tolerance

# Usage example
def verify_webhook(request_body: bytes, signature_header: str, public_key: str) -> bool:
    """Verify webhook signature."""
    verifier = WebhookVerifier(public_key)
    return verifier.verify_signature(request_body, signature_header)

# Example usage in Django/Flask
def webhook_endpoint(request):
    signature_header = request.headers.get('X-Signature')
    if not signature_header:
        return HttpResponse(status=401)
    
    public_key = "your_base64_encoded_public_key_here"
    
    if verify_webhook(request.body, signature_header, public_key):
        # Process webhook
        return HttpResponse(status=200)
    else:
        return HttpResponse(status=401)
```

### Node.js

```javascript
const crypto = require('crypto');
const { Buffer } = require('buffer');

class WebhookVerifier {
    constructor(publicKeyBase64, tolerance = 300) {
        this.publicKey = Buffer.from(publicKeyBase64, 'base64');
        this.tolerance = tolerance; // 5 minutes tolerance
    }

    /**
     * Verify Ed25519 signature from X-Signature header
     * @param {Buffer} payload - Raw request body
     * @param {string} signatureHeader - X-Signature header value
     * @returns {boolean} True if signature is valid
     */
    verifySignature(payload, signatureHeader) {
        try {
            const { timestamp, signature } = this.parseSignatureHeader(signatureHeader);
            
            // Check timestamp for replay attack prevention
            if (!this.isTimestampValid(timestamp)) {
                return false;
            }
            
            // Prepare signed payload
            const signedPayload = Buffer.from(`${timestamp}.${payload.toString('utf8')}`);
            
            // Verify Ed25519 signature
            const signatureBytes = Buffer.from(signature, 'base64');
            return crypto.verify(null, signedPayload, this.publicKey, signatureBytes);
            
        } catch (error) {
            console.error('Signature verification failed:', error);
            return false;
        }
    }

    parseSignatureHeader(header) {
        const parts = header.split(',');
        const timestampPart = parts.find(p => p.startsWith('t='));
        const signaturePart = parts.find(p => p.startsWith('v1='));
        
        if (!timestampPart || !signaturePart) {
            throw new Error('Invalid signature header format');
        }
        
        const timestamp = parseInt(timestampPart.split('=')[1]);
        const signature = signaturePart.split('=')[1];
        
        return { timestamp, signature };
    }

    isTimestampValid(timestamp) {
        const currentTime = Math.floor(Date.now() / 1000);
        return Math.abs(currentTime - timestamp) <= this.tolerance;
    }
}

// Usage example with Express.js
const express = require('express');
const app = express();

// Middleware to capture raw body
app.use('/webhook', express.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {
    const signatureHeader = req.headers['x-signature'];
    if (!signatureHeader) {
        return res.status(401).send('Missing signature header');
    }
    
    const publicKey = process.env.SOROSCAN_PUBLIC_KEY; // Base64 encoded
    const verifier = new WebhookVerifier(publicKey);
    
    if (verifier.verifySignature(req.body, signatureHeader)) {
        // Process webhook
        console.log('Webhook verified successfully');
        res.status(200).send('OK');
    } else {
        console.error('Webhook verification failed');
        res.status(401).send('Invalid signature');
    }
});

module.exports = { WebhookVerifier };
```

### Go

```go
package webhook

import (
    "crypto/ed25519"
    "encoding/base64"
    "fmt"
    "strconv"
    "strings"
    "time"
)

// WebhookVerifier handles Ed25519 signature verification
type WebhookVerifier struct {
    publicKey ed25519.PublicKey
    tolerance time.Duration
}

// NewWebhookVerifier creates a new verifier with Ed25519 public key
func NewWebhookVerifier(publicKeyBase64 string) (*WebhookVerifier, error) {
    publicKeyBytes, err := base64.StdEncoding.DecodeString(publicKeyBase64)
    if err != nil {
        return nil, fmt.Errorf("invalid public key format: %w", err)
    }
    
    if len(publicKeyBytes) != ed25519.PublicKeySize {
        return nil, fmt.Errorf("invalid public key size: expected %d, got %d", 
            ed25519.PublicKeySize, len(publicKeyBytes))
    }
    
    return &WebhookVerifier{
        publicKey: ed25519.PublicKey(publicKeyBytes),
        tolerance: 5 * time.Minute,
    }, nil
}

// VerifySignature verifies Ed25519 signature from X-Signature header
func (v *WebhookVerifier) VerifySignature(payload []byte, signatureHeader string) error {
    // Parse signature header
    timestamp, signature, err := v.parseSignatureHeader(signatureHeader)
    if err != nil {
        return fmt.Errorf("failed to parse signature header: %w", err)
    }
    
    // Check timestamp for replay attack prevention
    if err := v.validateTimestamp(timestamp); err != nil {
        return fmt.Errorf("timestamp validation failed: %w", err)
    }
    
    // Prepare signed payload
    signedPayload := fmt.Sprintf("%d.%s", timestamp, string(payload))
    
    // Decode signature
    signatureBytes, err := base64.StdEncoding.DecodeString(signature)
    if err != nil {
        return fmt.Errorf("invalid signature encoding: %w", err)
    }
    
    // Verify Ed25519 signature
    if !ed25519.Verify(v.publicKey, []byte(signedPayload), signatureBytes) {
        return fmt.Errorf("signature verification failed")
    }
    
    return nil
}

func (v *WebhookVerifier) parseSignatureHeader(header string) (int64, string, error) {
    parts := strings.Split(header, ",")
    
    var timestamp int64
    var signature string
    
    for _, part := range parts {
        if strings.HasPrefix(part, "t=") {
            ts, err := strconv.ParseInt(strings.TrimPrefix(part, "t="), 10, 64)
            if err != nil {
                return 0, "", fmt.Errorf("invalid timestamp: %w", err)
            }
            timestamp = ts
        } else if strings.HasPrefix(part, "v1=") {
            signature = strings.TrimPrefix(part, "v1=")
        }
    }
    
    if timestamp == 0 || signature == "" {
        return 0, "", fmt.Errorf("missing timestamp or signature in header")
    }
    
    return timestamp, signature, nil
}

func (v *WebhookVerifier) validateTimestamp(timestamp int64) error {
    currentTime := time.Now().Unix()
    if abs(currentTime-timestamp) > int64(v.tolerance.Seconds()) {
        return fmt.Errorf("timestamp outside tolerance window")
    }
    return nil
}

func abs(x int64) int64 {
    if x < 0 {
        return -x
    }
    return x
}

// Example HTTP handler
func WebhookHandler(verifier *WebhookVerifier) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        signatureHeader := r.Header.Get("X-Signature")
        if signatureHeader == "" {
            http.Error(w, "Missing signature header", http.StatusUnauthorized)
            return
        }
        
        body, err := io.ReadAll(r.Body)
        if err != nil {
            http.Error(w, "Failed to read body", http.StatusBadRequest)
            return
        }
        
        if err := verifier.VerifySignature(body, signatureHeader); err != nil {
            log.Printf("Webhook verification failed: %v", err)
            http.Error(w, "Invalid signature", http.StatusUnauthorized)
            return
        }
        
        // Process webhook
        log.Println("Webhook verified successfully")
        w.WriteHeader(http.StatusOK)
    }
}
```

## Public Key Rotation

### Key Rotation Strategy

Public key rotation is essential for long-term security. SoroScan implements a graceful key rotation process:

1. **Dual Key Period**: Both old and new keys are valid during transition
2. **Gradual Migration**: New webhooks use new key, old webhooks remain valid
3. **Deprecation Notice**: Advance notification before old key expiration
4. **Automatic Cleanup**: Old keys automatically expire after grace period

### Implementation

```python
class MultiKeyVerifier:
    def __init__(self, primary_key: str, fallback_keys: list[str] = None):
        self.primary_key = Ed25519PublicKey.from_public_bytes(
            base64.b64decode(primary_key)
        )
        self.fallback_keys = []
        
        if fallback_keys:
            for key in fallback_keys:
                key_bytes = base64.b64decode(key)
                self.fallback_keys.append(
                    Ed25519PublicKey.from_public_bytes(key_bytes)
                )
    
    def verify_with_rotation(self, payload: bytes, signature_header: str) -> bool:
        """Verify signature with primary key first, then fallback keys."""
        # Try primary key first
        if self._verify_with_key(self.primary_key, payload, signature_header):
            return True
        
        # Try fallback keys
        for key in self.fallback_keys:
            if self._verify_with_key(key, payload, signature_header):
                return True
        
        return False
```

### Key Rotation Timeline

| Phase | Duration | Primary Key | Fallback Keys | Actions |
|-------|----------|-------------|---------------|---------|
| **Pre-rotation** | Ongoing | `key_v1` | None | Normal operations |
| **Rotation Start** | Day 0 | `key_v2` | `key_v1` | Deploy new key support |
| **Transition** | 30 days | `key_v2` | `key_v1` | Monitor both keys |
| **Deprecation** | Day 30+ | `key_v2` | None | Remove old key support |

### Key Management API

```bash
# Get current public keys
curl -X GET https://api.soroscan.io/v1/webhook/keys

# Response includes active and upcoming keys
{
  "active": {
    "key_id": "v2_2024_01",
    "public_key": "base64_encoded_key",
    "created_at": "2024-01-01T00:00:00Z",
    "expires_at": null
  },
  "upcoming": {
    "key_id": "v3_2024_07",
    "public_key": "base64_encoded_key", 
    "active_at": "2024-07-01T00:00:00Z"
  },
  "deprecated": [
    {
      "key_id": "v1_2023_01",
      "expires_at": "2024-02-01T00:00:00Z"
    }
  ]
}
```

## Replay Attack Prevention

### Timestamp Validation

Replay attacks are prevented by validating the timestamp in webhook signatures:

```python
def prevent_replay_attacks(timestamp: int, tolerance: int = 300) -> bool:
    """
    Prevent replay attacks by validating timestamp.
    
    Args:
        timestamp: Unix timestamp from signature
        tolerance: Maximum age in seconds (default 5 minutes)
    
    Returns:
        bool: True if timestamp is within tolerance
    """
    current_time = int(time.time())
    age = abs(current_time - timestamp)
    
    return age <= tolerance
```

### Nonce Tracking (Optional)

For high-security environments, implement nonce tracking:

```python
import redis
from typing import Set

class NonceTracker:
    def __init__(self, redis_client: redis.Redis, ttl: int = 3600):
        self.redis = redis_client
        self.ttl = ttl  # 1 hour TTL for nonces
    
    def is_nonce_used(self, nonce: str) -> bool:
        """Check if nonce has been used before."""
        return self.redis.exists(f"webhook_nonce:{nonce}")
    
    def mark_nonce_used(self, nonce: str) -> None:
        """Mark nonce as used with TTL."""
        self.redis.setex(f"webhook_nonce:{nonce}", self.ttl, "1")
    
    def verify_unique_nonce(self, nonce: str) -> bool:
        """Atomically check and mark nonce."""
        with self.redis.pipeline() as pipe:
            while True:
                try:
                    pipe.watch(f"webhook_nonce:{nonce}")
                    if pipe.exists(f"webhook_nonce:{nonce}"):
                        return False  # Nonce already used
                    
                    pipe.multi()
                    pipe.setex(f"webhook_nonce:{nonce}", self.ttl, "1")
                    pipe.execute()
                    return True  # Nonce is unique and now marked
                except redis.WatchError:
                    continue  # Retry on concurrent modification
```

### Advanced Replay Prevention

```python
class AdvancedReplayPrevention:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.window_size = 300  # 5 minutes
        self.max_requests = 100  # Max requests per window per endpoint
    
    def check_rate_limit(self, endpoint: str, timestamp: int) -> bool:
        """Implement sliding window rate limiting."""
        window_start = timestamp - self.window_size
        key = f"rate_limit:{endpoint}:{timestamp // self.window_size}"
        
        # Clean old entries
        self.redis.zremrangebyscore(key, 0, window_start)
        
        # Count requests in current window
        request_count = self.redis.zcard(key)
        
        if request_count >= self.max_requests:
            return False
        
        # Add current request
        self.redis.zadd(key, {timestamp: timestamp})
        self.redis.expire(key, self.window_size * 2)  # Cleanup old windows
        
        return True
```

## Security Best Practices

### 1. Secure Key Storage

```bash
# Environment variables (recommended)
export SOROSCAN_WEBHOOK_PUBLIC_KEY="base64_encoded_key"

# Azure Key Vault
az keyvault secret show --vault-name "mykeyvault" --name "webhook-public-key"

# AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id "webhook/public-key"

# Kubernetes secrets
kubectl create secret generic webhook-keys --from-literal=public-key="base64_key"
```

### 2. Network Security

```yaml
# nginx.conf - Webhook endpoint protection
location /webhook {
    # Rate limiting
    limit_req zone=webhook_limit burst=10 nodelay;
    
    # IP whitelisting (SoroScan IPs)
    allow 203.0.113.0/24;
    allow 198.51.100.0/24;
    deny all;
    
    # Headers security
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    
    proxy_pass http://backend;
}
```

### 3. Logging and Monitoring

```python
import logging
import structlog

logger = structlog.get_logger()

def log_webhook_attempt(
    signature_valid: bool,
    timestamp: int,
    endpoint: str,
    ip_address: str
):
    """Log webhook verification attempts for security monitoring."""
    logger.info(
        "webhook_verification",
        signature_valid=signature_valid,
        timestamp=timestamp,
        endpoint=endpoint,
        client_ip=ip_address,
        timestamp_age=int(time.time()) - timestamp
    )
    
    if not signature_valid:
        logger.warning(
            "webhook_verification_failed",
            endpoint=endpoint,
            client_ip=ip_address,
            potential_attack=True
        )
```

### 4. Error Handling

```python
class WebhookSecurityError(Exception):
    """Base exception for webhook security issues."""
    pass

class InvalidSignatureError(WebhookSecurityError):
    """Raised when signature verification fails."""
    pass

class ReplayAttackError(WebhookSecurityError):
    """Raised when replay attack is detected."""
    pass

class RateLimitExceededError(WebhookSecurityError):
    """Raised when rate limit is exceeded."""
    pass

def secure_webhook_handler(payload: bytes, headers: dict) -> dict:
    """Secure webhook handler with comprehensive error handling."""
    try:
        signature_header = headers.get('X-Signature')
        if not signature_header:
            raise WebhookSecurityError("Missing signature header")
        
        verifier = WebhookVerifier(get_public_key())
        
        if not verifier.verify_signature(payload, signature_header):
            raise InvalidSignatureError("Signature verification failed")
        
        return {"status": "success", "message": "Webhook processed"}
        
    except InvalidSignatureError as e:
        logger.error("Invalid webhook signature", error=str(e))
        raise
    except ReplayAttackError as e:
        logger.error("Replay attack detected", error=str(e))
        raise
    except Exception as e:
        logger.error("Unexpected webhook error", error=str(e))
        raise WebhookSecurityError("Internal security error")
```

### 5. Testing Security

```python
import pytest
from unittest.mock import patch

class TestWebhookSecurity:
    def test_valid_signature(self):
        """Test valid signature verification."""
        verifier = WebhookVerifier(TEST_PUBLIC_KEY)
        payload = b'{"event": "test"}'
        signature = generate_test_signature(payload)
        
        assert verifier.verify_signature(payload, signature)
    
    def test_invalid_signature(self):
        """Test invalid signature rejection."""
        verifier = WebhookVerifier(TEST_PUBLIC_KEY)
        payload = b'{"event": "test"}'
        invalid_signature = "t=1640995200,v1=invalid_signature"
        
        assert not verifier.verify_signature(payload, invalid_signature)
    
    def test_timestamp_too_old(self):
        """Test replay attack prevention."""
        verifier = WebhookVerifier(TEST_PUBLIC_KEY)
        payload = b'{"event": "test"}'
        
        # Create signature with old timestamp
        old_timestamp = int(time.time()) - 3600  # 1 hour ago
        signature = f"t={old_timestamp},v1={generate_signature(payload, old_timestamp)}"
        
        assert not verifier.verify_signature(payload, signature)
    
    def test_malformed_header(self):
        """Test malformed header handling."""
        verifier = WebhookVerifier(TEST_PUBLIC_KEY)
        payload = b'{"event": "test"}'
        
        malformed_headers = [
            "",  # Empty header
            "invalid_format",  # No equals sign
            "t=abc,v1=signature",  # Invalid timestamp
            "t=1640995200",  # Missing signature
            "v1=signature",  # Missing timestamp
        ]
        
        for header in malformed_headers:
            assert not verifier.verify_signature(payload, header)
```

## Troubleshooting

### Common Issues

#### 1. Signature Verification Fails

**Symptoms**: All webhook requests return 401 Unauthorized

**Possible Causes**:
- Incorrect public key
- Wrong signature format
- Payload modification (content-encoding, etc.)
- Clock skew between servers

**Solutions**:
```python
# Debug signature verification
def debug_signature_verification(payload, signature_header, public_key):
    print(f"Payload length: {len(payload)}")
    print(f"Payload (first 100 chars): {payload[:100]}")
    print(f"Signature header: {signature_header}")
    
    try:
        timestamp, signature = parse_signature_header(signature_header)
        print(f"Extracted timestamp: {timestamp}")
        print(f"Current timestamp: {int(time.time())}")
        print(f"Time difference: {abs(int(time.time()) - timestamp)} seconds")
        
        # Verify each step
        signed_payload = f"{timestamp}.{payload.decode('utf-8')}"
        print(f"Signed payload: {signed_payload}")
        
    except Exception as e:
        print(f"Parsing error: {e}")
```

#### 2. Timestamp Issues

**Symptoms**: Intermittent 401 errors, especially during high load

**Possible Causes**:
- Server clock drift
- Network delays
- Timezone issues

**Solutions**:
```bash
# Check system clock synchronization
ntpq -p  # Linux/Mac
w32tm /query /status  # Windows

# Increase timestamp tolerance temporarily
verifier = WebhookVerifier(public_key)
verifier.tolerance = 600  # 10 minutes for debugging
```

#### 3. Key Rotation Issues

**Symptoms**: Webhooks fail after key rotation announcement

**Possible Causes**:
- Using deprecated key
- Not implementing fallback key support
- Cache not updated

**Solutions**:
```python
# Implement key refresh mechanism
class AutoRefreshVerifier:
    def __init__(self, key_endpoint: str):
        self.key_endpoint = key_endpoint
        self.keys_cache = {}
        self.cache_expiry = 0
    
    def get_current_keys(self):
        current_time = time.time()
        if current_time > self.cache_expiry:
            # Refresh keys from API
            response = requests.get(self.key_endpoint)
            self.keys_cache = response.json()
            self.cache_expiry = current_time + 3600  # 1 hour cache
        
        return self.keys_cache
```

### Performance Optimization

#### 1. Signature Verification Caching

```python
from functools import lru_cache

class OptimizedVerifier:
    @lru_cache(maxsize=1000)
    def verify_cached_signature(self, payload_hash: str, signature_header: str) -> bool:
        """Cache signature verification results for identical payloads."""
        # Note: Only cache for identical payload hashes to ensure security
        payload = self.get_payload_from_hash(payload_hash)
        return self.verify_signature(payload, signature_header)
```

#### 2. Async Verification

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

class AsyncWebhookVerifier:
    def __init__(self, public_key: str, max_workers: int = 10):
        self.verifier = WebhookVerifier(public_key)
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
    
    async def verify_signature_async(self, payload: bytes, signature_header: str) -> bool:
        """Perform signature verification asynchronously."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self.verifier.verify_signature,
            payload,
            signature_header
        )
```

### Monitoring and Alerting

```python
# Metrics collection for monitoring
from prometheus_client import Counter, Histogram, Gauge

webhook_requests_total = Counter(
    'webhook_requests_total',
    'Total webhook requests',
    ['endpoint', 'status']
)

webhook_verification_duration = Histogram(
    'webhook_verification_duration_seconds',
    'Time spent verifying webhook signatures'
)

webhook_timestamp_age = Histogram(
    'webhook_timestamp_age_seconds',
    'Age of webhook timestamps'
)

def monitored_verification(payload: bytes, signature_header: str) -> bool:
    """Webhook verification with monitoring."""
    start_time = time.time()
    
    try:
        result = verifier.verify_signature(payload, signature_header)
        
        # Record metrics
        status = 'success' if result else 'invalid_signature'
        webhook_requests_total.labels(endpoint='/webhook', status=status).inc()
        
        # Record timestamp age
        timestamp, _ = parse_signature_header(signature_header)
        age = abs(time.time() - timestamp)
        webhook_timestamp_age.observe(age)
        
        return result
        
    finally:
        duration = time.time() - start_time
        webhook_verification_duration.observe(duration)
```

---

## Additional Resources

- [Ed25519 RFC 8032](https://tools.ietf.org/html/rfc8032)
- [SoroScan Webhook API Documentation](../api-reference/webhooks.md)
- [Security Best Practices Guide](./index.md)
- [Incident Response Playbook](../troubleshooting/security-incidents.md)

---

**Last Updated**: August 27, 2026  
**Version**: 1.0  
**Maintained by**: SoroScan Security Team