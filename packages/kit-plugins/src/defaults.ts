import { localhostRpc } from '@solana/kit-plugin-rpc';
import { createEmptyClient } from '@solana/plugin-core';

export function createDefaultLocalhostClient() {
    return createEmptyClient().use(localhostRpc());
}
