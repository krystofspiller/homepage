<a href="https://krystofs.com"><img src="./public/images/readme.avif" alt="Homepage screenshot" width="100%"></a>

Welcome to the source code of my homepage built with Astro!

## Portchain highlights

May 2025 to August 2026. 433 PRs opened, 410 merged, 1,423 reviewed for others.

### AI parsing of coastal schedules

Owned end to end. Coastal schedules arrive as PDF, XLSX and plain-text email. Ran two spikes comparing ChatGPT, Gemini and Claude on real customer files, wrote RFC-12, then built it. EML, PDF and XLSX parsers, resolution against real ports and terminals, admin UI where human confirms records before they reach data platform. Shipped with Datadog monitors, runbook and testing guide, so QA started testing without engineering help.

### Optimization

- Legacy test suite moved to new integration test structure in 45 PRs, then legacy folder, helpers and scripts deleted. AI-assisted, ~80 h of my time went into guiding, reviewing and de-flaking. Proposed same method for retiring `fp-ts` and `io-ts`.
- Jest → Vitest in 12 PRs, ending with every shim and polyfill removed.
- Prettier → oxfmt, ESLint → oxlint, then 10+ stricter lint rules enabled one PR at a time. Knip enforced on PRs to delete dead code.
- Database. Removed n+1 query in tracker view, added missing indexes, dropped duplicate and unused ones, swapped `ILIKE` for equality in port lookup.
- Deployer image moved to Alpine. Known vulnerabilities 78 → 0.

### Heroku to GCP

17 terminal integrations migrated off Heroku in one month (July 2025). Each one Terraform PR plus Heroku removal PR.

### Port calls

Owned epic that made port calls first-class concept across Connect and data platform. New `port_call` table grouping terminal calls, ingestion change, UI change, rollout behind feature flag through demo, QA and production.

### Dependencies and team process

- RFC-09. Audited all 190 dependencies, set up grouped Dependabot, brought majors current (Auth0 v4, Redux v5, Vite 8, slonik v35 → v48). Removed 9 packages outright.
- RFC-08. GitHub Action regenerates `structure.sql` on every migration PR, so migration review is readable diff.
- Ran 7 retrospectives with owned, tracked action items. Wrote postmortem for 21-minute production outage.

<!-- TODO: explore view transitions further, make animation of headings from blog index to article headings -->
<!-- TODO: work on HabitVille -->
<!-- TODO: add knip -->
<!-- TODO: test homepage in Safari/Edge/Firefox -->
<!-- TODO: update resume -->
<!-- TODO: update Portchain section -->
