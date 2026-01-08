# Refactor Workspace (vNext)

This directory is an isolated, experimental rebuild of the app architecture. It is intentionally **not** wired into the current build so we can iterate safely without touching production code.

## Goals
- Modular Step 4 control surface (coordinator + plug‑in UI modules).
- Clear engine boundaries to evaluate Claude branch performance improvements.
- Shared services for audio, export, paywall, and help systems.
- Scalable code organization for maintainability and future packaging targets.

## Structure
- `src/core/` — coordinators and orchestration logic.
- `src/services/` — shared services (audio, export, paywall, help, telemetry).
- `src/ui/` — UI modules (controls, engine surface, export panel).
- `docs/` — design notes and refactor guidance.

## Status
This is a scaffold only. The refactor plan and module contracts are defined in `docs/ARCHITECTURE.md`.
