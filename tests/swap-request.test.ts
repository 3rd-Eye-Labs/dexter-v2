import { LoadDexter } from '../src/index.js';
import { SwapRequest } from '../src/SwapRequest.js';
import { Asset, LiquidityPool, LiquidityPoolState } from '@indigo-labs/iris-sdk';

const lp = new LiquidityPool(
    'Minswap',
    '123',
    'addr123',
    'addr123',
    'lovelace',
    new Asset('', ''),
    1,
    null,
    new LiquidityPoolState(
        1n,
        1n,
        1n,
        2,
        2,
        0n,
        1,
    )
)

test('can create swap request', async () => {
    const dexter = await LoadDexter({});

    expect(dexter.swap(dexter.minswapV1)).toBeInstanceOf(SwapRequest);
});

test('can set in token swap request', async () => {
    const dexter = await LoadDexter({});
    const request = dexter.swap(dexter.minswapV1)
        .withLiquidityPool(lp)
        .withSwapInToken('lovelace');

    expect(request.swapInToken).toBe('lovelace');
});

test('can set out token swap request', async () => {
    const dexter = await LoadDexter({});
    const request = dexter.swap(dexter.minswapV1)
        .withLiquidityPool(lp)
        .withSwapOutToken('lovelace');

    expect(request.swapOutToken).toBe('lovelace');
});

test('can set in amount swap request', async () => {
    const dexter = await LoadDexter({});
    const request = dexter.swap(dexter.minswapV1)
        .withLiquidityPool(lp)
        .withSwapInToken('lovelace')
        .withSwapInAmount(10n);

    expect(request.swapInAmount).toBe(10n);
});

test('can set out amount swap request', async () => {
    const dexter = await LoadDexter({});
    const request = dexter.swap(dexter.minswapV1)
        .withLiquidityPool(lp)
        .withSwapInToken('lovelace')
        .withSwapOutAmount(10n);

    expect(request.swapOutAmount).toBe(10n);
});

test('can set slippage swap request', async () => {
    const dexter = await LoadDexter({});
    const request = dexter.swap(dexter.minswapV1)
        .withLiquidityPool(lp)
        .withSwapInToken('lovelace')
        .withSwapOutAmount(10n)
        .withSlippagePercent(1);

    expect(request.slippage).toBe(1);
});