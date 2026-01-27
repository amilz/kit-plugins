import type { FailedTransactionMetadata, TransactionMetadata } from '@loris-sandbox/litesvm-kit';
import { SimulatedTransactionInfo } from '@loris-sandbox/litesvm-kit';

export type { FailedTransactionMetadata, TransactionMetadata } from '@loris-sandbox/litesvm-kit';
export { SimulatedTransactionInfo } from '@loris-sandbox/litesvm-kit';

/** Result from `sendTransaction`. */
export type SendTransactionResult = FailedTransactionMetadata | TransactionMetadata;

/** Result from `airdrop` or `getTransaction` (can be `null`). */
export type TransactionResult = FailedTransactionMetadata | TransactionMetadata | null;

/** Result from `simulateTransaction`. */
export type SimulationResult = FailedTransactionMetadata | SimulatedTransactionInfo;

/**
 * Checks if a transaction result is successful (`TransactionMetadata`).
 *
 * @example
 * ```ts
 * const result = client.svm.sendTransaction(tx);
 * if (isSuccessfulTransaction(result)) {
 *     console.log(result.computeUnitsConsumed());
 * }
 * ```
 */
export function isSuccessfulTransaction(
    result: SendTransactionResult | TransactionResult,
): result is TransactionMetadata {
    return result !== null && !('err' in result);
}

/**
 * Checks if a transaction result is a failure (`FailedTransactionMetadata`).
 *
 * @example
 * ```ts
 * const result = client.svm.sendTransaction(tx);
 * if (isFailedTransaction(result)) {
 *     console.error(result.err());
 * }
 * ```
 */
export function isFailedTransaction(
    result: SendTransactionResult | SimulationResult | TransactionResult,
): result is FailedTransactionMetadata {
    return result !== null && 'err' in result;
}

/**
 * Asserts that a transaction result is successful (`TransactionMetadata`).
 * Throws if the result is `null` or a `FailedTransactionMetadata`.
 *
 * @example
 * ```ts
 * const result = client.svm.airdrop(address, lamports);
 * assertIsSuccessfulTransaction(result);
 * console.log(result.computeUnitsConsumed()); // result is TransactionMetadata
 * ```
 */
export function assertIsSuccessfulTransaction(
    result: SendTransactionResult | TransactionResult,
): asserts result is TransactionMetadata {
    if (result === null) {
        throw new Error('Expected successful transaction but got null');
    }
    if ('err' in result) {
        throw new Error(`Transaction failed: ${String(result.err())}`);
    }
}

/**
 * Asserts that a transaction result is a failure (`FailedTransactionMetadata`).
 * Throws if the result is `null` or successful. Useful for testing expected failures.
 *
 * @example
 * ```ts
 * const result = client.svm.sendTransaction(badTx);
 * assertIsFailedTransaction(result);
 * expect(result.err().toString()).toContain('InsufficientFunds');
 * ```
 */
export function assertIsFailedTransaction(
    result: SendTransactionResult | SimulationResult | TransactionResult,
): asserts result is FailedTransactionMetadata {
    if (result === null) {
        throw new Error('Expected failed transaction but got null');
    }
    if (!('err' in result)) {
        throw new Error('Expected failed transaction but got successful result');
    }
}

/**
 * Checks if a simulation result is successful (`SimulatedTransactionInfo`).
 *
 * @example
 * ```ts
 * const result = client.svm.simulateTransaction(tx);
 * if (isSuccessfulSimulation(result)) {
 *     console.log(result.meta().computeUnitsConsumed());
 *     console.log(result.postAccounts());
 * }
 * ```
 */
export function isSuccessfulSimulation(result: SimulationResult): result is SimulatedTransactionInfo {
    return !('err' in result);
}

/**
 * Asserts that a simulation result is successful (`SimulatedTransactionInfo`).
 * Throws if the result is a `FailedTransactionMetadata`.
 *
 * @example
 * ```ts
 * const result = client.svm.simulateTransaction(tx);
 * assertIsSuccessfulSimulation(result);
 * console.log(result.meta().computeUnitsConsumed()); // result is SimulatedTransactionInfo
 * ```
 */
export function assertIsSuccessfulSimulation(result: SimulationResult): asserts result is SimulatedTransactionInfo {
    if ('err' in result) {
        throw new Error(`Simulation failed: ${String(result.err())}`);
    }
}
