import { createEmptyClient, generateKeyPairSigner, lamports } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import {
    assertIsFailedTransaction,
    assertIsSuccessfulSimulation,
    assertIsSuccessfulTransaction,
    isFailedTransaction,
    isSuccessfulSimulation,
    isSuccessfulTransaction,
    litesvm,
    type SimulationResult,
    type TransactionResult,
} from '../src';

describe('Transaction Assertions', () => {
    it('type guards correctly identify transaction results', () => {
        const success = { computeUnitsConsumed: () => 1000n } as unknown as TransactionResult;
        const failure = { err: () => 'InsufficientFunds' } as unknown as TransactionResult;

        expect(isSuccessfulTransaction(success)).toBe(true);
        expect(isSuccessfulTransaction(failure)).toBe(false);
        expect(isSuccessfulTransaction(null)).toBe(false);

        expect(isFailedTransaction(failure)).toBe(true);
        expect(isFailedTransaction(success)).toBe(false);
        expect(isFailedTransaction(null)).toBe(false);
    });

    it('type guards correctly identify simulation results', () => {
        const success = { meta: () => ({}), postAccounts: () => [] } as unknown as SimulationResult;
        const failure = { err: () => 'SimulationError' } as unknown as SimulationResult;

        expect(isSuccessfulSimulation(success)).toBe(true);
        expect(isSuccessfulSimulation(failure)).toBe(false);
    });

    it('assertIsSuccessfulTransaction throws for failures and null', () => {
        const failure = { err: () => ({ toString: () => 'InsufficientFunds' }) } as unknown as TransactionResult;

        expect(() => assertIsSuccessfulTransaction(null)).toThrow('Expected successful transaction but got null');
        expect(() => assertIsSuccessfulTransaction(failure)).toThrow('Transaction failed: InsufficientFunds');
    });

    it('assertIsFailedTransaction throws for successes and null', () => {
        const success = { computeUnitsConsumed: () => 1000n } as unknown as TransactionResult;

        expect(() => assertIsFailedTransaction(null)).toThrow('Expected failed transaction but got null');
        expect(() => assertIsFailedTransaction(success)).toThrow(
            'Expected failed transaction but got successful result',
        );
    });

    it('assertIsSuccessfulSimulation throws for failures', () => {
        const failure = { err: () => ({ toString: () => 'SimulationError' }) } as unknown as SimulationResult;

        expect(() => assertIsSuccessfulSimulation(failure)).toThrow('Simulation failed: SimulationError');
    });

    it('works with real airdrop results', async () => {
        const client = createEmptyClient().use(litesvm());
        const recipient = await generateKeyPairSigner();

        const result = client.svm.airdrop(recipient.address, lamports(1_000_000_000n));

        expect(isSuccessfulTransaction(result)).toBe(true);
        assertIsSuccessfulTransaction(result);
    });

    it('handles null transaction results', () => {
        const nullResult: TransactionResult = null;

        expect(isSuccessfulTransaction(nullResult)).toBe(false);
        expect(isFailedTransaction(nullResult)).toBe(false);
        expect(() => assertIsSuccessfulTransaction(nullResult)).toThrow();
    });
});
