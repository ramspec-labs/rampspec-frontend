# Contributing

## Scope

Keep changes within the frontend ownership boundary. Changes to API schemas,
backend authorization, or canonical verification behavior belong in their
respective repositories.

## Change expectations

1. Keep each change small enough to audit independently.
2. Add or update focused tests for behavior changes.
3. Run the documented local validation commands before committing.
4. Do not commit credentials, tokens, customer data, or generated build output.
5. Use a concise imperative commit subject without release or environment
   secrets.

## Review checklist

- [ ] The change has a clear user-facing or maintainability purpose.
- [ ] Loading, empty, denied, error, and success states are considered where
      applicable.
- [ ] Keyboard access and semantic labels are preserved.
- [ ] Backend-authoritative values are rendered without client-side rewriting.
- [ ] Tests and type checks pass locally.
- [ ] `git diff --check` reports no whitespace errors.
