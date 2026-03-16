---
name: go-push
description: Run tests and if they pass, commit and push to origin
disable-model-invocation: true
---

Run the full local quality and test suite, and if everything passes, commit and push to origin.

Run these steps in order, stopping if any step fails:

1. **Lint & Typecheck**: `pnpm turbo lint typecheck`
2. **Format check**: `pnpm -w run format:check`
3. **Unit tests (Vitest)**: `pnpm turbo test`

For each step, show the full output. If any step fails, show the failure details clearly and stop — do NOT commit or push.

If all checks pass:

4. **Stage changes**: `git add` all relevant changed files (but never .env files or credentials)
5. **Commit**: Create a commit with a descriptive message summarizing the changes
6. **Push**: `git push` to origin

Show the final git status after pushing.
