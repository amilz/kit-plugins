import { env } from 'node:process';

import { defineConfig } from 'vitest/config';

export type Platform = 'browser' | 'node' | 'react-native';

export function getVitestConfig(platform: Platform) {
    return defineConfig({
        define: {
            __BROWSER__: `${platform === 'browser'}`,
            __ESM__: 'true',
            __NODEJS__: `${platform === 'node'}`,
            __REACTNATIVE__: `${platform === 'react-native'}`,
            __TEST__: 'true',
            __VERSION__: `"${env.npm_package_version}"`,
        },
        ssr: platform === 'browser' ? { noExternal: [/@solana/] } : undefined,
        resolve: {
            conditions:
                platform === 'browser'
                    ? ['browser', 'import', 'module', 'default']
                    : platform === 'react-native'
                      ? ['react-native', 'import', 'module', 'default']
                      : ['node', 'import', 'require', 'default'],
        },
        test: {
            name: platform,
            environment: platform === 'browser' ? 'happy-dom' : 'node',
            setupFiles: platform === 'browser' ? ['../../vitest.setup-browser.mts'] : undefined,
        },
    });
}
