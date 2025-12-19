import { Rpc, RpcSubscriptions, SolanaRpcApi, SolanaRpcSubscriptionsApi } from '@solana/kit';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { createDefaultLocalhostClient } from '../src';

describe('createDefaultLocalhostClient', () => {
    it('it offers an RPC client', () => {
        const client = createDefaultLocalhostClient();
        expect(client.rpc).toBeTypeOf('object');
        expectTypeOf(client.rpc).toEqualTypeOf<Rpc<SolanaRpcApi>>();
    });

    it('it offers an RPC Subscriptions client', () => {
        const client = createDefaultLocalhostClient();
        expect(client.rpcSubscriptions).toBeTypeOf('object');
        expectTypeOf(client.rpcSubscriptions).toEqualTypeOf<RpcSubscriptions<SolanaRpcSubscriptionsApi>>();
    });
});
