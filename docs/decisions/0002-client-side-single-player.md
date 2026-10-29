# ADR 0002: Client-side single-player architecture

- Status: Accepted
- Date: 2026-10-29

## Context

The first public game is a single-player survival run in the browser. There is no requirement for accounts, leaderboards, cloud saves, or multiplayer. Adding a server now would delay the playable slice and expand the security surface of a public repository.

## Decision

Run the entire game in the browser. Do not introduce a backend, database, authentication, or networking layer for gameplay.

If settings or local progress are needed later, persist them on-device (IndexedDB behind an adapter). A backend may be reconsidered only if a later product requirement such as online leaderboards is explicitly accepted.

## Alternatives considered

- **Authoritative game server:** useful for multiplayer or anti-cheat, unnecessary for a local single-player run.
- **BaaS (Firebase or similar):** adds accounts, SDKs, and operational cost before a game exists.
- **Static game plus optional later API:** compatible with this decision; the API is deferred.

## Consequences

- Hosting is a static Vite build.
- No secrets or server credentials belong in this repository.
- Save data cannot be shared across devices until a backend exists.
- Cheating is irrelevant to other players; fairness is local.
