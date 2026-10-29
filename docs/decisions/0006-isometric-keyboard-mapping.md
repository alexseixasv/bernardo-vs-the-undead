# ADR 0006: Camera-relative isometric keyboard mapping

- Status: Accepted
- Date: 2026-10-29

## Context

The playable arena is viewed from a fixed isometric angle at `+X +Y +Z`. Mapping W to world `-Z` and D to world `+X` would make "up" on the keyboard feel diagonal on screen.

Touch controls will be added later, so simulation should consume a small intent object rather than raw keyboard events.

## Decision

Keyboard and future touch adapters produce a screen-space `InputIntent` (`axisX` right, `axisY` up). The movement system converts that intent onto the XZ plane using a fixed orthonormal isometric basis:

- Screen up → world `(-X, -Z)`
- Screen right → world `(+X, -Z)`

Diagonal input is normalized before the basis is applied so world speed stays constant.

## Alternatives considered

- **World-axis WASD:** simpler math, unintuitive under this camera.
- **Read the Three.js camera every frame:** couples simulation to rendering and is harder to unit-test.
- **Orbit controls:** rejected; the camera angle stays fixed during play.

## Consequences

- Movement tests do not need WebGL.
- A later thumb stick can emit the same `InputIntent`.
- Changing camera yaw would require updating the documented basis. The current camera does not yaw.
