---
title: Contributing
---

# Contributing

Contributions are welcome. The codebase is TypeScript throughout with strict mode enabled. Tests are required for new exporters and renderer changes.

- Open an issue before working on large features.
- Run `npm run test` and `npm run typecheck` before submitting a PR.
- Exporter changes need corresponding unit tests in `src/__tests__/`.
- New component types need entries in `componentDefs.ts` and all three exporters.
