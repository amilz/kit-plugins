import solanaConfig from '@solana/eslint-config-solana';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    { ignores: ['**/dist/**', '**/tsup.config.ts'] },
    { files: ['**/*.ts', '**/*.(c|m)?js'], extends: [solanaConfig] },
]);
