---
description: deployment workflow rules
---

# Deployment Workflow Rules

1.  **DEFAULT BRANCH**: Always work on the `dev` branch.
    *   Command: `git checkout dev`
2.  **ROUTINE DEPLOYMENT**: When the user asks to "deploy", "save", or "fix" something, **ALWAYS push to `dev`**.
    *   Command: `git push origin dev`
    *   URL: `https://jinath-telecom.vercel.app` (Assuming this is the vercel url since we clonned it, need to verify or ask user if they have a specific sub-domain but will set to a generic jinath one for now to avoid the Ahsania confusion)
3.  **FINAL DEPLOYMENT**: Only when the user explicitly says **"Final Deploy"** or **"Deploy to Main"**:
    *   Merge `dev` into `main`.
    *   Push `main` to production.
    *   Command Sequence:
        ```bash
        git checkout main
        git merge dev
        git push origin main
        git checkout dev
        ```
    *   URL: `https://jinath-telecom.vercel.app/`
