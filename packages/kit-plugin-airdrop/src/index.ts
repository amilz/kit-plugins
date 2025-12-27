import { Address, airdropFactory, Lamports } from '@solana/kit';

type LiteSVMClient = {
    svm: { airdrop: (address: Address, lamports: Lamports) => unknown };
};
type RpcClient = {
    rpc: Parameters<typeof airdropFactory>[0]['rpc'];
    rpcSubscriptions: Parameters<typeof airdropFactory>[0]['rpcSubscriptions'];
};

/**
 * Function type for the `airdrop` method added to the client.
 *
 * @param address - The address to which the airdrop will be sent.
 * @param amount - The amount of lamports to airdrop.
 */
export type AirdropFunction = (address: Address, amount: Lamports) => Promise<void>;

/**
 * A plugin that adds an `airdrop` method to the client.
 *
 * This will use the LiteSVM's internal airdrop method if the
 * client has LiteSVM installed. Otherwise, it will rely on the
 * `Rpc` and `RpcSubscriptions` clients to perform the airdrop.
 *
 * @example
 * RPC-based airdrop.
 * ```ts
 * import { createEmptyClient } from '@solana/kit';
 * import { airdrop, localhostRpc } from '@solana/kit-plugins';
 *
 * // Install the airdrop plugin using a localhost RPC.
 * const client = createEmptyClient()
 *     .use(localhostRpc())
 *     .use(airdrop());
 *
 * // Use the airdrop method.
 * client.airdrop(myAddress, lamports(1_000_000_000n));
 * ```
 *
 * @example
 * LiteSVM-based airdrop.
 * ```ts
 * import { createEmptyClient } from '@solana/kit';
 * import { airdrop, litesvm } from '@solana/kit-plugins';
 *
 * // Install the airdrop plugin using a LiteSVM instance.
 * const client = createEmptyClient()
 *     .use(litesvm())
 *     .use(airdrop());
 *
 * // Use the airdrop method.
 * client.airdrop(myAddress, lamports(1_000_000_000n));
 * ```
 *
 * @see {@link AirdropFunction}
 */
export function airdrop() {
    return <T extends LiteSVMClient | RpcClient>(client: T): T & { airdrop: AirdropFunction } => {
        if ('svm' in client) {
            const airdrop: AirdropFunction = (address, amount) => {
                client.svm.airdrop(address, amount);
                return Promise.resolve();
            };
            return { ...client, airdrop };
        }
        const airdropInternal = airdropFactory(client);
        const airdrop: AirdropFunction = async (address, amount) => {
            await airdropInternal({ commitment: 'confirmed', lamports: amount, recipientAddress: address });
        };
        return { ...client, airdrop };
    };
}
