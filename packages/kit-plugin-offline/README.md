# Kit Plugins ➤ Offline

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/kit-plugin-offline.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/kit-plugin-offline.svg?style=flat&label=%40solana%2Fkit-plugin-offline
[npm-url]: https://www.npmjs.com/package/@solana/kit-plugin-offline

This package offers plugins that assemble transactions without any RPC connection. Use them when the fee payer's signer lives somewhere else — behind an API, KMS, HSM, or hardware wallet — and the transaction must be built locally, then transported for co-signing. This is the offline / remote-signing / co-signing pattern.

```ts
import { createClient } from '@solana/kit';
import { feePayerAddress, offlineTransactionBuilder, staticLifetime } from '@solana/kit-plugin-offline';

const client = createClient()
    .use(feePayerAddress(remoteSignerAddress))
    .use(staticLifetime({ blockhash, lastValidBlockHeight }))
    .use(offlineTransactionBuilder());

// Build a base64 encoded wire transaction, ready for transport.
const wireTransaction = await client.buildTransactionBase64(instructions);
```

## Installation

```sh
pnpm install @solana/kit-plugin-offline
```

## `offlineTransaction` plugin (all-in-one)

This plugin composes `feePayerAddress`, a lifetime plugin, and `offlineTransactionBuilder` so you get `buildTransaction` and `buildTransactionBase64` from a single `.use()`.

```ts
import { address, createClient } from '@solana/kit';
import { offlineTransaction } from '@solana/kit-plugin-offline';

const client = createClient().use(offlineTransaction({ feePayerAddress: address('1234..5678') }));

const wireTransaction = await client.buildTransactionBase64(instructions);
```

Without a `lifetime`, it uses the placeholder blockhash from `noopLifetime` — replace it before sending. Pass a real blockhash to build a transaction that can land on the network, and pass `version` to control the transaction message version.

```ts
const client = createClient().use(
    offlineTransaction({
        feePayerAddress: address('1234..5678'),
        lifetime: { blockhash, lastValidBlockHeight },
        version: 'legacy',
    }),
);
```

The individual plugins below are still available when you need finer control.

## `feePayerAddress` plugin

This plugin sets a fee payer known only by its `Address` as the `payer` on the client. The address is wrapped in a [noop signer](https://www.solanakit.com/docs/advanced-guides/signers) so that all payer-aware plugins keep working, while contributing no signature when the transaction is signed.

```ts
import { address, createClient } from '@solana/kit';
import { feePayerAddress } from '@solana/kit-plugin-offline';

const client = createClient().use(feePayerAddress(address('1234..5678')));
```

If you do have a local `TransactionSigner` for the fee payer, use the `payer` plugin from `@solana/kit-plugin-signer` instead — the transaction builder will then sign for it directly.

## `staticLifetime` / `noopLifetime` plugins

These plugins set the `transactionLifetime` on the client — the lifetime that RPC-based executors would otherwise fetch from the network.

Use `staticLifetime` with a real blockhash obtained out-of-band when the transaction must land on the network.

```ts
import { createClient } from '@solana/kit';
import { staticLifetime } from '@solana/kit-plugin-offline';

const client = createClient().use(staticLifetime({ blockhash, lastValidBlockHeight }));
```

Use `noopLifetime` when a placeholder is enough — e.g. for demos, tests, or flows where the lifetime is replaced before sending. It uses the all-zero blockhash, so transactions built with it cannot land on the network.

```ts
import { createClient } from '@solana/kit';
import { noopLifetime } from '@solana/kit-plugin-offline';

const client = createClient().use(noopLifetime());
```

## `offlineTransactionBuilder` plugin

This plugin adds `buildTransaction` and `buildTransactionBase64` functions on the client. It requires a `payer` and a `transactionLifetime` to be set — e.g. via the plugins above.

The `buildTransaction` function plans the provided instructions into a single transaction message, compiles it, and signs it with every signer attached to the message. Signers that cannot sign locally — such as the noop signer installed by `feePayerAddress` — contribute no signature, making the result ready for co-signing by a remote signer.

```ts
// Build a partially signed transaction, ready for co-signing.
const transaction = await client.buildTransaction(instructions);
```

The `buildTransactionBase64` function additionally encodes the transaction into its base64 wire format, ready to be transported over the network.

```ts
// Build a base64 encoded wire transaction, ready for transport.
const wireTransaction = await client.buildTransactionBase64(instructions);
```

Both functions accept a single instruction, an array of instructions, an instruction plan, or a transaction message — and throw if the input cannot fit into a single transaction. You can also pass a `version` to the plugin to control the transaction message version (defaults to version 0).

```ts
const client = createClient()
    .use(feePayerAddress(remoteSignerAddress))
    .use(staticLifetime({ blockhash, lastValidBlockHeight }))
    .use(offlineTransactionBuilder({ version: 'legacy' }));
```
