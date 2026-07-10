import { Blockhash, BlockhashLifetimeConstraint, extendClient } from '@solana/kit';

/**
 * The transaction lifetime stored on the client by lifetime plugins
 * such as {@link staticLifetime} and {@link noopLifetime}.
 */
export type TransactionLifetime = BlockhashLifetimeConstraint;

/**
 * The shape of a client that has a `transactionLifetime` property.
 *
 * @see {@link staticLifetime}
 * @see {@link noopLifetime}
 */
export type ClientWithTransactionLifetime = {
    transactionLifetime: TransactionLifetime;
};

/**
 * Sets the provided lifetime as the `transactionLifetime` property on the client.
 *
 * Use this to supply the transaction lifetime that RPC-based executors would
 * otherwise fetch from the network — for example a recent blockhash obtained
 * out-of-band when assembling transactions offline.
 *
 * @param lifetime - The blockhash and last valid block height to use as the transaction lifetime.
 *
 * @example
 * ```ts
 * import { createClient } from '@solana/kit';
 * import { staticLifetime } from '@solana/kit-plugin-offline';
 *
 * const client = createClient().use(staticLifetime({ blockhash, lastValidBlockHeight }));
 * ```
 *
 * @see {@link noopLifetime}
 * @see {@link offlineTransactionBuilder}
 */
export function staticLifetime(lifetime: TransactionLifetime) {
    return <T extends object>(client: T) => extendClient(client, { transactionLifetime: lifetime });
}

/**
 * Sets a placeholder lifetime as the `transactionLifetime` property on the client.
 *
 * The placeholder uses the all-zero blockhash, so transactions built with it
 * cannot land on the network. Use it for demos, tests, or flows where the
 * lifetime is replaced before sending — use {@link staticLifetime} with a real
 * blockhash otherwise.
 *
 * @example
 * ```ts
 * import { createClient } from '@solana/kit';
 * import { noopLifetime } from '@solana/kit-plugin-offline';
 *
 * const client = createClient().use(noopLifetime());
 * ```
 *
 * @see {@link staticLifetime}
 * @see {@link offlineTransactionBuilder}
 */
export function noopLifetime() {
    return staticLifetime({
        blockhash: '11111111111111111111111111111111' as Blockhash,
        lastValidBlockHeight: 0n,
    });
}
