# RampSpec Frontend Implementation Plan

## Purpose

This plan delivers the complete RampSpec web application described in `RAMPSPEC_FULL_PROJECT_DOCUMENTATION.md`. It is not an MVP plan. It covers the operational console, onboarding, live runs, reports, evidence, administration, accessibility, release validation, and post-launch maintenance.

The frontend owns browser interaction and consumes released backend and contract interfaces. It must not execute protocol journeys, store secrets, calculate authoritative scores, or contain Soroban contract source.

## Execution Rules

- Complete phases in order unless a dependency explicitly permits parallel work.
- Keep each phase in a separate pull request with focused tests and documentation.
- Generate API types from a tagged backend OpenAPI artifact; never hand-edit generated clients.
- Generate read-only contract clients from a tagged contracts release; never hand-edit bindings or network manifests.
- Treat run, report, signature, and evidence status as server-authoritative.
- Never place API keys, JWTs, KYC payloads, signing keys, or raw traffic in browser storage, logs, errors, or telemetry.
- Use conformance and evidence language; never imply SDF certification or legal approval.
- A phase is complete only when its exit check passes on phone, tablet, laptop, and wide desktop where UI is involved.

## Phase 01 - Repository Foundation

**Outcome:** A public, independently versioned frontend repository is ready for reviewed work.

**Parts:**

- [ ] Initialize the repository, `main` branch, Apache-2.0 license, README, code of conduct, security policy, contributing guide, and maintainers file.
- [ ] Add issue and pull-request templates with scope, acceptance, test, security, and `Closes #...` requirements.
- [ ] Record the frontend ownership boundary and release policy.

**Depends on:** RampSpec name and organization confirmation.

**Exit check:** Governance files are linked from the README and repository protections are documented.

## Phase 02 - Next.js Toolchain

**Outcome:** The strict application toolchain builds reproducibly.

**Parts:**

- [ ] Scaffold Next.js App Router, React, strict TypeScript, `pnpm`, ESLint, formatting, and supported Node version files.
- [ ] Configure Tailwind CSS, shadcn/ui primitives, Lucide icons, environment validation, and import aliases.
- [ ] Allow only public API, network, Horizon, RPC, evidence contract, and docs URLs through `NEXT_PUBLIC_*`; reject signing keys, service tokens, secret references, and unrestricted RPC credentials.
- [ ] Add build, lint, typecheck, unit-test, and dependency-audit scripts.

**Depends on:** Phase 01.

**Exit check:** A clean checkout installs with the lock file and all quality commands pass.

## Phase 03 - CI and Preview Deployments

**Outcome:** Every change receives repeatable automated feedback.

**Parts:**

- [ ] Add pull-request CI for install, generated-file checks, lint, typecheck, tests, and production build.
- [ ] Add dependency review, secret scanning, code scanning, SBOM, and artifact provenance jobs.
- [ ] Configure isolated preview deployments with synthetic configuration only.

**Depends on:** Phase 02.

**Exit check:** A sample pull request produces a working preview and all required checks.

## Phase 04 - Design Tokens and Application Shell

**Outcome:** RampSpec has a stable, work-focused visual foundation.

**Parts:**

- [ ] Define typography, spacing, color, severity, status, focus, motion, and chart tokens.
- [ ] Build responsive navigation, organization context, breadcrumbs, page headers, and command surfaces.
- [ ] Add standard loading, empty, partial, denied, blocked, error, and maintenance states.

**Depends on:** Phase 02.

**Exit check:** Storybook renders every shell state without overlap or color-only meaning.

## Phase 05 - Reusable Data and Feedback Components

**Outcome:** Dense operational information uses consistent accessible components.

**Parts:**

- [ ] Build tables, mobile list alternatives, filters, pagination, status and severity indicators, timestamps, and metric displays.
- [ ] Build identifier display with wrapping, copy action, truncation, and full-value tooltip.
- [ ] Build confirmation dialogs, problem-details views, permission notices, and retry surfaces.

**Depends on:** Phase 04.

**Exit check:** Component and accessibility tests cover long identifiers, empty values, and all statuses.

## Phase 06 - Generated Backend Client

**Outcome:** The frontend consumes the backend API through a pinned generated client.

**Parts:**

- [ ] Add the OpenAPI client generation and version-pinning workflow.
- [ ] Wrap RFC 9457 errors, opaque cursor pagination, request IDs, and idempotency headers.
- [ ] Fail CI when generated output differs from the pinned backend release.

**Depends on:** Backend foundation OpenAPI release.

**Exit check:** Contract tests pass against the oldest and newest supported `/v1` backend versions.

## Phase 07 - Authentication Session

**Outcome:** Users can sign in and maintain a secure browser session.

**Parts:**

- [ ] Build email, SSO, and supported wallet-assisted entry states plus the authorization-code exchange flow.
- [ ] Implement session renewal, logout, expiry, revoked-session, MFA-required, and provider-error behavior.
- [ ] Keep tokens out of persistent browser storage and scrub auth errors from telemetry.

**Depends on:** Phases 05-06 and backend identity endpoints.

**Exit check:** Authentication tests cover success, cancellation, expiry, refresh failure, and logout.

## Phase 08 - Organization Context and Switcher

**Outcome:** A signed-in user can select the correct tenant safely.

**Parts:**

- [ ] Build organization list, creation, selection, and persisted non-secret preference.
- [ ] Show role-aware empty, loading, invitation, suspended, and denied states.
- [ ] Invalidate tenant-scoped query data on organization changes.

**Depends on:** Phase 07.

**Exit check:** Tests prove data from the previous organization is not displayed after switching.

## Phase 09 - Authorization-Aware Routing

**Outcome:** Navigation and actions consistently reflect organization roles.

**Parts:**

- [ ] Map Owner, Admin, Maintainer, Runner, Auditor, and Viewer capabilities.
- [ ] Add route guards, action guards, raw-artifact permission checks, and server-denial handling.
- [ ] Keep hidden actions from being treated as the authorization boundary.

**Depends on:** Phase 08.

**Exit check:** A role matrix test covers every protected route and destructive action.

## Phase 10 - Project Inventory

**Outcome:** Users can manage projects within the active organization.

**Parts:**

- [ ] Build searchable, paginated project inventory and project creation.
- [ ] Build project summary, policy, integration, target, archive, and deletion entry points.
- [ ] Add loading, empty, archived, denied, conflict, and partial-data states.

**Depends on:** Phase 09 and backend project APIs.

**Exit check:** Project create, edit, archive, and navigation flows pass browser tests.

## Phase 11 - Target Configuration

**Outcome:** Users can register a target with explicit network and runner policy.

**Parts:**

- [ ] Build normalized home-domain, environment, network, expected SEP, asset, payment-method, and corridor fields.
- [ ] Support testnet, pubnet, local, and custom network displays with clear safety labels.
- [ ] Validate domains and reject ambiguous or unsafe input before submission.

**Depends on:** Phase 10 and backend target APIs.

**Exit check:** Valid, invalid, duplicate, and policy-blocked targets are tested.

## Phase 12 - SEP Discovery Results

**Outcome:** Target discovery is understandable and actionable.

**Parts:**

- [ ] Trigger discovery and render TOML status, endpoints, assets, accounts, network metadata, and reachability.
- [ ] Surface inconsistencies, upstream rule references, warnings, and remediation links.
- [ ] Distinguish transport failure, malformed metadata, unsupported SEP, and platform failure.

**Depends on:** Phase 11 and backend SEP-1 discovery.

**Exit check:** Schema fixtures cover complete, partial, invalid, redirected, and unreachable results.

## Phase 13 - Target Ownership Verification

**Outcome:** Users can prove control before active testing.

**Parts:**

- [ ] Build DNS TXT and well-known challenge selection and instructions.
- [ ] Implement pending, verify, success, expiry, replay, renewal, and failure states.
- [ ] Display the capabilities unlocked by verification and the verification expiry.

**Depends on:** Phase 11 and backend ownership APIs.

**Exit check:** Both verification methods pass deterministic browser tests.

## Phase 14 - Guided Onboarding

**Outcome:** A new organization can reach its first safe discovery run.

**Parts:**

- [ ] Combine organization, project, target, discovery, verification, and first-run steps.
- [ ] Persist progress server-side and support safe resume after interruption.
- [ ] Provide exact next actions without exposing internal feature explanations in the main console.

**Depends on:** Phases 08, 10, 12, and 13.

**Exit check:** A fresh account completes onboarding using only synthetic configuration.

## Phase 15 - Dashboard Release Gate Summary

**Outcome:** The dashboard gives an immediate release-health view.

**Parts:**

- [ ] Render release gate status, active critical and high findings, SEP coverage, and baseline regressions.
- [ ] Add target, environment, time-range, protocol, and severity URL-owned filters.
- [ ] Distinguish failed conformance, infrastructure failure, policy block, and no data.

**Depends on:** Phase 10 and backend dashboard/read models.

**Exit check:** Fixtures cover healthy, regressed, blocked, indeterminate, and empty organizations.

## Phase 16 - Dashboard Operational Signals

**Outcome:** The dashboard exposes operational drift and required action.

**Parts:**

- [ ] Add latest schedules, offline runners, expiring credentials, evidence commitments, incidents, and deployment drift.
- [ ] Add compact trends and links to the authoritative detail views.
- [ ] Ensure charts have textual equivalents and do not hide partial data.

**Depends on:** Phase 15 and backend monitoring summaries.

**Exit check:** Stale, partial, delayed, and offline data states are tested.

## Phase 17 - Suite Catalog

**Outcome:** Users can inspect versioned suites before running them.

**Parts:**

- [ ] Build suite inventory, lifecycle status, owner, version, lock hash, and supported network views.
- [ ] Render scenario graph, parameters, rule coverage, and release policy.
- [ ] Clearly label immutable locked versions and draft SEP content.

**Depends on:** Phase 06 and backend suite APIs.

**Exit check:** Global, project, draft, locked, deprecated, and inaccessible suites render correctly.

## Phase 18 - Run Wizard: Target and Suite

**Outcome:** The first run step binds a target to a compatible locked suite.

**Parts:**

- [ ] Select project, target, network, suite version, and pinned SEP snapshot.
- [ ] Filter incompatible suites and explain runner or target capability gaps.
- [ ] Preserve shareable non-secret choices in the URL or server draft.

**Depends on:** Phases 11 and 17.

**Exit check:** Compatibility and stale-version errors prevent invalid progression.

## Phase 19 - Run Wizard: Parameters and Fixtures

**Outcome:** Users can configure assets, rails, corridors, identities, and credentials.

**Parts:**

- [ ] Render schema-driven React Hook Form and Zod fields for assets, directions, off-chain assets, amounts, and corridor methods.
- [ ] Select synthetic customer, classic, muxed, memo, or contract-account fixtures.
- [ ] Bind secret references and runner capabilities without reading secret values.

**Depends on:** Phase 18 and released scenario schemas.

**Exit check:** Conditional fields, precision, missing capability, and prohibited input tests pass.

## Phase 20 - Run Wizard: Safety Preview

**Outcome:** Users see exact effects before any stateful work.

**Parts:**

- [ ] Show mutation summary, asset movement, destinations, operation limits, and estimated testnet cost.
- [ ] Add pubnet ownership, owner-policy, amount, operation-count, and typed-confirmation gates.
- [ ] Make discovery-only pubnet behavior visibly separate from active submission.

**Depends on:** Phase 19 and backend policy evaluation.

**Exit check:** Unsafe or incomplete active configurations cannot reach submission.

## Phase 21 - Idempotent Run Submission

**Outcome:** A confirmed configuration creates exactly one run.

**Parts:**

- [ ] Generate and retain an idempotency key for retries of the same submission.
- [ ] Present the immutable effective configuration before final confirmation.
- [ ] Handle accepted, duplicate, policy-blocked, invalid, and unavailable responses.

**Depends on:** Phase 20 and backend create-run contract.

**Exit check:** Double-click, refresh, timeout, and retry tests never create duplicate runs.

## Phase 22 - Reconnecting SSE Client

**Outcome:** Live run events survive ordinary connection loss.

**Parts:**

- [ ] Implement `text/event-stream`, heartbeat handling, event IDs, and `Last-Event-ID` replay.
- [ ] Normalize events into TanStack Query by sequence number and discard duplicates.
- [ ] Fall back to durable run state when the retained stream has expired.

**Depends on:** Backend SSE contract.

**Exit check:** Disconnect, replay, gap, duplicate, expiry, and terminal-event tests pass.

## Phase 23 - Live Run Timeline

**Outcome:** Users can follow a run without layout instability.

**Parts:**

- [ ] Build a fixed-height virtualized timeline and current/completed state graph.
- [ ] Render waiting, retrying, callback, ledger, teardown, and finalization events.
- [ ] Separate conformance failures from infrastructure failures and policy blocks.

**Depends on:** Phases 21-22.

**Exit check:** Long-run fixtures do not resize the layout or lose event order.

## Phase 24 - Live Evidence and Controls

**Outcome:** A run exposes useful redacted diagnostics and safe controls.

**Parts:**

- [ ] Add protocol-filtered logs, redaction labels, request metadata, ledger links, XDR summaries, and artifact placeholders.
- [ ] Enforce raw-artifact permission before requesting download links.
- [ ] Add pause or cancel where supported with cooperative and forced-cancel feedback.

**Depends on:** Phases 09 and 23.

**Exit check:** Permission, cancellation, stale-link, and sensitive-artifact tests pass.

## Phase 25 - Canonical Report Shell

**Outcome:** Immutable reports render directly from the released report schema.

**Parts:**

- [ ] Render scope, target, network, suite lock, spec commits, runner, timestamps, and overall gate.
- [ ] Show exact passed, failed, warning, skipped, and not-applicable counts.
- [ ] Display the required conformance, legal, regulatory, and SDF disclaimer.

**Depends on:** Backend report schema release.

**Exit check:** Versioned schema fixtures render without frontend score calculation.

## Phase 26 - Report Findings and Coverage

**Outcome:** A report explains every result and coverage gap.

**Parts:**

- [ ] Group findings by severity, protocol, classification, and status.
- [ ] Show upstream SEP version, commit, section, evidence reference, and remediation.
- [ ] Render skipped-rule reasons and flag required coverage failures.

**Depends on:** Phase 25.

**Exit check:** All classifications and statuses have accessible, non-color-only fixtures.

## Phase 27 - Baseline Comparison

**Outcome:** Users can identify regressions and improvements between immutable reports.

**Parts:**

- [ ] Render added, resolved, changed, and unchanged finding fingerprints.
- [ ] Compare suite locks, SEP snapshots, target configuration, coverage, and result counts.
- [ ] Warn when two reports are not meaningfully comparable.

**Depends on:** Phase 26 and backend comparison data.

**Exit check:** Compatible, partially compatible, and incompatible comparisons are tested.

## Phase 28 - Report Artifacts and Exports

**Outcome:** Authorized users can inspect artifact integrity and obtain exports.

**Parts:**

- [ ] List artifact hashes, type, redaction, retention deadline, and availability.
- [ ] Add audited short-lived downloads for allowed users.
- [ ] Add canonical JSON, HTML, PDF-ready HTML, JUnit, SARIF, and redacted HAR export actions when available.

**Depends on:** Phases 09 and 25 plus backend exports.

**Exit check:** Expired, denied, deleted, legal-hold, and available artifact states are covered.

## Phase 29 - Signature Verification

**Outcome:** A user can independently understand report authenticity.

**Parts:**

- [ ] Render report hash, algorithm, key ID, signed time, and verification result.
- [ ] Support browser-side verification using published keys where the released verifier permits it.
- [ ] Show key rotation, unknown key, altered report, and unsigned-report states.

**Depends on:** Backend verifier and public key history.

**Exit check:** Valid, tampered, rotated, unknown, and absent signature vectors pass.

## Phase 30 - Finding Detail and Triage

**Outcome:** Maintainers can investigate and govern a finding.

**Parts:**

- [ ] Build requirement, evidence, timeline, fingerprint, remediation, and affected-run views.
- [ ] Add triage disposition, owner, rationale, and audit history.
- [ ] Add time-bound rule-and-target exceptions with expiry warnings.

**Depends on:** Phase 26 and backend finding APIs.

**Exit check:** Role, expiry, invalid scope, conflict, and immutable-history tests pass.

## Phase 31 - SEP Snapshot and Coverage Matrix

**Outcome:** Users can inspect exactly which upstream specifications were tested.

**Parts:**

- [ ] Build SEP status, semantic version, upstream commit, content hash, and rule-pack version views.
- [ ] Render added, changed, deprecated, and removed requirement diffs.
- [ ] Add rule filters, coverage matrix, draft/FCP labels, and release-policy effects.

**Depends on:** Backend spec registry APIs.

**Exit check:** Active, draft, FCP, deprecated, and updated snapshot fixtures pass.

## Phase 32 - YAML Scenario Editor

**Outcome:** Maintainers can author declarative scenarios safely.

**Parts:**

- [ ] Integrate Monaco with released JSON Schema validation and safe YAML parsing.
- [ ] Show exact field, capability, network, dependency, and policy errors.
- [ ] Reject arbitrary JavaScript, shell commands, and unrestricted destinations in the UI before server validation.

**Depends on:** Released scenario schema and backend validation endpoint.

**Exit check:** Valid corpus and malicious scenario corpus match backend validation results.

## Phase 33 - Visual Scenario Graph and Versioning

**Outcome:** Scenario structure and immutable suite usage are visible.

**Parts:**

- [ ] Render dependencies, conditionals, matrix parameters, retries, and cleanup steps as a graph.
- [ ] Synchronize graph selection with YAML without inventing unsupported syntax.
- [ ] Add unsaved-change, diff, validation, new version, and locked-version behavior.

**Depends on:** Phase 32 and backend scenario version APIs.

**Exit check:** Round-trip tests preserve semantics and locked definitions remain read-only.

## Phase 34 - Secret Reference Management

**Outcome:** Admins manage secret metadata without value reads.

**Parts:**

- [ ] Build create through the dedicated write path, provider, scope, rotation metadata, and last-use views.
- [ ] Add rotate, disable, delete, and binding-impact confirmations.
- [ ] Ensure responses, state, analytics, errors, and screenshots never reveal values.

**Depends on:** Phase 09 and backend secret-reference APIs.

**Exit check:** Automated scans find no submitted secret in browser-accessible persistence or telemetry.

## Phase 35 - Runner Inventory and Registration

**Outcome:** Admins can operate hosted and local runners.

**Parts:**

- [ ] Render mode, organization binding, capabilities, version, heartbeat, health, and active leases.
- [ ] Build one-time registration-token flow without redisplaying token values.
- [ ] Add credential rotation, revoke, offline, incompatible-version, and upgrade states.

**Depends on:** Backend runner APIs.

**Exit check:** Registration, token expiry, heartbeat loss, rotation, and revocation tests pass.

## Phase 36 - Monitoring, Schedules, and Incidents

**Outcome:** Users can operate continuous checks.

**Parts:**

- [ ] Build schedule create, edit, pause, delete, manual trigger, timezone, and next-run views.
- [ ] Render uptime, latency, missed runs, target/network/platform failure attribution, alerts, and history.
- [ ] Add incident list and status links without presenting unmeasured objectives as guarantees.

**Depends on:** Backend schedule and monitoring APIs.

**Exit check:** DST, missed schedule, duplicate trigger, paused, delayed, and outage states pass.

## Phase 37 - Off-Chain Evidence Explorer

**Outcome:** Users can locate and verify signed evidence without a wallet.

**Parts:**

- [ ] Search by report ID, hash, target commitment, suite hash, and status.
- [ ] Present public, partner-shared, and private evidence modes accurately.
- [ ] Verify canonical hash and signature before showing a verified state.

**Depends on:** Phases 29 and backend evidence index.

**Exit check:** Missing, private, tampered, revoked, and superseded evidence states pass.

## Phase 38 - Wallet Ownership and Publication Consent

**Outcome:** Browser wallets are used only for explicit approved actions.

**Parts:**

- [ ] Integrate Stellar Wallets Kit for address ownership and policy-required publication authorization.
- [ ] Add the controlled client-side SEP-10 and SEP-45 fixture playground without exposing automated runner identities.
- [ ] Validate network, account, operation summary, contract, and payload before requesting a signature.
- [ ] Handle rejection, disconnect, unsupported method, account change, and network mismatch.

**Depends on:** Backend ownership/evidence preparation APIs and released contract artifacts.

**Exit check:** No secret key enters the frontend and all wallet failure paths are tested.

## Phase 39 - Soroban Evidence Lookup

**Outcome:** Users can compare an off-chain report with its on-chain commitment.

**Parts:**

- [ ] Consume pinned read-only bindings and known network deployment manifests.
- [ ] Render contract ID, code-hash verification, transaction, ledger, attestor, record status, and hashes.
- [ ] Treat unknown code hashes or manifest mismatches as unverified and block publication.

**Depends on:** Tagged contracts release and backend evidence publisher.

**Exit check:** Active, revoked, superseded, missing, mismatched, and RPC-unavailable cases pass.

## Phase 40 - Team and Service Accounts

**Outcome:** Owners and admins can manage organization access.

**Parts:**

- [ ] Build member, invitation, role change, removal, and pending states.
- [ ] Build service-account scope, API-key prefix, expiry, last-use, rotation, and disable views.
- [ ] Add destructive confirmations and prevent removal of the last owner.

**Depends on:** Phase 09 and backend identity APIs.

**Exit check:** The full authorization matrix and last-owner invariant pass.

## Phase 41 - Integrations and Organization Settings

**Outcome:** Administrators can configure external delivery and policy controls.

**Parts:**

- [ ] Build GitHub installation, repository/environment mapping, webhook, notification, and delivery-history screens.
- [ ] Build retention, signing, anchoring, pubnet, release-gate, and deletion policy forms.
- [ ] Add webhook test and secret-rotation actions without exposing secret values.

**Depends on:** Backend integration and organization policy APIs.

**Exit check:** Permission, validation, failed delivery, rotation, and destructive-policy tests pass.

## Phase 42 - Internal Operations Console

**Outcome:** Authorized platform operators can diagnose the service without tenant leakage.

**Parts:**

- [ ] Build scoped views for workflow backlog, runner capacity, failed deliveries, signing health, and evidence publication.
- [ ] Require elevated, time-bound authorization for emergency actions.
- [ ] Audit every operator action and keep tenant-sensitive payloads hidden by default.

**Depends on:** Backend administrative APIs and audit controls.

**Exit check:** Non-operators are denied and operator actions produce immutable audit events.

## Phase 43 - Accessibility and Localization Completion

**Outcome:** The complete console meets the accessibility and locale foundation requirements.

**Parts:**

- [ ] Complete WCAG 2.2 AA checks, keyboard journeys, focus order, landmarks, labels, and reduced-motion behavior.
- [ ] Add translation infrastructure and locale-safe dates, times, numbers, amounts, and time zones.
- [ ] Verify technical identifiers and dense tables at every target viewport.

**Depends on:** All user-facing feature phases.

**Exit check:** Automated accessibility checks plus manual keyboard and screen-reader smoke tests pass.

## Phase 44 - Privacy-Safe Browser Telemetry

**Outcome:** Frontend failures are observable without leaking sensitive data.

**Parts:**

- [ ] Add OpenTelemetry navigation, API, SSE, wallet, and error spans with bounded attributes.
- [ ] Apply allowlist-based error and attribute filtering before export.
- [ ] Add release identity, trace correlation, sampling, and telemetry opt-out policy behavior.

**Depends on:** Core application flows.

**Exit check:** A sensitive-data corpus produces no secret, token, fixture, or raw traffic output.

## Phase 45 - Full Frontend Test Matrix

**Outcome:** Every supported state and critical journey is protected from regression.

**Parts:**

- [ ] Complete Vitest and Testing Library coverage for loading, empty, partial, error, blocked, permission, and terminal states.
- [ ] Complete Playwright journeys for onboarding, safe run creation, SSE reconnect, report verification, triage, and evidence lookup.
- [ ] Add Storybook interaction, accessibility, and phone/tablet/laptop/wide visual regression suites.

**Depends on:** Phases 04-44.

**Exit check:** Tests prove no overlap, clipping, secret persistence, duplicate run, or inaccessible critical action.

## Phase 46 - Performance and Resilience

**Outcome:** Large operational datasets remain usable during partial failures.

**Parts:**

- [ ] Measure route bundles, initial rendering, long lists, report rendering, and SSE fan-out behavior.
- [ ] Add virtualization, query bounds, cancellation, retry budgets, and offline/recovery states.
- [ ] Verify API outage, stale cache, stream expiry, RPC outage, and partial response behavior.

**Depends on:** Phase 45.

**Exit check:** Agreed budgets pass with large fixtures and failures never display stale data as current.

## Phase 47 - Release Packaging and Compatibility

**Outcome:** The frontend can ship as a traceable independent release.

**Parts:**

- [ ] Add semantic versioning, release notes, signed tags, provenance, SBOM, and rollback procedure.
- [ ] Validate against oldest and newest supported backend `/v1` versions and pinned contract releases.
- [ ] Publish the frontend entry in the cross-repository compatibility manifest and product release manifest.

**Depends on:** Phases 03 and 45-46.

**Exit check:** A release candidate passes staging smoke tests and its artifact can be reproduced.

## Phase 48 - Production Launch Validation

**Outcome:** The production UI is ready for pilots and public use.

**Parts:**

- [ ] Validate production auth, public configuration, CSP, headers, error filtering, status links, and rollback.
- [ ] Run the complete reference-target journey from onboarding through independently verified report and evidence lookup.
- [ ] Resolve accessibility, penetration-test, privacy, and pilot usability findings.

**Depends on:** Compatible production backend, contracts, and docs releases.

**Exit check:** No unresolved critical issue remains and production claims match evidenced capabilities.

## Phase 49 - Post-Launch Frontend Maintenance

**Outcome:** The application stays compatible and useful after launch.

**Parts:**

- [ ] Monitor frontend errors, accessibility regressions, performance budgets, browser support, and client-generation drift.
- [ ] Add localization and wallet fixtures only from measured pilot demand.
- [ ] Test every supported backend and report-schema release until its documented retirement.

**Depends on:** Phase 48.

**Exit check:** A recurring maintenance calendar, ownership rotation, and compatibility review are active.

## Frontend Completion Gate

The frontend repository is complete for the production release only when all 49 phases are checked, generated clients match tagged sources, all user roles and states are tested, sensitive data is absent from browser persistence and telemetry, responsive and accessibility suites pass, and a user can complete the supported production journey without the UI claiming certification or computing authoritative results locally.
