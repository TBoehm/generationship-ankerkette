import { spawn } from 'node:child_process';
import { PORT } from './port.mjs';

const [command, ...rest] = process.argv.slice(2);
const child = spawn(command, [...rest, '--port', String(PORT), '--strictPort'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
child.on('exit', (code) => process.exit(code ?? 1));
