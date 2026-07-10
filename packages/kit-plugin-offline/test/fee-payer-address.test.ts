import { Address, createClient, isTransactionSigner } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { feePayerAddress } from '../src';

describe('feePayerAddress', () => {
    it('sets the payer attribute with a signer for the provided address', () => {
        const address = 'So11111111111111111111111111111111111111112' as Address;
        const client = createClient().use(feePayerAddress(address));
        expect(client).toHaveProperty('payer');
        expect(client.payer.address).toBe(address);
        expect(isTransactionSigner(client.payer)).toBe(true);
    });

    it('sets a noop payer that contributes no signatures', async () => {
        const address = 'So11111111111111111111111111111111111111112' as Address;
        const client = createClient().use(feePayerAddress(address));
        expect(await client.payer.signTransactions([])).toStrictEqual([]);
    });

    it('allows feePayerAddress() to override a previously set payer', () => {
        const firstAddress = 'So11111111111111111111111111111111111111112' as Address;
        const secondAddress = 'Stake11111111111111111111111111111111111111' as Address;
        const client = createClient().use(feePayerAddress(firstAddress)).use(feePayerAddress(secondAddress));
        expect(client.payer.address).toBe(secondAddress);
    });
});
