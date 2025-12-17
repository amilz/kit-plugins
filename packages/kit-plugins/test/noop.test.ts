import { expect, test } from 'vitest';

import { createDefaultClient } from '../src';

test('it exports a function', () => {
    expect(createDefaultClient).toBeTypeOf('function');
});
