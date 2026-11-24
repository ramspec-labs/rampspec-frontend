# Target origin validation

The submission field validates before any API request and provides linked,
polite error feedback. Harmless outer spaces, scheme/host case, a trailing root
slash and the default HTTPS port normalize to URL.origin. Non-default valid
ports and bracketed IPv6 hosts are retained in canonical form.

Credentials (including empty userinfo), fragments, queries, paths, backslashes,
control characters, embedded whitespace, unsafe schemes, invalid ports,
encoded/unicode authorities, abbreviated numeric IPs and trailing-dot hosts are
rejected as unsafe or ambiguous. IDN targets must use their explicit ASCII form.
This is syntax validation, not a server allowlist or SSRF authorization check.

The shared submission helper validates too, so bypassing the form cannot send
invalid origins. The backend remains authoritative: origin-related HTTP 400
responses attach to the origin field; authentication, transport and other
errors remain form-level. Editing clears stale results and server feedback.
Pending requests block edits/double submission, and late results after unmount
are ignored. Retries retain the same key; changing the normalized origin starts
a different request key so old backend results cannot be reused for a new target.
Raw input is neither logged nor persisted. No backend API changes are required.
