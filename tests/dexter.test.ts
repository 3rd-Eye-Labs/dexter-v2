import { Dexter, LoadDexter, MinswapV2 } from '../src/index.js';

test('can create instance', async () => {
    const dexter = await LoadDexter({});

    expect(dexter).toBeInstanceOf(Dexter);
});

test('can use helper', async () => {
    const dexter = await LoadDexter({});

    expect(dexter.minswapV2).toBeInstanceOf(MinswapV2);
});