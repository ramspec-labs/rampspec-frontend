# Production launch validation

- [ ] Production authentication and session expiry verified.
- [ ] Public environment keys contain no secrets and API origin is allowlisted.
- [ ] CSP, security headers, error filtering, status links, and rollback tested.
- [ ] Reference journey completed from onboarding through signed report and evidence lookup.
- [ ] Accessibility, penetration-test, privacy, and pilot usability findings reviewed.
- [ ] No unresolved critical issue remains; product claims match evidenced capabilities.

Run `pnpm verify` and `pnpm build` from a clean release candidate before sign-off.
