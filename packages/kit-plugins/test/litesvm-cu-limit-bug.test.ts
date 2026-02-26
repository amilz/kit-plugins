import { SingleTransactionPlanResult, singleInstructionPlan } from '@solana/kit';
import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    parseSetComputeUnitLimitInstruction,
} from '@solana-program/compute-budget';
import { getAddMemoInstruction } from '@solana-program/memo';
import { describe, expect, it } from 'vitest';

import { createDefaultLiteSVMClient } from '../src';

describe('LiteSVM CU limit bug', () => {
    if (!__NODEJS__) return;

    it('plans transactions with SetComputeUnitLimit(0) because the provisory placeholder is never replaced', async () => {
        const client = await createDefaultLiteSVMClient();

        const memoInstruction = getAddMemoInstruction({ memo: 'hello' });
        const plan = await client.planTransactions(singleInstructionPlan(memoInstruction));

        // The planner should prepend a SetComputeUnitLimit instruction.
        const cuInstruction = plan.message.instructions[0];
        expect(cuInstruction.programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);

        // BUG: The planner adds a provisory SetComputeUnitLimit(0) placeholder.
        // The RPC executor replaces it with a real estimate via simulation,
        // but the LiteSVM executor never does — so the transaction ships with 0 CUs.
        const parsed = parseSetComputeUnitLimitInstruction(cuInstruction);
        expect(parsed.data.units).toBe(0);
    });

    it('executes transactions with SetComputeUnitLimit(0) — the executor never estimates the real value', async () => {
        const client = await createDefaultLiteSVMClient();

        const memoInstruction = getAddMemoInstruction({ memo: 'hello' });
        const result = (await client.sendTransactions(
            singleInstructionPlan(memoInstruction),
        )) as SingleTransactionPlanResult;

        // The executor should have populated the context message.
        expect(result.context.message).toBeDefined();
        const message = result.context.message!;

        // The executed transaction message still has SetComputeUnitLimit(0).
        const cuInstruction = message.instructions[0];
        expect(cuInstruction.programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);

        const parsed = parseSetComputeUnitLimitInstruction(cuInstruction as Parameters<typeof parseSetComputeUnitLimitInstruction>[0]);
        expect(parsed.data.units).toBe(0);
    });
});
