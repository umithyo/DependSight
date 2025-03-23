# Contributing to DependSight

Thank you for your interest in contributing to DependSight! We welcome contributions from everyone, regardless of experience level.

This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report:

1. Check the [issue tracker](https://github.com/umithyo/dependsight/issues) to see if the problem has already been reported
2. If you're unable to find an open issue addressing the problem, create a new one

When creating a bug report, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior and what actually happened
- Screenshots if applicable
- Your environment (OS, Node.js version, npm version)
- Any additional context that might be helpful

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

1. Use a clear and descriptive title
2. Provide a detailed description of the proposed enhancement
3. Explain why this enhancement would be useful to most DependSight users
4. Include any examples or mock-ups if applicable

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes
4. Run the tests with `npm test` to ensure your changes don't break existing functionality
5. Submit a pull request against the `main` branch

## Development Workflow

### Setting Up Your Development Environment

1. Fork and clone the repository
2. Install dependencies with `npm install`
3. Build the project with `npm run build`
4. Run tests with `npm test`

### Code Style

This project uses:
- TypeScript for type safety
- ESLint for code style enforcement
- Prettier for code formatting

Make sure your code:
- Passes all existing tests
- Follows the established code style
- Includes appropriate tests for new functionality
- Includes JSDoc comments for public APIs

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Your commit messages should be structured as follows:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types include:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect code meaning (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Testing

We strive for high test coverage. Please include tests with your changes.

- Unit tests: `npm test`
- Integration tests: `npm run test:integration`

## Getting Help

If you need help, you can:

- Open an issue with a question
- Contact the maintainer directly via email

## Thank You!

Your contributions to open source, large or small, make projects like this possible. Thank you for taking the time to contribute. 