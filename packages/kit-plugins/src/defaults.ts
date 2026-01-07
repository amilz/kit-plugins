import {
    ClusterUrl,
    createEmptyClient,
    DefaultRpcSubscriptionsChannelConfig,
    lamports,
    TransactionSigner,
} from '@solana/kit';
import { airdrop, AirdropFunction } from '@solana/kit-plugin-airdrop';
import {
    defaultTransactionPlannerAndExecutorFromLitesvm,
    defaultTransactionPlannerAndExecutorFromRpc,
    sendInstructionPlans,
} from '@solana/kit-plugin-instruction-plan';
import { litesvm } from '@solana/kit-plugin-litesvm';
import { generatedPayerWithSol, payer } from '@solana/kit-plugin-payer';
import { localhostRpc, rpc } from '@solana/kit-plugin-rpc';

export function createDefaultRpcClient<TClusterUrl extends ClusterUrl>(config: {
    payer: TransactionSigner;
    rpcSubscriptionsConfig?: DefaultRpcSubscriptionsChannelConfig<TClusterUrl>;
    url: TClusterUrl;
}) {
    return createEmptyClient()
        .use(rpc<TClusterUrl>(config.url, config.rpcSubscriptionsConfig))
        .use(payer(config.payer))
        .use(defaultTransactionPlannerAndExecutorFromRpc())
        .use(sendInstructionPlans());
}

export function createDefaultLocalhostRpcClient(config: { payer?: TransactionSigner } = {}) {
    return createEmptyClient()
        .use(localhostRpc())
        .use(airdrop())
        .use(payerOrGeneratedPayer(config.payer))
        .use(defaultTransactionPlannerAndExecutorFromRpc())
        .use(sendInstructionPlans());
}

export function createDefaultLiteSVMClient(config: { payer?: TransactionSigner } = {}) {
    return createEmptyClient()
        .use(litesvm())
        .use(airdrop())
        .use(payerOrGeneratedPayer(config.payer))
        .use(defaultTransactionPlannerAndExecutorFromLitesvm())
        .use(sendInstructionPlans());
}

/**
 * Helper function that uses the provided payer if any,
 * otherwise generates a new payer and funds it with 100 SOL.
 */
function payerOrGeneratedPayer(explicitPayer: TransactionSigner | undefined) {
    return <T extends { airdrop: AirdropFunction }>(client: T): Promise<T & { payer: TransactionSigner }> => {
        if (explicitPayer) {
            return Promise.resolve(payer(explicitPayer)(client));
        }
        return generatedPayerWithSol(lamports(100_000_000_000n))(client);
    };
}
