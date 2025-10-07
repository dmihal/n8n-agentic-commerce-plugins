# n8n Agentic Commerce Plugins

A collection of n8n nodes for agentic commerce workflows, built with TypeScript and managed with pnpm workspaces.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd n8n-agentic-commerce-plugins

# Install dependencies
pnpm install

# Build all nodes
pnpm build
```

## 📁 Project Structure

```
n8n-agentic-commerce-plugins/
├── nodes/                          # Individual n8n node packages
│   ├── example-commerce-node/      # Example node implementation
│   │   ├── src/                    # TypeScript source files
│   │   ├── icons/                  # Node icons (SVG)
│   │   ├── dist/                   # Built JavaScript files
│   │   ├── package.json            # Node-specific package.json
│   │   └── tsconfig.json           # Node-specific TypeScript config
│   └── [other-nodes]/              # Additional nodes
├── scripts/                        # Utility scripts
│   └── create-node.sh              # Script to generate new nodes
├── package.json                    # Root workspace configuration
├── tsconfig.json                   # Root TypeScript configuration
└── .eslintrc.json                  # ESLint configuration
```

## 🛠️ Development

### Creating a New Node

Use the provided script to quickly scaffold a new n8n node:

```bash
./scripts/create-node.sh payment-processor
```

This will create:
- A new directory structure
- Basic TypeScript files
- Package.json configuration
- Default SVG icon
- Credentials template

### Available Scripts

#### Root Level (affects all nodes)
```bash
pnpm build          # Build all nodes
pnpm build:watch    # Build all nodes in watch mode
pnpm dev            # Start development mode for all nodes
pnpm lint           # Lint all nodes
pnpm lint:fix       # Fix linting issues
pnpm test           # Run tests for all nodes
pnpm clean          # Clean all build artifacts
pnpm package        # Package all nodes for distribution
```

#### Individual Node Level
```bash
cd nodes/example-commerce-node
pnpm build          # Build this specific node
pnpm build:watch    # Build in watch mode
pnpm dev            # Development mode
pnpm lint           # Lint this node
pnpm package        # Package for distribution
```

### Node Development

Each node follows this structure:

1. **Node Implementation** (`src/[NodeName].node.ts`)
   - Main node class implementing `INodeType`
   - Defines node properties, operations, and execution logic

2. **Credentials** (`src/[NodeName]Api.credentials.ts`)
   - API authentication configuration
   - Credential properties and validation

3. **Icon** (`icons/[node-name].svg`)
   - SVG icon displayed in n8n interface
   - Should be 24x24px

4. **Package Configuration** (`package.json`)
   - Node metadata and dependencies
   - n8n-specific configuration

## 📦 Packaging and Distribution

### Building for Production

```bash
# Build all nodes
pnpm build

# Package for distribution
pnpm package
```

### Installing in n8n

1. Build and package your nodes:
   ```bash
   pnpm build
   pnpm package
   ```

2. Copy the generated `.n8n` files to your n8n instance:
   ```bash
   cp nodes/*/dist/*.n8n /path/to/n8n/custom/
   ```

3. Restart n8n to load the new nodes

## 🧪 Testing

### Running Tests

```bash
# Run tests for all nodes
pnpm test

# Run tests for a specific node
cd nodes/example-commerce-node
pnpm test
```

### Test Structure

Each node should include:
- Unit tests for node logic
- Integration tests for API calls
- Credential validation tests

## 📝 Contributing

### Code Style

- Use TypeScript for all source code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Pull Request Process

1. Create a feature branch
2. Implement your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Node Guidelines

When creating new nodes:

1. **Naming**: Use kebab-case for node names (e.g., `payment-processor`)
2. **Icons**: Provide clear, recognizable SVG icons
3. **Documentation**: Include comprehensive descriptions and examples
4. **Error Handling**: Implement proper error handling and user feedback
5. **Testing**: Include unit and integration tests

## 🔧 Configuration

### TypeScript Configuration

The project uses a base TypeScript configuration that can be extended by individual nodes. Key settings:

- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Source maps for debugging

### ESLint Configuration

Shared ESLint rules across all nodes:
- TypeScript-specific rules
- Node.js environment
- Consistent code style

## 📚 Resources

- [n8n Node Development Documentation](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n Community Node Package Guidelines](https://github.com/n8n-io/n8n-nodes-base/blob/master/CONTRIBUTING.md)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Support

- Create issues for bugs or feature requests
- Join the n8n community for discussions
- Check existing documentation before asking questions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
