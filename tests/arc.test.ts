import { Arc, LoadArc, MinswapV2 } from '../src/index.js';

test('can create instance', async () => {
    const arc = await LoadArc({});

    expect(arc).toBeInstanceOf(Arc);
});

test('can use helper', async () => {
    const arc = await LoadArc({});

    expect(arc.minswapV2).toBeInstanceOf(MinswapV2);
});