# ADR 0008: Synthesize SFX with the Web Audio API

- Status: Accepted
- Date: 2026-10-29

## Context

Phase 5 needs short combat and UI sound effects. Howler.js is listed as the later audio adapter in AGENTS.md, but the current set is a handful of one-shot cues. Bundling Howler plus unverified sample files would add size and licensing work without a music bed yet.

Browsers also block autoplay until a user gesture.

## Decision

Use the Web Audio API to synthesize brief original tones (oscillator + gain envelope). Unlock the context on the first pointer or key event. Provide mute/unmute and a master volume. Do not start music automatically.

Howler.js remains available when streamed music or sampled SFX become a Phase 5+/7 need.

## Alternatives considered

- **Howler.js now:** useful for files and sprites, extra dependency for beeps.
- **HTMLAudioElement:** simple, awkward for synthesized tones and overlapping cues.
- **Third-party WAV/OGG packs:** licensing review for every file.

## Consequences

- No audio files ship in this phase.
- Tests inject a fake audio context; `play()` before unlock is a silent no-op.
- Replacing cues with sampled files later should keep the same `SfxId` surface.
