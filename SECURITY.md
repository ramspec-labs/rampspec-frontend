# Security Policy

## Reporting a vulnerability

Do not open a public issue for a security vulnerability. Send a private report
to the maintainers with the affected route or component, reproduction steps,
impact, and a suggested mitigation when available.

Never include passwords, access tokens, private keys, personal data, or live
customer evidence in a report.

## Frontend security rules

- Treat all API responses and URL parameters as untrusted input.
- Keep authentication material in secure, HTTP-only cookies managed by the
  backend; do not persist secrets in local storage.
- Render user-provided text as text, never as unsanitized HTML.
- Keep browser-exposed environment variables limited to values prefixed with
  `NEXT_PUBLIC_` and safe for public delivery.
