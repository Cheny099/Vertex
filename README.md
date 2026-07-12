# Vertex Quant Frontend

Vertex Quant is a React frontend for a quantitative trading platform. It
contains the user dashboard, strategy workflows, account settings, and
administration interfaces. A compatible backend API is required for data,
authentication, and trading operations.

> This repository contains frontend source code only. Never place exchange
> credentials, access tokens, production environment files, or database dumps
> in this repository.

## Technology

- React 18
- TypeScript
- Vite 7
- TanStack Query
- Tailwind CSS and Radix UI
- i18next

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- A compatible backend running locally or reachable over HTTPS

## Local Development

```powershell
git clone https://github.com/Cheny099/Vertex.git
Set-Location Vertex
npm ci
Copy-Item .env.example .env.local
npm run dev
```

The development server listens on `http://127.0.0.1:8080` by default. With an
empty `VITE_API_URL`, requests under `/api` use the Vite proxy and are forwarded
to `http://localhost:8000`.

To connect directly to another backend, set `VITE_API_URL` in `.env.local`:

```dotenv
VITE_API_URL=https://api.example.com
```

Remote or tunnel-based development must explicitly opt in:

```powershell
$env:DEV_SERVER_HOST = "0.0.0.0"
$env:DEV_SERVER_ALLOWED_HOSTS = "your-domain.example"
npm run dev
```

Do not use a wildcard allowed-host configuration on an untrusted network.

## Commands

```powershell
npm run dev        # Start the local development server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript without emitting files
npm run build      # Create a production build
npm run preview    # Preview the production build locally
```

## Project Structure

```text
src/
|-- api/          # Backend contracts and request clients
|-- components/   # Shared and domain components
|-- contexts/     # Application context providers
|-- hooks/        # Shared React hooks
|-- locales/      # Translation resources
|-- pages/        # Route-level pages and page modules
|-- shared/       # Shared types and pure utilities
`-- types/        # Domain type definitions
```

## Backend Integration

Backend integration is part of the frontend architecture and should not be
removed for open-source distribution. API paths, request types, and response
contracts are source code; deployment URLs, credentials, tokens, and private
infrastructure details are not.

When changing an API integration:

1. Preserve the backend contract or document the required backend change.
2. Keep secrets out of `VITE_*` variables because Vite exposes them to the
   browser bundle.
3. Verify loading, empty, error, and authorization states.
4. Run lint, type checking, and a production build.

## Deployment Responsibility

The bundled help and legal content is a source-code baseline, not legal advice.
Every deployment operator must review it and publish valid support, privacy,
and security contact channels before serving users. Do not replace those
channels with a `noreply` address because privacy and support requests must be
receivable.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.
Use GitHub Issues for reproducible bugs. Security vulnerabilities must be
reported privately according to [SECURITY.md](SECURITY.md).

## Disclaimer

This software is provided for development and research purposes. Trading and
automated execution involve substantial financial risk. You are responsible
for reviewing the code, securing credentials, and validating behavior before
using it with any live account.

## License

Licensed under the [MIT License](LICENSE).
