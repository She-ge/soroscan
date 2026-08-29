# Go SDK

The SoroScan Go SDK provides idiomatic Go bindings for the SoroScan REST and GraphQL APIs.

## Installation

```bash
go get github.com/soroscan/soroscan-go
```

## Authentication

```go
package main

import (
    "context"
    "fmt"

    soroscan "github.com/soroscan/soroscan-go"
)

func main() {
    client := soroscan.NewClient("sk_live_your_key_here")
    ctx := context.Background()

    // Use client...
    _ = ctx
    _ = client
}
```

## Listing Events

```go
package main

import (
    "context"
    "fmt"

    soroscan "github.com/soroscan/soroscan-go"
)

func main() {
    client := soroscan.NewClient("sk_live_...")
    ctx := context.Background()

    events, err := client.Events.List(ctx, &soroscan.EventListOptions{
        ContractID: "CABC...9X4Z",
        Limit:      50,
    })
    if err != nil {
        panic(err)
    }

    for _, event := range events {
        fmt.Printf("Ledger %d: %s\n", event.Ledger, event.EventType)
        fmt.Printf("  Data: %v\n", event.Data)
    }
}
```

## Filtering Events

```go
package main

import (
    "context"
    "fmt"
    "time"

    soroscan "github.com/soroscan/soroscan-go"
)

func main() {
    client := soroscan.NewClient("sk_live_...")
    ctx := context.Background()

    since := time.Now().Add(-24 * time.Hour)

    events, err := client.Events.List(ctx, &soroscan.EventListOptions{
        ContractID: "CABC...9X4Z",
        EventType:  "SWAP_COMPLETE",
        Since:      &since,
        Limit:      100,
    })
    if err != nil {
        panic(err)
    }

    fmt.Printf("Found %d events\n", len(events))
}
```

## Registering a Contract

```go
contract, err := client.Contracts.Create(ctx, &soroscan.ContractCreateInput{
    ContractID: "CABC...9X4Z",
    Label:      "my-amm-contract",
})
if err != nil {
    panic(err)
}
fmt.Printf("Registered: %s\n", contract.ID)
```

## Managing Webhooks

```go
// Create webhook subscription
webhook, err := client.Webhooks.Create(ctx, &soroscan.WebhookCreateInput{
    URL:        "https://your-app.com/webhook",
    EventType:  "SWAP_COMPLETE",
    ContractID: "CABC...9X4Z",
    Secret:     "your-hmac-secret",
})
if err != nil {
    panic(err)
}
fmt.Printf("Webhook ID: %s\n", webhook.ID)

// List webhooks
webhooks, err := client.Webhooks.List(ctx)
if err != nil {
    panic(err)
}
for _, wh := range webhooks {
    fmt.Printf("  %s -> %s\n", wh.ID, wh.URL)
}

// Delete a webhook
err = client.Webhooks.Delete(ctx, "wh_abc123")
if err != nil {
    panic(err)
}
```

## Error Handling

```go
package main

import (
    "context"
    "errors"
    "fmt"

    soroscan "github.com/soroscan/soroscan-go"
)

func main() {
    client := soroscan.NewClient("sk_live_...")
    ctx := context.Background()

    _, err := client.Events.List(ctx, &soroscan.EventListOptions{
        ContractID: "INVALID",
    })

    if err != nil {
        var authErr *soroscan.AuthenticationError
        var rateLimitErr *soroscan.RateLimitError
        var notFoundErr *soroscan.NotFoundError

        switch {
        case errors.As(err, &authErr):
            fmt.Println("Invalid API key")
        case errors.As(err, &rateLimitErr):
            fmt.Printf("Rate limited. Retry after %d seconds\n", rateLimitErr.RetryAfter)
        case errors.As(err, &notFoundErr):
            fmt.Println("Resource not found")
        default:
            fmt.Printf("Unknown error: %v\n", err)
        }
    }
}
```

## HTTP Server Example

```go
package main

import (
    "context"
    "encoding/json"
    "log"
    "net/http"
    "os"

    soroscan "github.com/soroscan/soroscan-go"
)

var client *soroscan.Client

func eventsHandler(w http.ResponseWriter, r *http.Request) {
    contractID := r.URL.Query().Get("contract_id")
    ctx := context.Background()

    events, err := client.Events.List(ctx, &soroscan.EventListOptions{
        ContractID: contractID,
        Limit:      50,
    })
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "events": events,
    })
}

func main() {
    client = soroscan.NewClient(os.Getenv("SOROSCAN_API_KEY"))

    http.HandleFunc("/events", eventsHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

## Configuration

```go
client := soroscan.NewClientWithConfig("sk_live_...", &soroscan.Config{
    BaseURL:    "https://soroscan.io",
    Timeout:    30, // seconds
    MaxRetries: 3,
    RetryDelay: 1, // seconds
})
```
