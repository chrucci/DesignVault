---
name: go
description: Run the full local quality and test suite
disable-model-invocation: true
---

Run the full local quality and test suite. Show all output so I can see exactly what passed, failed, and any diffs (expected vs actual).

Run these steps in order, stopping if any step fails:

1. **Lint & Typecheck**: `pnpm turbo lint typecheck`
2. **Format check**: `pnpm -w run format:check`
3. **Unit tests (Vitest)**: `pnpm turbo test`

For each step, show the full output. If all steps pass, print a summary of total tests run and passed. If any step fails, show the failure details clearly and stop.
