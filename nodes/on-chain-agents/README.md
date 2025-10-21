# On-Chain Agents Node Package for n8n

This n8n node package provides integration with on-chain agents and x402 payment protocols, including ERC-8004 registries and HTTP requests with automatic payment handling.

## Features

- **Identity Registry**: Register agents, manage metadata, and query agent information
- **Reputation Registry**: Give feedback, manage reputation, and query feedback data
- **Validation Registry**: Request validations, respond to validation requests, and track validation status
- **X402 HTTP Request**: Make HTTP requests with automatic x402 payment handling

## Supported Operations

### Identity Registry
- Register agents (with or without URI/metadata)
- Set and get agent metadata
- Query agent existence, ownership, and token URI
- Get agent balance and total count

### Reputation Registry
- Give feedback to agents
- Revoke feedback
- Append responses to feedback
- Read feedback data and summaries
- Query clients and response counts

### Validation Registry
- Request validation for agents
- Respond to validation requests
- Get validation status and summaries
- Query validation requests and agent validations

### X402 HTTP Request
- Make HTTP requests with all standard methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Automatic x402 payment handling for 402 Payment Required responses
- Support for URL parameters and custom headers
- JSON body support for POST/PUT/PATCH requests
- Decode and return X-PAYMENT-RESPONSE header data

## Configuration

### ERC-8004 Registry Nodes
1. **Registry Selection**: Choose between Identity, Reputation, or Validation registry
2. **Blockchain Network**: Select from supported networks or use custom RPC
3. **Contract Address**: Specify the registry contract address
4. **Credentials**: Private key required for write operations

### X402 HTTP Request Node
1. **HTTP Method**: Choose from GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
2. **URL**: The target endpoint URL
3. **URL Parameters**: Optional query parameters
4. **Headers**: Custom HTTP headers (including Content-Type)
5. **Body**: JSON payload for POST/PUT/PATCH requests
6. **Credentials**: EVM private key required for x402 payment handling

## Supported Networks

- Ethereum Mainnet
- Polygon
- Base
- Sepolia Testnet
- Base Sepolia Testnet
- Custom RPC

## Installation

```bash
npm install n8n-nodes-on-chain-agents
```

## Usage

1. Add the ERC-8004 Registry node to your workflow
2. Select the registry type (Identity, Reputation, or Validation)
3. Choose the operation to perform
4. Configure the blockchain network and contract address
5. Provide credentials for write operations
6. Execute the workflow

## Examples

### Register an Agent
1. Select "Identity Registry"
2. Choose "Register Agent with URI"
3. Provide token URI
4. Execute to register the agent

### Give Feedback
1. Select "Reputation Registry"
2. Choose "Give Feedback"
3. Provide agent ID, score, tags, and feedback authorization
4. Execute to submit feedback

### Request Validation
1. Select "Validation Registry"
2. Choose "Validation Request"
3. Provide validator address, agent ID, and request details
4. Execute to submit validation request

## License

MIT
