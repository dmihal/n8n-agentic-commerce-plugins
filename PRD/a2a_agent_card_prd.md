**Product Requirements Document (PRD)**\
**Feature:** A2A Agent Card Node for n8n\
**Purpose:** Generate and serve a compliant A2A Agent Card JSON when attached to a Webhook Trigger.

---

### 1. Overview

Create a **custom n8n node** named **“A2A Agent Card”** that outputs a JSON object representing the agent’s metadata, skills, and endpoints according to the **A2A protocol specification**.\
It is designed to be connected directly to a **Webhook Trigger node**. When the webhook receives a GET request, this node provides the body of the JSON response.

This enables an n8n agent to expose its identity and capabilities publicly (e.g., via `/.well-known/agent.json` through proxy mapping).

---

### 2. Core User Story

**As an** n8n workflow builder,\
**I want** to generate a standards-compliant A2A Agent Card\
**So that** external clients and other agents can discover and interact with my n8n-based agent.

---

### 3. Functional Requirements

#### 3.1 Node Details

- **Node Name:** `A2A Agent Card`
- **Node Type:** `n8n-nodes-a2a.agentCard`
- **Category:** AI → Agent Protocol
- **Inputs:** 0–1 (accepts data override)
- **Outputs:** 1 (JSON data for Respond to Webhook)
- **Node Icon:** 🧠 or protocol icon

#### 3.2 Parameters (Configurable Fields)

| Field                               | Type        | Required         | Description                                                                               |
| ----------------------------------- | ----------- | ---------------- | ----------------------------------------------------------------------------------------- |
| **Agent ID**                        | String      | Yes              | Unique identifier (UUID or DID).                                                          |
| **Display Name**                    | String      | Yes              | Human-readable name of the agent.                                                         |
| **Version**                         | String      | Yes              | A2A version supported (e.g., `"1.0"`).                                                    |
| **Endpoint Base URL**               | String      | Yes              | Base public URL of the agent’s API (used to form `message/send`, `message/stream`, etc.). |
| **Description**                     | String      | No               | Optional text describing the agent’s purpose.                                             |
| **Capabilities / Skills**           | JSON array  | Yes              | List of supported capabilities, e.g. `["message/send", "message/stream", "tasks/get"]`.   |
| **Security Schemes**                | JSON object | Optional         | Supported auth methods (e.g., API key, OAuth2, mTLS).                                     |
| **Extensions**                      | JSON object | Optional         | Protocol extensions such as ERC-8004 or x402 integration references.                      |
| **Auth Required for Extended Card** | Boolean     | Default: `false` | Whether to hide sensitive fields behind authenticated route.                              |
| **Additional Fields**               | Key/Value   | Optional         | Freeform metadata for future expansion.                                                   |

#### 3.3 Output

Node emits a single JSON object like:

```json
{
  "id": "did:web:example.com",
  "displayName": "Example Agent",
  "version": "1.0",
  "description": "n8n A2A-compatible automation agent",
  "serviceEndpoint": {
    "message/send": "https://example.com/webhook/a2a/message/send",
    "message/stream": "https://example.com/webhook/a2a/message/stream"
  },
  "securitySchemes": {
    "apiKey": {
      "type": "apiKey",
      "in": "header",
      "name": "Authorization"
    }
  },
  "capabilities": [
    "message/send",
    "message/stream",
    "tasks/get",
    "tasks/cancel"
  ],
  "extensions": {
    "erc8004": "https://onchain.example/erc8004/agent"
  }
}
```

#### 3.4 Integration Flow Example

**Workflow Structure:**

```
Webhook Trigger (GET /a2a/agent-card)
  ↓
A2A Agent Card Node
  ↓
Respond to Webhook (Content-Type: application/json)
```

- When a GET request hits `/webhook/a2a/agent-card`, n8n executes the workflow.
- The Agent Card node emits JSON.
- The Respond to Webhook node returns the payload as HTTP 200.

---

### 4. Non-Functional Requirements

- **Performance:** <100 ms generation time.
- **Scalability:** Must not store state or require persistence.
- **Reliability:** Output deterministically from parameters.
- **Security:** No secrets in plain text fields; environment variables can populate credentials.
- **Compliance:** JSON schema follows A2A reference (`id`, `version`, `capabilities`, `securitySchemes`, `serviceEndpoint`, `extensions`).
- **Versioning:** Include internal `schemaVersion` in node metadata.

---

### 5. Developer Notes

- **Language:** TypeScript
- **File Path:** `packages/nodes-base/nodes/A2A/AgentCard/A2AAgentCard.node.ts`
- **Output Format:** `return [{ json: agentCard }]`
- **Auto-validation:** Add lightweight JSON schema validation (Ajv) to enforce required fields.
- **Testing:**
  - Mock workflow with Respond to Webhook.
  - Validate output JSON matches A2A schema.
  - Verify content-type headers and cache headers set correctly in the response node.

---

### 6. Future Enhancements

- Support for dynamic card enrichment (pulling live workflow list, metrics).
- “Authenticated Extended Card” variant node.
- CLI utility to validate the Agent Card externally.
- Option to include automatic `/.well-known` proxy generation hint.

---

### 7. Acceptance Criteria

- Node appears in n8n editor under *AI → Agent Protocol*.
- Can be attached to any Webhook Trigger.
- Returns valid JSON on GET request.
- Passes A2A schema validation.
- Usable in production behind a reverse proxy mapping `/.well-known/agent.json` to this webhook.

