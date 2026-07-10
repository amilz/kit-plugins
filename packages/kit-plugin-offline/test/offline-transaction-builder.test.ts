import {
    AccountRole,
    AccountSignerMeta,
    Address,
    appendTransactionMessageInstruction,
    Base64EncodedWireTransaction,
    Blockhash,
    compileTransaction,
    createClient,
    createTransactionMessage,
    generateKeyPairSigner,
    getBase64EncodedWireTransaction,
    getBase64Encoder,
    getCompiledTransactionMessageDecoder,
    getTransactionDecoder,
    Instruction,
    pipe,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    Transaction,
    TransactionWithinSizeLimit,
    TransactionWithLifetime,
} from '@solana/kit';
import { assert, describe, expect, expectTypeOf, it } from 'vitest';

import { feePayerAddress, noopLifetime, offlineTransactionBuilder, staticLifetime } from '../src';

const FEE_PAYER = 'So11111111111111111111111111111111111111112' as Address;
const LIFETIME = {
    blockhash: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Blockhash,
    lastValidBlockHeight: 1234n,
};
const MEMO_PROGRAM_ADDRESS = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr' as Address;

function getMemoInstruction(memo: string): Instruction {
    return {
        data: new TextEncoder().encode(memo),
        programAddress: MEMO_PROGRAM_ADDRESS,
    };
}

function getOfflineClient() {
    return createClient()
        .use(feePayerAddress(FEE_PAYER))
        .use(staticLifetime(LIFETIME))
        .use(offlineTransactionBuilder());
}

describe('offlineTransactionBuilder', () => {
    it('adds buildTransaction and buildTransactionBase64 functions on the client', () => {
        const client = getOfflineClient();
        expect(client).toHaveProperty('buildTransaction');
        expect(client).toHaveProperty('buildTransactionBase64');
        expectTypeOf(client.buildTransaction).returns.resolves.toEqualTypeOf<
            Transaction & TransactionWithinSizeLimit & TransactionWithLifetime
        >();
        expectTypeOf(client.buildTransactionBase64).returns.resolves.toEqualTypeOf<Base64EncodedWireTransaction>();
    });

    describe('client.buildTransaction', () => {
        it('builds a transaction with the configured fee payer and lifetime', async () => {
            const client = getOfflineClient();
            const transaction = await client.buildTransaction(getMemoInstruction('Hello, world!'));

            const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
            expect(compiledMessage.staticAccounts[0]).toBe(FEE_PAYER);
            expect(compiledMessage.lifetimeToken).toBe(LIFETIME.blockhash);
            expect(transaction.lifetimeConstraint).toStrictEqual(LIFETIME);
        });

        it('leaves the signature of an address-only fee payer missing', async () => {
            const client = getOfflineClient();
            const transaction = await client.buildTransaction(getMemoInstruction('Hello, world!'));
            expect(transaction.signatures).toStrictEqual({ [FEE_PAYER]: null });
        });

        it('signs the transaction with signers attached to the instructions', async () => {
            const localSigner = await generateKeyPairSigner();
            const accounts: AccountSignerMeta[] = [
                { address: localSigner.address, role: AccountRole.READONLY_SIGNER, signer: localSigner },
            ];
            const instruction: Instruction = { ...getMemoInstruction('Hello, world!'), accounts };

            const client = getOfflineClient();
            const transaction = await client.buildTransaction(instruction);

            expect(transaction.signatures[FEE_PAYER]).toBeNull();
            expect(transaction.signatures[localSigner.address]).toHaveLength(64);
        });

        it('packs multiple instructions into a single transaction', async () => {
            const client = getOfflineClient();
            const transaction = await client.buildTransaction([
                getMemoInstruction('Hello,'),
                getMemoInstruction('world!'),
            ]);

            const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
            assert(compiledMessage.version === 0);
            expect(compiledMessage.instructions).toHaveLength(2);
        });

        it('fails when the instructions cannot fit into a single transaction', async () => {
            const client = getOfflineClient();
            const instructions = Array.from({ length: 20 }, (_, index) => getMemoInstruction(`Memo ${index}`));
            await expect(client.buildTransaction(instructions)).rejects.toThrow();
        });

        it('uses transaction message version 0 by default', async () => {
            const client = getOfflineClient();
            const transaction = await client.buildTransaction(getMemoInstruction('Hello, world!'));
            const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
            expect(compiledMessage.version).toBe(0);
        });

        it('uses the configured transaction message version', async () => {
            const client = createClient()
                .use(feePayerAddress(FEE_PAYER))
                .use(staticLifetime(LIFETIME))
                .use(offlineTransactionBuilder({ version: 'legacy' }));
            const transaction = await client.buildTransaction(getMemoInstruction('Hello, world!'));
            const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
            expect(compiledMessage.version).toBe('legacy');
        });

        it('works with the placeholder lifetime from noopLifetime()', async () => {
            const client = createClient()
                .use(feePayerAddress(FEE_PAYER))
                .use(noopLifetime())
                .use(offlineTransactionBuilder());
            const transaction = await client.buildTransaction(getMemoInstruction('Hello, world!'));
            const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
            expect(compiledMessage.lifetimeToken).toBe('11111111111111111111111111111111');
        });

        it('fails when the provided abort signal is already aborted', async () => {
            const client = getOfflineClient();
            const abortController = new AbortController();
            abortController.abort();
            await expect(
                client.buildTransaction(getMemoInstruction('Hello, world!'), {
                    abortSignal: abortController.signal,
                }),
            ).rejects.toThrow();
        });
    });

    describe('client.buildTransactionBase64', () => {
        it('encodes the built transaction into its base64 wire format', async () => {
            const client = getOfflineClient();
            const instruction = getMemoInstruction('Hello, world!');
            const wireTransaction = await client.buildTransactionBase64(instruction);

            const transaction = getTransactionDecoder().decode(getBase64Encoder().encode(wireTransaction));
            const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
            expect(compiledMessage.staticAccounts[0]).toBe(FEE_PAYER);
            expect(compiledMessage.lifetimeToken).toBe(LIFETIME.blockhash);
        });

        it('produces the same wire transaction as a manually piped transaction message', async () => {
            const instruction = getMemoInstruction('Hello from the keychain demo!');
            const manuallyPipedWireTransaction = getBase64EncodedWireTransaction(
                compileTransaction(
                    pipe(
                        createTransactionMessage({ version: 0 }),
                        tx => setTransactionMessageFeePayer(FEE_PAYER, tx),
                        tx =>
                            setTransactionMessageLifetimeUsingBlockhash(
                                {
                                    blockhash: '11111111111111111111111111111111' as Blockhash,
                                    lastValidBlockHeight: 0n,
                                },
                                tx,
                            ),
                        tx => appendTransactionMessageInstruction(instruction, tx),
                    ),
                ),
            );

            const client = createClient()
                .use(feePayerAddress(FEE_PAYER))
                .use(noopLifetime())
                .use(offlineTransactionBuilder());
            expect(await client.buildTransactionBase64(instruction)).toBe(manuallyPipedWireTransaction);
        });
    });
});
