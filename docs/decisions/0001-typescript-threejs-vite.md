# ADR 0001: TypeScript, Three.js, and Vite

- Status: Accepted
- Date: 2026-10-29

## Context

The game must run in desktop browsers, render a 3D isometric scene, stay maintainable as a portfolio codebase, and support a fast local development loop. The stack should keep gameplay systems under project control rather than hiding them inside a closed engine editor.

## Decision

Use TypeScript in `strict` mode, Three.js for rendering, Vite for development and production builds, and npm as the package manager.

## Alternatives considered

- **Plain JavaScript:** faster to start, weaker contracts for combat and config data.
- **Babylon.js or PlayCanvas:** capable engines, less aligned with the already published project docs and with the goal of explicit custom systems.
- **Unity or Godot exported to WebGL:** heavier toolchain, less natural fit for a small TypeScript repository and Cloudflare Pages static hosting.
- **Webpack or a custom bundler:** more configuration for no benefit at this size.

## Consequences

- Rendering, camera, and animation stay explicit in project code.
- Gameplay architecture must be designed; Three.js will not provide it.
- Vite's static output matches Cloudflare Pages.
- Strict TypeScript becomes a CI gate from Phase 1 onward.
