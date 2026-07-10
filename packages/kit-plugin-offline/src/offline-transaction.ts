import { Address, pipe } from '@solana/kit';

import { feePayerAddress } from './fee-payer-address';
import { noopLifetime, staticLifetime, TransactionLifetime } from './lifetime';
import { offlineTransactionBuilder, OfflineTransactionBuilderConfig } from './offline-transaction-builder';

/**
 * Configuration options for the {@link offlineTransaction} plugin.
 *
 * Extends {@link OfflineTransactionBuilderConfig}, so the `version` option is
 * forwarded to the underlying {@link offlineTransactionBuilder}.
 */
export type OfflineTransactionConfig = OfflineTransactionBuilderConfig & {
    /**
     * The address of the fee payer, wrapped in a noop signer so the resulting
     * transaction is ready for remote co-signing.
     */
    feePayerAddress: Address;
    /**
     * The blockhash lifetime to use. Omit to use the all-zero placeholder
     * lifetime from {@link noopLifetime}.
     */
    lifetime?: TransactionLifetime;
};

/**
 * A single plugin that assembles an offline transaction client in one `.use()`.
 *
 * This composes the {@link feePayerAddress}, {@link staticLifetime} /
 * {@link noopLifetime}, and {@link offlineTransactionBuilder} plugins so the
 * client gains `buildTransaction` and `buildTransactionBase64` functions
 * without any RPC connection. The fee payer is set from its address alone —
 * wrapped in a noop signer — leaving the transaction ready for co-signing by a
 * remote signer.
 *
 * When a `lifetime` is provided it is applied via {@link staticLifetime};
 * otherwise the placeholder lifetime from {@link noopLifetime} is used, which
 * cannot land on the network and must be replaced before sending.
 *
 * @param config - The fee payer address, an optional blockhash lifetime, and any {@link offlineTransactionBuilder} options.
 *
 * @example
 * Placeholder lifetime, ready to be replaced before sending:
 * ```ts
 * import { address, createClient } from '@solana/kit';
 * import { offlineTransaction } from '@solana/kit-plugin-offline';
 *
 * const client = createClient().use(offlineTransaction({ feePayerAddress: address('1234..5678') }));
 * const wireTransaction = await client.buildTransactionBase64(instructions);
 * ```
 *
 * @example
 * Real blockhash obtained out-of-band, ready to land on the network:
 * ```ts
 * import { address, createClient } from '@solana/kit';
 * import { offlineTransaction } from '@solana/kit-plugin-offline';
 *
 * const client = createClient().use(
 *     offlineTransaction({
 *         feePayerAddress: address('1234..5678'),
 *         lifetime: { blockhash, lastValidBlockHeight },
 *     }),
 * );
 * const transaction = await client.buildTransaction(instructions);
 * ```
 *
 * @see {@link feePayerAddress}
 * @see {@link staticLifetime}
 * @see {@link noopLifetime}
 * @see {@link offlineTransactionBuilder}
 */
export function offlineTransaction({ feePayerAddress: address, lifetime, ...config }: OfflineTransactionConfig) {
    return <T extends object>(client: T) =>
        pipe(
            client,
            feePayerAddress(address),
            lifetime ? staticLifetime(lifetime) : noopLifetime(),
            offlineTransactionBuilder(config),
        );
}
