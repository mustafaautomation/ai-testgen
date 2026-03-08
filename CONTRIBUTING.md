# Contributing to AI TestGen

## Getting Started

```bash
git clone https://github.com/mustafaautomation/ai-testgen.git
cd ai-testgen
npm install
npm test
```

## Development

```bash
npm test              # Run unit tests
npm run typecheck     # Type checking
npm run lint          # ESLint
npm run format:check  # Prettier
npm run build         # Compile TypeScript
```

## Pull Request Process

1. Create a feature branch from `main`
2. Write tests for new functionality
3. Ensure all checks pass: `npm run typecheck && npm run lint && npm test`
4. Submit PR using the provided template

## Code Style

- TypeScript strict mode
- Prettier for formatting
- ESLint for linting
- Conventional commit messages
