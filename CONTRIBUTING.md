# Contributing to Colorado MeshCore

Thank you for your interest in contributing to Colorado MeshCore. This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js 24, matching the `package.json` engine range
- npm
- Docker, if you are validating container changes

### Setup

1. Fork the repository.
2. Clone your fork:
   ```bash
   git clone https://github.com/Colorado-Mesh/denvermc-org.git
   cd denvermc-org
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy the example environment file if you need runtime overrides:
   ```bash
   cp .env.example .env.local
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes.
3. Run linting, type checking, and the production build:
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```
4. Test your changes locally. For Docker/runtime changes, also run:
   ```bash
   docker build -t colorado-meshcore-site:local .
   docker compose config
   ```
5. Commit your changes with a descriptive message.
6. Push to your fork and create a pull request.

## Code Style

- We use TypeScript for type safety.
- ESLint is configured for code linting.
- Follow existing code patterns and conventions.
- Keep components small and focused.
- Use meaningful variable and function names.

## Commit Messages

Write clear, concise commit messages that describe what changed and why:

- Use present tense ("Add feature" not "Added feature").
- Use imperative mood ("Fix bug" not "Fixes bug").
- Keep the first line under 72 characters.
- Reference issues when applicable.

Examples:
- `feat: Add node filtering to map view`
- `fix: Resolve MQTT connection timeout issue`
- `docs: Update API documentation`

## Pull Request Process

1. Ensure your PR description clearly describes the changes.
2. Link any related issues.
3. Make sure all CI checks pass.
4. Request review from maintainers.
5. Address any feedback from code review.

## Reporting Bugs

Use the GitHub issue templates to report bugs. Include:
- Clear description of the issue.
- Steps to reproduce.
- Expected vs actual behavior.
- Browser/environment information.

## Suggesting Features

Use the GitHub issue templates to suggest features. Include:
- Problem statement or use case.
- Proposed solution.
- Any alternatives considered.

## Questions?

Join our [Discord community](https://discord.gg/QpaW8FTTCE) for questions and discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
