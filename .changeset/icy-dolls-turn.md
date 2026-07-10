---
'@solana/kit-plugin-offline': minor
---

Add `offlineTransaction` — a composed plugin that wires `feePayerAddress`, a lifetime plugin, and `offlineTransactionBuilder` together so a client gains `buildTransaction` and `buildTransactionBase64` from a single `.use()`. It defaults to the `noopLifetime` placeholder blockhash and accepts an optional `lifetime` (applied via `staticLifetime`) for transactions that must land on the network, plus the builder's `version` option.
