# RampSpec Frontend

The RampSpec frontend is the operator-facing web application for configuring
projects, preparing verification runs, monitoring execution, and reviewing
backend-authoritative reports.

## Local development

The application uses Node.js 20 or newer, pnpm, and strict TypeScript. Install
dependencies with `pnpm install` and start the development server with
`pnpm dev`.

## Repository boundaries

- API contracts and generated client inputs are owned by `rampspec-contracts`.
- Backend state, authorization, and verification results are authoritative in
  `rampspec-backend`.
- Product and operational documentation is owned by `rampspec-docs`.
- This repository owns presentation, browser interaction, accessibility, and
  frontend orchestration only.

The frontend must never calculate or rewrite authoritative verification scores.
It may display backend-provided status, findings, evidence, and signatures.

## Contributions

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Security
reports must follow [SECURITY.md](SECURITY.md) and must not include credentials,
private keys, or production data.
