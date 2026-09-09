/**
 * Tailwind is bound to the design tokens, it never carries raw values.
 * Every colour, radius and spacing step resolves to a custom property
 * declared in src/presentation/styles/tokens.css, which stays the SSoT.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        hull: 'var(--color-hull)',
        panel: 'var(--color-panel)',
        rule: 'var(--color-rule)',
        bone: 'var(--color-bone)',
        dim: 'var(--color-dim)',
        brass: 'var(--color-brass)',
        warm: 'var(--color-warm)',
        cool: 'var(--color-cool)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      spacing: {
        touch: 'var(--size-touch)',
      },
      borderRadius: {
        panel: 'var(--radius-panel)',
      },
      screens: {
        desktop: '1024px',
      },
    },
  },
  plugins: [],
};
