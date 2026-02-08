# GitHub Project Runner - Contributing Guide

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/github-project-runner.git`
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Run tests and validation
6. Commit: `git commit -m "Add your feature"`
7. Push: `git push origin feature/your-feature`
8. Create a Pull Request

## Development Setup

```bash
# Install dependencies
npm install --prefix backend
npm install --prefix frontend

# Start development servers
npm run dev --prefix backend
npm start --prefix frontend
```

## Code Style

- Use ES6+ syntax
- Follow ESLint configuration
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

## Testing

```bash
# Backend tests
npm test --prefix backend

# Frontend tests
npm test --prefix frontend
```

## Commit Messages

Format: `type(scope): message`

Examples:
- `feat(backend): add Java project support`
- `fix(frontend): fix terminal scrolling`
- `docs(readme): update installation steps`
- `refactor(docker): optimize Dockerfile`

## Pull Request Process

1. Update README.md with any changes
2. Add tests for new features
3. Ensure all tests pass
4. Update documentation
5. Request review from maintainers

## Issue Guidelines

- Check existing issues first
- Provide clear description
- Include error messages and logs
- Specify OS and versions
- Include steps to reproduce

## Code of Conduct

- Be respectful and inclusive
- No harassment or discrimination
- Help each other learn and grow
- Give constructive feedback

## Questions?

- Open an issue with [QUESTION] label
- Join our Discord community
- Email: support@example.com

Thank you for contributing! 🎉
