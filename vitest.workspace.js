export default [
  {
    extends: './vite.config.js',
    test: {
      name: 'unit',
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/presentation/testing/setup.js'],
      include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.mjs'],
      css: true,
    },
  },
];
