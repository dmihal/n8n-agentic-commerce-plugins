# Contributing to n8n Agentic Commerce Plugins

Thank you for your interest in contributing to this project! This guide will help you get started with contributing to our collection of n8n nodes.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/n8n-agentic-commerce-plugins.git
   cd n8n-agentic-commerce-plugins
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Create a development branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development Workflow

### Creating a New Node

1. Use the provided script to scaffold a new node:
   ```bash
   ./scripts/create-node.sh your-node-name
   ```

2. Navigate to the new node directory:
   ```bash
   cd nodes/your-node-name-node
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Start development:
   ```bash
   pnpm dev
   ```

### Making Changes

1. **Code Style**: Follow the existing TypeScript and ESLint configurations
2. **Testing**: Add tests for new functionality
3. **Documentation**: Update README files and add JSDoc comments
4. **Icons**: Provide clear SVG icons (24x24px)

### Testing Your Changes

```bash
# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Run tests
pnpm test

# Build the project
pnpm build
```

## 📝 Code Guidelines

### TypeScript

- Use strict typing
- Avoid `any` type when possible
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Node Structure

Each node should include:

1. **Node Class** (`src/[NodeName].node.ts`)
   - Implement `INodeType` interface
   - Define clear operation descriptions
   - Handle errors gracefully

2. **Credentials** (`src/[NodeName]Api.credentials.ts`)
   - Implement `ICredentialType` interface
   - Include proper authentication
   - Add credential testing

3. **Icon** (`icons/[node-name].svg`)
   - 24x24px SVG format
   - Clear and recognizable design
   - Consistent with n8n's design language

### Error Handling

- Use `NodeOperationError` for user-facing errors
- Provide helpful error messages
- Handle API failures gracefully
- Use `continueOnFail()` when appropriate

## 🧪 Testing Guidelines

### Test Structure

```
src/
├── [NodeName].node.ts
├── [NodeName]Api.credentials.ts
└── __tests__/
    ├── [NodeName].node.test.ts
    └── [NodeName]Api.credentials.test.ts
```

### Test Requirements

- Unit tests for all public methods
- Integration tests for API calls
- Credential validation tests
- Error handling tests

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific node
cd nodes/your-node-name-node
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## 📦 Building and Packaging

### Development Build

```bash
# Build in watch mode
pnpm build:watch
```

### Production Build

```bash
# Build all nodes
pnpm build

# Package for distribution
pnpm package
```

## 🔍 Code Review Process

### Before Submitting

1. **Self Review**: Review your own code before submitting
2. **Testing**: Ensure all tests pass
3. **Linting**: Fix all linting issues
4. **Documentation**: Update relevant documentation

### Pull Request Guidelines

1. **Clear Title**: Use descriptive pull request titles
2. **Description**: Explain what changes were made and why
3. **Testing**: Describe how the changes were tested
4. **Breaking Changes**: Note any breaking changes

### Review Checklist

- [ ] Code follows project style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Error handling is implemented
- [ ] Performance considerations addressed

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Node.js version, n8n version, etc.
6. **Screenshots**: If applicable

## 💡 Feature Requests

When requesting features:

1. **Use Case**: Describe the use case
2. **Proposed Solution**: Suggest how it could be implemented
3. **Alternatives**: Consider alternative approaches
4. **Impact**: Explain the benefit to users

## 📚 Resources

- [n8n Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n Community Guidelines](https://github.com/n8n-io/n8n-nodes-base/blob/master/CONTRIBUTING.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [pnpm Documentation](https://pnpm.io/)

## 🤝 Community

- Join our discussions in GitHub Issues
- Follow the project for updates
- Share your workflows and use cases

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
