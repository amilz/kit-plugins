import { Blockhash, createClient } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { noopLifetime, staticLifetime } from '../src';

describe('staticLifetime', () => {
    it('sets the transactionLifetime attribute with the provided lifetime', () => {
        const lifetime = {
            blockhash: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Blockhash,
            lastValidBlockHeight: 1234n,
        };
        const client = createClient().use(staticLifetime(lifetime));
        expect(client).toHaveProperty('transactionLifetime');
        expect(client.transactionLifetime).toBe(lifetime);
    });
});

describe('noopLifetime', () => {
    it('sets the transactionLifetime attribute with a placeholder lifetime', () => {
        const client = createClient().use(noopLifetime());
        expect(client).toHaveProperty('transactionLifetime');
        expect(client.transactionLifetime).toStrictEqual({
            blockhash: '11111111111111111111111111111111',
            lastValidBlockHeight: 0n,
        });
    });

    it('allows staticLifetime() to override a previously set placeholder lifetime', () => {
        const lifetime = {
            blockhash: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Blockhash,
            lastValidBlockHeight: 1234n,
        };
        const client = createClient().use(noopLifetime()).use(staticLifetime(lifetime));
        expect(client.transactionLifetime).toBe(lifetime);
    });
});
