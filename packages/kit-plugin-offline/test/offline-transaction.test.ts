import {
    Address,
    Base64EncodedWireTransaction,
    Blockhash,
    createClient,
    getCompiledTransactionMessageDecoder,
    Instruction,
    Transaction,
    TransactionWithinSizeLimit,
    TransactionWithLifetime,
} from '@solana/kit';
import { assert, describe, expect, expectTypeOf, it } from 'vitest';

import { offlineTransaction } from '../src';

const FEE_PAYER = 'So11111111111111111111111111111111111111112' as Address;
const LIFETIME = {
    blockhash: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Blockhash,
    lastValidBlockHeight: 1234n,
};
const NOOP_BLOCKHASH = '11111111111111111111111111111111';
const MEMO_PROGRAM_ADDRESS = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr' as Address;

function getMemoInstruction(memo: string): Instruction {
    return {
        data: new TextEncoder().encode(memo),
        programAddress: MEMO_PROGRAM_ADDRESS,
    };
}

describe('offlineTransaction', () => {
    it('adds buildTransaction and buildTransactionBase64 functions on the client', () => {
        const client = createClient().use(offlineTransaction({ feePayerAddress: FEE_PAYER }));
        expect(client).toHaveProperty('buildTransaction');
        expect(client).toHaveProperty('buildTransactionBase64');
        expectTypeOf(client.buildTransaction).returns.resolves.toEqualTypeOf<
            Transaction & TransactionWithinSizeLimit & TransactionWithLifetime
        >();
        expectTypeOf(client.buildTransactionBase64).returns.resolves.toEqualTypeOf<Base64EncodedWireTransaction>();
    });

    it('uses the placeholder lifetime and leaves the fee payer signature missing by default', async () => {
        const client = createClient().use(offlineTransaction({ feePayerAddress: FEE_PAYER }));
        const transaction = await client.buildTransaction(getMemoInstruction('Hello, world!'));

        const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
        expect(compiledMessage.staticAccounts[0]).toBe(FEE_PAYER);
        expect(compiledMessage.lifetimeToken).toBe(NOOP_BLOCKHASH);
        expect(transaction.signatures).toStrictEqual({ [FEE_PAYER]: null });
    });

    it('uses the provided blockhash lifetime', async () => {
        const client = createClient().use(offlineTransaction({ feePayerAddress: FEE_PAYER, lifetime: LIFETIME }));
        const transaction = await client.buildTransaction(getMemoInstruction('Hello, world!'));

        const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
        expect(compiledMessage.lifetimeToken).toBe(LIFETIME.blockhash);
        expect(transaction.lifetimeConstraint).toStrictEqual(LIFETIME);
    });

    it('forwards the transaction message version to the builder', async () => {
        const client = createClient().use(offlineTransaction({ feePayerAddress: FEE_PAYER, version: 'legacy' }));
        const transaction = await client.buildTransaction(getMemoInstruction('Hello, world!'));

        const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
        expect(compiledMessage.version).toBe('legacy');
    });

    it('packs multiple instructions into a single transaction', async () => {
        const client = createClient().use(offlineTransaction({ feePayerAddress: FEE_PAYER }));
        const transaction = await client.buildTransaction([getMemoInstruction('Hello,'), getMemoInstruction('world!')]);

        const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
        assert(compiledMessage.version === 0);
        expect(compiledMessage.instructions).toHaveLength(2);
    });
});
