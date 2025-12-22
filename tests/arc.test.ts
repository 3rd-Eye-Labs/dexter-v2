import { Dexter, LoadDexter, MinswapV2 } from '../src/index.js';

test('can create instance', async () => {
    const arc = await LoadDexter({});

    expect(arc).toBeInstanceOf(Dexter);
});

test('can use helper', async () => {
    const arc = await LoadDexter({});

    expect(arc.minswapV2).toBeInstanceOf(MinswapV2);
});