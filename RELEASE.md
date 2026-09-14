# Release procedure

Create a signed tag from a clean checkout, run `pnpm verify` and `pnpm build`,
attach the generated provenance and SBOM from CI, and retain the previous tag
for rollback. Compatibility is declared in `release-manifest.json`.
