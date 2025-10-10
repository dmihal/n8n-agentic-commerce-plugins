# ERC-8004 Registry Node for n8n

This n8n node package provides integration with ERC-8004 registries for managing on-chain agents, including Identity, Reputation, and Validation registries.

## Features

- **Identity Registry**: Register agents, manage metadata, and query agent information
- **Reputation Registry**: Give feedback, manage reputation, and query feedback data
- **Validation Registry**: Request validations, respond to validation requests, and track validation status

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

## Configuration

1. **Registry Selection**: Choose between Identity, Reputation, or Validation registry
2. **Blockchain Network**: Select from supported networks or use custom RPC
3. **Contract Address**: Specify the registry contract address
4. **Credentials**: Private key required for write operations

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
