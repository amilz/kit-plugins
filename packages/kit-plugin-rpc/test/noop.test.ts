import { expect, test } from 'vitest';

import { rpcPlugin } from '../src';

test('it exports a function', () => {
    expect(rpcPlugin).toBeTypeOf('function');
});
