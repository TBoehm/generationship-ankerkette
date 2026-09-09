---
name: design-quality-gate
description: Review visual changes against the token system, mobile-first rules and accessibility. Use from gate-runner whenever a component, page or CSS file was touched, in parallel with the code review.
---

# design-quality-gate

Owner of the visual rules. Runs on `opus`, in parallel with
`code-quality-gate`, from a fresh context.

## Output

Numbered list, each item `[blocker|major|medium|minor]` plus `file:line`.
Mediums are fixed too. No praise, no sign-off, no code.

## Rules

**Tokens.** Every colour, size, spacing step and radius resolves to a custom
property from `src/presentation/styles/tokens.css`. A raw hex, px or rem in
a component file is a `major`. A new value belongs in the token file first.

**Colour world.** Hull `#05070a`, type `#e6e2d8`, dim `#98a1a9`, brass
accent `#c9a253`. Brass carries emphasis and nothing else, it is not a
decoration.

**Typography roles.** Key figures and technical readouts in the mono face
with tabular numerals, so digits do not jitter as they count. Running text
in the sans face. A figure that jumps horizontally while animating is a
`medium`.

**Mobile first.** The base style is the phone. Desktop density arrives only
inside `@media (min-width: 1024px)`, never as the base rule. A desktop-first
declaration is a `major`.

**Touch targets.** At least 44 by 44 CSS pixels below 1024px, including the
spacing around them. Controls sit where a thumb reaches them, along the
bottom edge, not in the top corners.

**Safe areas.** Fixed edges respect `env(safe-area-inset-*)` through the
`--safe-*` tokens. A control under the home indicator is a `blocker`.

**Canvas.** `touch-action: none` on any canvas that handles pointer
gestures, otherwise the browser steals the drag.

**German text.** No em dashes. Comma, colon, parentheses or a full stop
instead. No rhetorical closing flourish, a paragraph ends on its last piece
of substance. Numbers formatted through `formatInteger` and `formatDecimal`,
never through raw string interpolation.

**Accessibility.** Every control has an accessible name. Focus stays
visible. Colour is never the only carrier of state. Contrast of body text
against its own background at least 4.5 to 1, and dim grey on hull is the
pair to check first.

**Motion.** An animation that conveys nothing is noise. Respect
`prefers-reduced-motion` wherever something moves on its own.
