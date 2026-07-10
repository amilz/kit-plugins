import {
    assertIsSingleTransactionPlan,
    Base64EncodedWireTransaction,
    ClientWithPayer,
    createTransactionMessage,
    createTransactionPlanner,
    extendClient,
    getBase64EncodedWireTransaction,
    InstructionPlanInput,
    parseInstructionPlanInput,
    partiallySignTransactionMessageWithSigners,
    pipe,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    Transaction,
    TransactionWithinSizeLimit,
    TransactionWithLifetime,
} from '@solana/kit';

import { ClientWithTransactionLifetime } from './lifetime';

/**
 * Configuration options for the offline transaction builder.
 */
// TODO(amilz): Add support for v1 transactions when `createTransactionMessage` supports them.
// This includes: `version: 1` and native transaction config (e.g. priority fees and compute
// unit limits) in a new union variant, instead of compute budget instructions.
export type OfflineTransactionBuilderConfig = {
    /**
     * The transaction message version to use when creating transaction messages.
     * Defaults to version 0.
     */
    version?: 'legacy' | 0;
};

/**
 * Configuration options for the `buildTransaction` and `buildTransactionBase64` functions.
 */
export type BuildTransactionConfig = Readonly<{
    /** The signal to abort the transaction building process. */
    abortSignal?: AbortSignal;
}>;

/**
 * The shape of a client that has `buildTransaction` and `buildTransactionBase64` properties.
 *
 * @see {@link offlineTransactionBuilder}
 */
export type ClientWithTransactionBuilding = {
    buildTransaction(
        input: InstructionPlanInput,
        config?: BuildTransactionConfig,
    ): Promise<Transaction & TransactionWithinSizeLimit & TransactionWithLifetime>;
    buildTransactionBase64(
        input: InstructionPlanInput,
        config?: BuildTransactionConfig,
    ): Promise<Base64EncodedWireTransaction>;
};

/**
 * A plugin that adds `buildTransaction` and `buildTransactionBase64` functions
 * on the client to assemble transactions without any RPC connection.
 *
 * This expects the client to have both a `payer` and a `transactionLifetime` set —
 * for example via the {@link feePayerAddress} and {@link staticLifetime} plugins.
 *
 * The `buildTransaction` function plans the provided instructions into a single
 * transaction message, compiles it, and signs it with every signer attached to
 * the message. Signers that cannot sign locally — such as the noop signer
 * installed by {@link feePayerAddress} — contribute no signature, making the
 * result ready for co-signing by a remote signer. The `buildTransactionBase64`
 * function additionally encodes the transaction into its base64 wire format,
 * ready to be transported over the network.
 *
 * @param config - Optional configuration for the builder.
 *
 * @example
 * ```ts
 * import { createClient } from '@solana/kit';
 * import { feePayerAddress, offlineTransactionBuilder, staticLifetime } from '@solana/kit-plugin-offline';
 *
 * const client = createClient()
 *     .use(feePayerAddress(remoteSignerAddress))
 *     .use(staticLifetime({ blockhash, lastValidBlockHeight }))
 *     .use(offlineTransactionBuilder());
 *
 * // Build a partially signed transaction, ready for co-signing.
 * const transaction = await client.buildTransaction(instructions);
 *
 * // Build a base64 encoded wire transaction, ready for transport.
 * const wireTransaction = await client.buildTransactionBase64(instructions);
 * ```
 *
 * @see {@link feePayerAddress}
 * @see {@link staticLifetime}
 * @see {@link noopLifetime}
 */
export function offlineTransactionBuilder(config: OfflineTransactionBuilderConfig = {}) {
    return <T extends ClientWithPayer & ClientWithTransactionLifetime>(client: T) => {
        const transactionPlanner = createTransactionPlanner({
            createTransactionMessage: () => {
                return pipe(
                    createTransactionMessage({ version: config.version ?? 0 }),
                    tx => setTransactionMessageFeePayerSigner(client.payer, tx),
                    tx => setTransactionMessageLifetimeUsingBlockhash(client.transactionLifetime, tx),
                );
            },
        });

        const buildTransaction: ClientWithTransactionBuilding['buildTransaction'] = async (input, config = {}) => {
            const instructionPlan = parseInstructionPlanInput(input);
            config.abortSignal?.throwIfAborted();
            const transactionPlan = await transactionPlanner(instructionPlan, config);
            assertIsSingleTransactionPlan(transactionPlan);
            return await partiallySignTransactionMessageWithSigners(transactionPlan.message, config);
        };

        const buildTransactionBase64: ClientWithTransactionBuilding['buildTransactionBase64'] = async (
            input,
            config = {},
        ) => {
            return getBase64EncodedWireTransaction(await buildTransaction(input, config));
        };

        return extendClient(client, { buildTransaction, buildTransactionBase64 });
    };
}
