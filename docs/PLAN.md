# Pantheon Orchestration Plan

## 🎯 Objective

Fix build errors in the Pantheon monorepo to ensure successful deployment of the Web application (Vercel) and Mobile application (Expo/Android).

## 🔍 Analysis Findings

Analysis of the codebase and build logs reveals critical blocking issues:

1. **Shared Package Errors (`@pantheon/analysis`)**:
    * `packages/analysis/aether/config.ts`: Syntax error (missing semicolon/invalid object usage).
    * `packages/analysis/athena/config.ts`: Syntax error (invalid characters/structure).
    * `packages/analysis/hermes/api/client.ts`: Syntax error (template string malformation).
    * *Impact*: Blocks BOTH Web and Mobile builds as they depend on this workspace.

2. **Web Application Errors**:
    * `apps/web/src/app/council/page.tsx`: Missing import `@components/council/CouncilRoom`.

3. **Mobile Deployment**:
    * Likely failing due to the upstream `analysis` package errors.

## 🛠️ Implementation Phases

### Phase 1: Core System Repair (The Foundation)

*Goal: Fix shared package compilation errors.*
* [ ] **Fix Aether Config**: Correct syntax in `packages/analysis/aether/config.ts`.
* [ ] **Fix Athena Config**: Correct syntax in `packages/analysis/athena/config.ts`.
* [ ] **Fix Hermes Client**: Fix string interpolation in `packages/analysis/hermes/api/client.ts`.
* [ ] **Verification**: Run `turbo run build --filter=@pantheon/analysis` to confirm clean build.

### Phase 2: Web Application Restoration

*Goal: Get the web dashboard running.*
* [ ] **Resolve Imports**: Fix the missing `@components` alias or import path in `apps/web/src/app/council/page.tsx`.
* [ ] **Build Check**: Run `turbo run build --filter=web`.

### Phase 3: Mobile Application Enablement

*Goal: Generate an installable APK/AAB.*
* [ ] **Dependency Check**: Ensure `apps/mobile` builds locally with fixed packages.
* [ ] **EAS Build**: Run `eas build --platform android --profile preview` (or local build) to create an installable binary for the user.

### Phase 4: Deployment & Verification

- [ ] **Push to Main**: Trigger Vercel deployment.
* [ ] **Mobile Install**: Provide user with the build link or file.
* [ ] **Final Smoke Test**: Verify core features on both platforms.

## 👥 Agent Allocation (Orchestration Phase 2)

Upon approval, the following agents will be activated in parallel:

1. **`backend-specialist`**: Fix the `analysis` package (TypeScript/Node.js logic).
2. **`frontend-specialist`**: Fix the Web UI import errors and verify Mobile UI compatibility.
3. **`devops-engineer`**: Manage the Expo build process and Vercel syncing.

## ❓ User Decisions Required

- (Already confirmed via prompt context): Use existing stack (Next.js, Expo, Supabase).
