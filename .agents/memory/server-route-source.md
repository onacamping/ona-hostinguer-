---
name: Server route source and generated output
description: Non-obvious relationship between the TypeScript route source and emitted JavaScript in this project.
---

The server uses TypeScript route source during the development workflow, while the repository also keeps emitted JavaScript alongside it for production-oriented builds. Changes to server routes should be checked against both representations and the server compiler should be run after route edits.

**Why:** The import specifiers use `.js` even when development executes the TypeScript source through `tsx`, so it is easy for the two route representations to drift silently.

**How to apply:** Treat `server/routes.ts` as the source of truth, then run the project TypeScript check/build and inspect the generated `server/routes.js` diff before delivering server changes.