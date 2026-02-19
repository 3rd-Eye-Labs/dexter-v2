import { MinswapV1 } from '../src/dex/MinswapV1.js';
import { Asset, LiquidityPool, LiquidityPoolState } from '@indigo-labs/iris-sdk';

const lp = new LiquidityPool(
    'MinswapV1',
    '123',
    'addr123',
    'addr123',
    'lovelace',
    new Asset('', ''),
    1,
    null,
    new LiquidityPoolState(
        1_000_000n,
        2_000_000n,
        0n,
        0.3,
        0.3,
        0n,
        1,
    )
);

const baseParams = {
    address: 'addr_test',
    liquidityPool: lp,
    minReceive: 0n,
};

test('fees returns batcherFee and deposit', () => {
    const dex = new MinswapV1({} as any);
    const fees = dex.fees(baseParams as any);

    expect(fees.find(f => f.id === 'batcherFee')).toBeDefined();
    expect(fees.find(f => f.id === 'deposit')).toBeDefined();
});

test('estimatedReceive computes positive output for inToken', () => {
    const dex = new MinswapV1({} as any);
    const params = {
        ...baseParams,
        inToken: 'lovelace',
        inAmount: 10_000n,
    } as any;

    const out = dex.estimatedReceive(params);

    expect(out).toBeGreaterThan(0n);
});

test('estimatedGive computes positive input for outToken', () => {
    const dex = new MinswapV1({} as any);
    const params = {
        ...baseParams,
        outToken: 'lovelace',
        outAmount: 10_000n,
    } as any;

    const input = dex.estimatedGive(params);

    expect(input).toBeGreaterThan(0n);
});

test('priceImpactPercent returns finite number', () => {
    const dex = new MinswapV1({} as any);
    const params = {
        ...baseParams,
        inToken: 'lovelace',
        inAmount: 10_000n,
    } as any;

    const impact = dex.priceImpactPercent(params);

    expect(Number.isFinite(impact)).toBe(true);
});

