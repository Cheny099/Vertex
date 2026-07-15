# Vertex Quant Frontend

[English](README.md) | [简体中文](README.zh-CN.md)

[![CI](https://github.com/Cheny099/Vertex/actions/workflows/ci.yml/badge.svg)](https://github.com/Cheny099/Vertex/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

React frontend for a quantitative trading platform. A compatible backend is
required for authentication, data, and trading operations.

## Features

- User dashboards, strategies, signals, trading history, accounts, and settings
- Administration interfaces for operations, content, audits, and statistics
- English and Simplified Chinese interfaces
- React 18, TypeScript, Vite, TanStack Query, Tailwind CSS, and Radix UI

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- A compatible backend API

## Quick Start

```powershell
git clone https://github.com/Cheny099/Vertex.git
Set-Location Vertex
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:8080` after the development server starts.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | empty | Backend base URL; empty uses local `/api` proxying |
| `DEV_SERVER_HOST` | `127.0.0.1` | Development server bind address |
| `DEV_SERVER_ALLOWED_HOSTS` | empty | Additional development hostnames |

Local `/api` requests are proxied to `http://localhost:8000` when
`VITE_API_URL` is empty. API paths and request types are part of this frontend;
deployment URLs and credentials are not.

## Commands

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

## Security

- Never put secrets in `VITE_*` variables; Vite exposes them to the browser.
- Keep environment files, exchange credentials, logs, and account screenshots
  out of Git.
- Validate backend permissions and trading behavior before using a live account.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.
Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Disclaimer

Trading and automated execution involve substantial financial risk. This
software is provided for development and research, not as financial advice.

## License

[MIT](LICENSE)
