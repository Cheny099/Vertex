# Contributing

[English](CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh-CN.md)

Thank you for contributing to Vertex Quant.

## Before You Start

- Search existing issues before opening a new one.
- Use GitHub Issues only for concrete, reproducible defects or scoped feature
  requests.
- Do not post credentials, tokens, private URLs, personal data, or security
  vulnerabilities in a public issue.
- Report security vulnerabilities privately as described in `SECURITY.md`.

## Development Setup

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

The frontend expects a compatible backend. Keep API paths, methods, parameters,
and response handling aligned with the backend contract.

## Pull Requests

Keep each pull request focused on one concern. Before submitting, run:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

A pull request should explain:

- What user-visible problem it solves
- How the problem can be reproduced
- Why the implementation matches the existing architecture
- Which checks were run

Do not include generated build output, environment files, credentials, database
dumps, screenshots containing personal data, or unrelated formatting changes.

## Commit Messages

Use concise English commit messages. Prefer an established prefix such as
`fix:`, `feat:`, `refactor:`, `docs:`, `test:`, `build:`, or `chore:`.
