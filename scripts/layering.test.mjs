import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

/**
 * The layering rules are only worth as much as the globs they are attached
 * to. A file extension the pattern misses is a hole the reviewer cannot see,
 * so the enforcement is asserted here rather than assumed.
 */
async function lint(filePath, code) {
  const eslint = new ESLint({ cwd: process.cwd() });
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((m) => `${m.ruleId}: ${m.message}`);
}

const IMPORTS_THREE = "import * as THREE from 'three';\nexport const a = THREE;\n";
const READS_WINDOW = 'export const width = window.innerWidth;\n';
const IMPORTS_PRESENTATION = "import x from '../presentation/thing.js';\nexport const a = x;\n";

describe('domain layer enforcement', () => {
  it('rejects three.js in a .js file', async () => {
    const messages = await lint('src/domain/probe.js', IMPORTS_THREE);
    expect(messages.join('\n')).toMatch(/framework free/);
  });

  it('rejects three.js in a .jsx file too', async () => {
    const messages = await lint('src/domain/probe.jsx', IMPORTS_THREE);
    expect(messages.join('\n')).toMatch(/framework free/);
  });

  it('rejects reading the browser in a .js file', async () => {
    const messages = await lint('src/domain/probe.js', READS_WINDOW);
    expect(messages.join('\n')).toMatch(/must not touch the browser/);
  });

  it('rejects reading the browser in a .jsx file too', async () => {
    const messages = await lint('src/domain/probe.jsx', READS_WINDOW);
    expect(messages.join('\n')).toMatch(/must not touch the browser/);
  });

  it('rejects importing presentation from the domain', async () => {
    const messages = await lint('src/domain/probe.js', IMPORTS_PRESENTATION);
    expect(messages.join('\n')).toMatch(/must not import presentation/);
  });
});

describe('infrastructure layer enforcement', () => {
  it('rejects importing presentation, in .js and .jsx alike', async () => {
    for (const path of ['src/infrastructure/probe.js', 'src/infrastructure/probe.jsx']) {
      const messages = await lint(path, IMPORTS_PRESENTATION);
      expect(messages.join('\n'), path).toMatch(/must not import presentation/);
    }
  });

  it('allows three.js, which is what this layer exists for', async () => {
    const messages = await lint('src/infrastructure/probe.js', IMPORTS_THREE);
    expect(messages.join('\n')).not.toMatch(/framework free/);
  });
});
