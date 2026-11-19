# Scoped run drafts

Selection, parameters, safety and submission read the same typed draft. Each
navigation carries a random draft ID and organization scope. Public settings
are stored only in tab-scoped sessionStorage: target/suite identifiers, fixture,
timeout, draft ID, organization ID and a 24-hour expiry. No token, credentials,
raw target-origin input or authoritative run/report data is persisted.

The current organization provider supplies scope when available; the existing
public reference workflow otherwise uses its reference organization. An URL
organization is only checked against that scope and never grants membership.
An organization change cannot render the old draft. A new draft has a fresh ID
and defaults. Missing, malformed, expired or differently scoped drafts block
navigation and offer a new draft. Disabled tab storage produces an explicit error.
Expiry is inclusive: a draft is invalid when now equals its expiry.

Every step validates restored catalog selections. Parameters/safety/submission
also validate known fixtures and whole-second timeouts from 30 through 600.
Unknown restored fields are stripped. Invalid settings remain blocked until
corrected; URL parameters cannot bypass validation. Full document navigation
and browser back/forward reload the same tab draft rather than reset values.

Submission keeps the existing public SEP-1 reference endpoint and reference
resource IDs. It sends the chosen draft settings in the backend's existing
effectiveConfig field, including selected catalog IDs as metadata. Those catalog
entries remain frontend examples; they do not establish target authorization or
change the backend reference suite. The backend owns execution and results.
The target origin is entered on submission and intentionally is not persisted.
No API schema or backend code is changed.
