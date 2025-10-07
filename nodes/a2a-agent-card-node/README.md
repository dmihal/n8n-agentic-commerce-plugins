# A2A Agent Card Node

A custom n8n node that generates A2A-compliant agent discovery cards for agent-to-agent communication protocols.

## Overview

The A2A Agent Card node enables n8n workflows to expose agent metadata, capabilities, and endpoints according to the A2A (Agent-to-Agent) protocol specification. This allows external clients and other agents to discover and interact with your n8n-based agent.

## Features

- ✅ **A2A Protocol Compliant**: Generates JSON that follows the A2A specification
- ✅ **Stateless Operation**: No credentials required, pure data transformation
- ✅ **Flexible Configuration**: Support for capabilities, security schemes, and extensions
- ✅ **Webhook Integration**: Designed to work seamlessly with n8n Webhook Trigger nodes
- ✅ **Custom Metadata**: Support for additional fields and protocol extensions

## Installation

1. Navigate to the node directory:
   ```bash
   cd nodes/a2a-agent-card-node
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the node:
   ```bash
   pnpm build
   ```

4. Link the node to your n8n instance:
   ```bash
   pnpm package
   ```

## Usage

### Basic Workflow Setup

```
Webhook Trigger (GET /a2a/agent-card)
  ↓
A2A Agent Card Node
  ↓
Respond to Webhook (Content-Type: application/json)
```

### Node Parameters

#### Required Parameters

- **Agent ID**: Unique identifier (UUID or DID) for the agent
  - Example: `did:web:example.com`
- **Display Name**: Human-readable name of the agent
  - Example: `My n8n Agent`
- **Version**: A2A version supported by this agent
  - Example: `1.0`
- **Endpoint Base URL**: Base public URL of the agent's API endpoints
  - Example: `https://example.com/webhook/a2a`

#### Optional Parameters

- **Description**: Optional text describing the agent's purpose
- **Capabilities**: List of supported capabilities/skills
  - Example capabilities: `message/send`, `message/stream`, `tasks/get`, `tasks/cancel`
- **Security Schemes**: Supported authentication methods
  - Types: API Key, OAuth2, mTLS
- **Extensions**: Protocol extensions (e.g., ERC-8004, x402)
- **Additional Fields**: Freeform metadata for future expansion

### Example Configuration

```json
{
  "agentId": "did:web:example.com",
  "displayName": "My n8n Agent",
  "version": "1.0",
  "endpointBaseUrl": "https://example.com/webhook/a2a",
  "description": "n8n A2A-compatible automation agent",
  "capabilities": [
    {
      "name": "message/send"
    },
    {
      "name": "message/stream"
    },
    {
      "name": "tasks/get"
    }
  ],
  "securitySchemes": [
    {
      "name": "apiKey",
      "type": "apiKey",
      "in": "header",
      "name": "Authorization"
    }
  ],
  "extensions": [
    {
      "name": "erc8004",
      "value": "https://onchain.example/erc8004/agent"
    }
  ]
}
```

### Generated Output

The node generates a JSON object like this:

```json
{
  "id": "did:web:example.com",
  "displayName": "My n8n Agent",
  "version": "1.0",
  "description": "n8n A2A-compatible automation agent",
  "serviceEndpoint": {
    "message/send": "https://example.com/webhook/a2a/message/send",
    "message/stream": "https://example.com/webhook/a2a/message/stream",
    "tasks/get": "https://example.com/webhook/a2a/tasks/get"
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
    "tasks/get"
  ],
  "extensions": {
    "erc8004": "https://onchain.example/erc8004/agent"
  },
  "schemaVersion": "1.0"
}
```

## Integration Examples

### Basic Agent Discovery

1. Create a webhook trigger with path `/a2a/agent-card`
2. Add the A2A Agent Card node
3. Configure the required parameters
4. Connect to a "Respond to Webhook" node
5. Set the response content type to `application/json`

### Reverse Proxy Setup

Map `/.well-known/agent.json` to your webhook endpoint:

```nginx
location /.well-known/agent.json {
    proxy_pass http://localhost:5678/webhook/a2a/agent-card;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Dynamic Capabilities

You can use n8n expressions to dynamically populate capabilities based on your workflow configuration:

```javascript
// In the capabilities field, use expressions like:
{{ $json.availableCapabilities }}
```

## Security Considerations

- **No Secrets**: The node doesn't store or expose sensitive information
- **Environment Variables**: Use n8n's environment variable support for sensitive data
- **Authentication**: Implement proper authentication in your webhook endpoints
- **Rate Limiting**: Consider implementing rate limiting for agent discovery endpoints

## Performance

- **Generation Time**: < 100ms for typical configurations
- **Memory Usage**: Minimal, no state storage
- **Scalability**: Stateless operation supports high concurrency

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure TypeScript is properly configured
2. **Missing Dependencies**: Run `pnpm install` in the node directory
3. **Invalid JSON**: Check that all required parameters are provided
4. **Webhook Issues**: Verify webhook trigger configuration

### Debug Mode

Enable debug logging in n8n to see detailed execution information:

```bash
N8N_LOG_LEVEL=debug n8n start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Check the n8n community forums
- Review the A2A protocol specification

## Changelog

### v1.0.0
- Initial release
- A2A protocol compliance
- Basic agent card generation
- Support for capabilities, security schemes, and extensions
