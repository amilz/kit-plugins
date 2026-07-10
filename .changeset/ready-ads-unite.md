---
'@solana/kit-plugin-offline': minor
---

Add `@solana/kit-plugin-offline` — a new package for assembling transactions without any RPC connection. It provides `feePayerAddress` to set a fee payer known only by its `Address`, `staticLifetime` / `noopLifetime` to supply the transaction lifetime that RPC executors otherwise fetch, and `offlineTransactionBuilder` which adds `buildTransaction` and `buildTransactionBase64` functions on the client to produce partially signed transactions and base64 encoded wire transactions, ready for remote co-signing.
