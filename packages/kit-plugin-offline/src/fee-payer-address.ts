import { Address, createNoopSigner, extendClient } from '@solana/kit';

/**
 * Sets a fee payer known only by its `Address` as the `payer` property on the client.
 *
 * Use this when the fee payer's signer is not available locally — for example
 * when it lives behind an API, KMS, HSM, or hardware wallet. The address is
 * wrapped in a noop signer so that all payer-aware plugins keep working, while
 * contributing no signature when the transaction is signed. The resulting
 * transaction can then be sent to the remote signer for co-signing.
 *
 * @param address - The address of the fee payer to set as the payer.
 *
 * @example
 * ```ts
 * import { address, createClient } from '@solana/kit';
 * import { feePayerAddress } from '@solana/kit-plugin-offline';
 *
 * const client = createClient().use(feePayerAddress(address('1234..5678')));
 * ```
 *
 * @see {@link offlineTransactionBuilder}
 */
export function feePayerAddress(address: Address) {
    return <T extends object>(client: T) => extendClient(client, { payer: createNoopSigner(address) });
}
