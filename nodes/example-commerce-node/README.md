# Example Commerce Node

This is an example n8n node for commerce operations. It demonstrates the basic structure and patterns for creating n8n nodes in this repository.

## Features

- **Product Operations**: Get and list products
- **Order Operations**: Manage orders (placeholder for future implementation)
- **API Authentication**: Secure API key authentication
- **Environment Support**: Sandbox and production environments

## Configuration

### Credentials

The node requires API credentials with the following properties:

- **API Key**: Your API key for authentication
- **Environment**: Choose between sandbox and production

### Operations

#### Product Operations

- **Get Product**: Retrieve a specific product by ID
- **List Products**: Get all available products

## Usage

1. Add the Example Commerce node to your workflow
2. Configure the API credentials
3. Select the desired operation
4. Provide required parameters (e.g., Product ID for Get operation)
5. Execute the workflow

## API Endpoints

The node interacts with the following endpoints:

- `GET /products/{id}` - Get a specific product
- `GET /products` - List all products

## Error Handling

The node includes comprehensive error handling:

- Invalid API keys
- Network timeouts
- Invalid product IDs
- API rate limiting

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

### Development Mode

```bash
pnpm dev
```

## Contributing

This is an example node. When creating your own nodes:

1. Copy this structure
2. Update the node name and description
3. Implement your specific API operations
4. Add appropriate tests
5. Update the documentation

For more information, see the main [README](../README.md) and [Contributing Guide](../CONTRIBUTING.md).
